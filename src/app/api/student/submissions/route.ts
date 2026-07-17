import { connectDB } from "@/lib/db";
import Submission from "@/models/Submission";
import Problem from "@/models/Problem";
import Assignment from "@/models/Assignment";
import { NextResponse } from "next/server";
import { runTestCases } from "@/lib/piston";
import { ITestResult } from "@/models/Submission";
import { verifySebSession, markAttemptAsStarted } from "@/lib/seb";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { isAssignmentAccessibleToStudent } from "@/lib/batch";
import { resolveCurrentUser } from "@/lib/current-user";
import {
    getProgrammingLanguageLabel,
    normalizeProgrammingLanguage,
} from "@/lib/programming-language";


export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();

        const {
            assignmentId,
            problemId,
            userId,
            code,
            language,
            runTests = true, // Default to running tests
        } = body;

        if (!assignmentId || !problemId || !userId || !code || !language) {
            return NextResponse.json(
                {
                    success: false,
                    message: "assignmentId, problemId, userId, code, and language are required",
                },
                { status: 400 }
            );
        }

        const normalizedLanguage = normalizeProgrammingLanguage(language);
        if (!normalizedLanguage) {
            return NextResponse.json(
                { success: false, message: "Unsupported programming language" },
                { status: 400 }
            );
        }

        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { user: dbUser } = await resolveCurrentUser({ role: "student" });
        if (!dbUser) {
            return NextResponse.json(
                { success: false, message: "Student not found" },
                { status: 404 }
            );
        }

        if (dbUser._id.toString() !== userId) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return NextResponse.json(
                { success: false, message: "Assignment not found" },
                { status: 404 }
            );
        }

        if (!isAssignmentAccessibleToStudent(assignment.batch, dbUser.batch)) {
            return NextResponse.json(
                { success: false, message: "This assignment is not available for your batch" },
                { status: 403 }
            );
        }

        const assignmentLanguage = normalizeProgrammingLanguage(assignment.language);
        if (!assignmentLanguage) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This assignment language is not configured yet. Please contact your admin.",
                },
                { status: 400 }
            );
        }

        if (normalizedLanguage !== assignmentLanguage) {
            return NextResponse.json(
                {
                    success: false,
                    message: `This assignment only accepts ${getProgrammingLanguageLabel(assignmentLanguage)} submissions`,
                },
                { status: 400 }
            );
        }

        // SEB Verification
        const sebCheck = await verifySebSession(assignmentId, userId);
        if (!sebCheck.success) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: sebCheck.message,
                    sebError: sebCheck.errorCode 
                },
                { status: 403 }
            );
        }

        // Mark attempt as started if it's the first submission and using SEB
        if (sebCheck.attempt) {
            const head = await headers();
            await markAttemptAsStarted(
                sebCheck.attempt._id.toString(), 
                head.get("user-agent") || "unknown",
                head.get("x-forwarded-for") || "127.0.0.1"
            );
        }

        // Fetch problem to get test cases
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return NextResponse.json(
                { success: false, message: "Problem not found" },
                { status: 404 }
            );
        }

        let testResults: ITestResult[] = [];
        let allTestsPassed = false;
        let executionTime = 0;
        let memoryUsed = 0;
        let passedTests = 0;
        let totalTests = 0;

        if (runTests && (!problem.testCases || problem.testCases.length === 0)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No test cases are configured for this problem. Please ask the admin to add test cases before submitting.",
                    testResults: [],
                    passedTests: 0,
                    totalTests: 0,
                },
                { status: 400 }
            );
        }

        // Run test cases if requested and test cases exist
        if (runTests && problem.testCases && problem.testCases.length > 0) {
            const testCases: Array<{ input: string; output: string; isHidden?: boolean }> = problem.testCases.map((tc: { input: string; output: string; isHidden?: boolean }) => ({
                input: tc.input,
                output: tc.output,
                isHidden: tc.isHidden
            }));

            const missingInputIndex = testCases.findIndex((testCase) => !testCase.input.trim());
            if (missingInputIndex !== -1) {
                return NextResponse.json(
                    {
                        success: false,
                        message: `Problem test case ${missingInputIndex + 1} is missing input. Please ask the admin to update this problem.`,
                        testResults: [],
                        passedTests: 0,
                        totalTests: testCases.length,
                    },
                    { status: 400 }
                );
            }

            // Call Piston directly (no HTTP self-fetch)
            const compileResult = await runTestCases(
                code, 
                assignmentLanguage,
                testCases, 
                problem.timeLimit || 2000, 
                problem.memoryLimit || 128000
            );


            // Compilation error — return early without saving
            if (compileResult.compilationError) {
                return NextResponse.json(
                    {
                        success: false,
                        compilationError: true,
                        message: compileResult.message || "Compilation failed",
                        error: compileResult.compilationError,
                        testResults: [],
                        passedTests: 0,
                        totalTests: compileResult.totalTests,
                    },
                    { status: 400 }
                );
            }

            // Execution service failure
            if (!compileResult.success) {
                return NextResponse.json(
                    {
                        success: false,
                        message: compileResult.message || "Failed to execute code",
                        testResults: compileResult.results || [],
                    },
                    { status: 400 }
                );
            }

            testResults = compileResult.results;
            
            // LeetCode-style: Reveal ONLY the first failing hidden test case
            let revealedOneHidden = false;
            testResults = testResults.map(res => {
                if (!res.passed && res.isHidden && !revealedOneHidden) {
                    revealedOneHidden = true;
                    return { ...res, isHidden: false }; // Reveal this one
                }
                return res;
            });

            allTestsPassed = compileResult.allPassed;

            executionTime = compileResult.executionTime;
            memoryUsed = compileResult.memoryUsed;
            passedTests = compileResult.passedTests;
            totalTests = compileResult.totalTests;

            // If not all tests pass, return results but don't save submission
            if (!allTestsPassed) {
                return NextResponse.json(
                    {
                        success: false,
                        message: `Not all test cases passed. ${passedTests}/${totalTests} tests succeeded.`,
                        testResults,
                        passedTests,
                        totalTests,
                        executionTime,
                        memoryUsed,
                    },
                    { status: 400 }
                );
            }
        }

        // Delete any previous submission for this problem and user (allow re-submission)
        await Submission.deleteOne({ userId, problemId });

        // Save submission with test results
        const submission = await Submission.create({
            assignmentId,
            problemId,
            userId,
            code,
            language: assignmentLanguage,
            status: "Evaluated",
            submittedAt: new Date(),
            score: allTestsPassed ? problem.marks : 0,
            testResults,
            executionTime,
            memoryUsed,
        });

        return NextResponse.json({
            success: true,
            message: "Submission saved successfully",
            submission,
            testResults,
            allTestsPassed,
            passedTests,
            totalTests,
        });
    } catch (error) {
        console.error("Create Submission Error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Failed to save submission",
            },
            { status: 500 }
        );
    }
}


export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "userId is required" },
                { status: 400 }
            );
        }

        const submissions = await Submission.find({ userId })
            .populate("assignmentId")
            .populate("problemId")
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            submissions,
        });
    } catch (error) {
        console.error("Fetch Submissions Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch submissions" },
            { status: 500 }
        );
    }
}
