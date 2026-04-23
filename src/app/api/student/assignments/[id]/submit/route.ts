import { connectDB } from "@/lib/db";
import Submission from "@/models/Submission";
import Assignment from "@/models/Assignment";
import ExamAttempt from "@/models/ExamAttempt";
import { NextResponse } from "next/server";
import { verifySebSession } from "@/lib/seb";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id: assignmentId } = await params;
        const body = await req.json();
        const { userId } = body;

        if (!assignmentId || !userId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "assignmentId and userId are required",
                },
                { status: 400 }
            );
        }

        // Verify assignment exists
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return NextResponse.json(
                { success: false, message: "Assignment not found" },
                { status: 404 }
            );
        }

        // Check if deadline has passed
        const now = new Date();
        const dueDate = new Date(assignment.dueAt);
        if (now > dueDate) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Assignment deadline has passed. Cannot submit.",
                },
                { status: 400 }
            );
        }

        // SEB Verification
        if (assignment.isSebRequired) {
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
        }

        // Find all submissions for this assignment and user
        const submissions = await Submission.find({
            assignmentId,
            userId,
            status: "Evaluated",
        });

        // Check if all problems have been attempted
        const problemIds = assignment.problemIds.map((id: string) => id.toString());
        const submittedProblemIds = submissions.map((s) => s.problemId.toString());

        const allProblemsSubmitted = problemIds.every((pid: string) =>
            submittedProblemIds.includes(pid)
        );

        // Calculate total score
        const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);

        // Update ExamAttempt
        await ExamAttempt.findOneAndUpdate(
            { studentId: userId, assignmentId: assignmentId },
            { 
                status: "submitted",
                submittedAt: new Date(),
                finalScore: totalScore
            }
        );

        return NextResponse.json({
            success: true,
            message: "Assignment submitted successfully",
            assignmentId,
            totalScore,
            maxScore: assignment.totalMarks,
            problemsSubmitted: submittedProblemIds.length,
            totalProblems: problemIds.length,
            allProblemsSubmitted,
            submissions: submissions.map((sub) => ({
                problemId: sub.problemId,
                score: sub.score,
                status: sub.status,
            })),
        });
    } catch (error) {
        console.error("Submit Assignment Error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to submit assignment",
            },
            { status: 500 }
        );
    }
}
