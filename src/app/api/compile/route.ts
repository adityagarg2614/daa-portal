import { NextResponse } from "next/server";
import { executeCode, runTestCases, getLanguageConfig, TestCase } from "@/lib/piston";
import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import Problem from "@/models/Problem";
import {
    getProgrammingLanguageLabel,
    normalizeProgrammingLanguage,
} from "@/lib/programming-language";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            code,
            language,
            testCases: providedTestCases,
            stdin,
            problemId,
            assignmentId,
        } = body;

        if (!code || !language) {
            return NextResponse.json(
                {
                    success: false,
                    message: "code and language are required",
                },
                { status: 400 }
            );
        }

        const normalizedLanguage = normalizeProgrammingLanguage(language);
        if (!normalizedLanguage) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unsupported programming language",
                },
                { status: 400 }
            );
        }

        const langConfig = getLanguageConfig(normalizedLanguage);
        if (!langConfig) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Unsupported language: ${language}. Supported: cpp, java, python, javascript`,
                },
                { status: 400 }
            );
        }

        await connectDB();
        
        let testCasesToRun: TestCase[] = Array.isArray(providedTestCases) ? providedTestCases : [];
        let timeLimit = 2000;
        let memoryLimit = 128000;

        if (assignmentId) {
            const assignment = await Assignment.findById(assignmentId).select("language");
            const assignmentLanguage = normalizeProgrammingLanguage(assignment?.language);

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
                        message: `This assignment only allows ${getProgrammingLanguageLabel(assignmentLanguage)}`,
                    },
                    { status: 400 }
                );
            }
        }

        // If problemId is provided, fetch non-hidden test cases and constraints
        if (problemId) {
            const problem = await Problem.findById(problemId);
            if (problem) {
                timeLimit = problem.timeLimit || timeLimit;
                memoryLimit = problem.memoryLimit || memoryLimit;
                
                // Only run non-hidden test cases for the general "compile/run" endpoint
                if (testCasesToRun.length === 0) {
                    testCasesToRun = (problem.testCases || [])
                        .filter((tc: { input: string; output: string; isHidden?: boolean }) => !tc.isHidden)
                        .map((tc: { input: string; output: string }) => ({
                            input: tc.input,
                            output: tc.output
                        }));
                }
            }
        }

        // If test cases are available, run them
        if (testCasesToRun.length > 0) {
            const result = await runTestCases(code, normalizedLanguage, testCasesToRun, timeLimit, memoryLimit);

            if (result.compilationError) {
                return NextResponse.json(
                    {
                        success: false,
                        compilationError: true,
                        message: result.message || "Compilation failed",
                        error: result.compilationError,
                        results: [],
                    },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                allPassed: result.allPassed,
                totalTests: result.totalTests,
                passedTests: result.passedTests,
                results: result.results,
                executionTime: result.executionTime,
                memoryUsed: result.memoryUsed,
            });
        }

        // Otherwise, just execute the code with stdin (Manual Test mode)
        const result = await executeCode(code, normalizedLanguage, stdin || "", timeLimit, memoryLimit);

        if (!result.success && result.stderr) {
            return NextResponse.json(
                {
                    success: false,
                    compilationError: result.exitCode !== 0 && !result.stdout,
                    message: result.stderr ? "Code execution produced errors" : "Code execution failed",
                    output: result.stdout,
                    error: result.stderr,
                    executionTime: result.executionTime,
                    memoryUsed: result.memoryUsed,
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            output: result.stdout,
            error: result.stderr || null,
            executionTime: result.executionTime,
            memoryUsed: result.memoryUsed,
        });
    } catch (error) {
        console.error("Compilation Error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Failed to compile and run code",
            },
            { status: 500 }
        );
    }
}
