import { connectDB } from "@/lib/db";
import { getAssignmentBatchFilter } from "@/lib/batch";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import ExamAttempt from "@/models/ExamAttempt";
import { NextResponse } from "next/server";
import { format } from "date-fns";
import { auth } from "@clerk/nextjs/server";
import { resolveCurrentUser } from "@/lib/current-user";

type AttemptRow = {
    assignmentId: { toString(): string };
    submittedAt?: Date;
    finalScore?: number;
};

export async function GET() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const { user: dbUser } = await resolveCurrentUser({ role: "student" });
        if (!dbUser) {
            return NextResponse.json(
                { success: false, message: "User not found in database" },
                { status: 404 }
            );
        }

        const now = new Date();

        // 1. Get all assignments visible to the student
        const assignments = await Assignment.find(getAssignmentBatchFilter(dbUser.batch)).sort({ publishAt: -1 });
        const assignmentIds = assignments.map((assignment) => assignment._id);

        // 2. Load all per-question submissions for this student
        const allSubmissions = await Submission.find({
            userId: dbUser._id,
            assignmentId: { $in: assignmentIds },
        }).sort({ submittedAt: -1 });

        const submissionsByAssignment = new Map<string, typeof allSubmissions>();
        allSubmissions.forEach((submission) => {
            const assignmentId = submission.assignmentId.toString();
            const existing = submissionsByAssignment.get(assignmentId);

            if (existing) {
                existing.push(submission);
            } else {
                submissionsByAssignment.set(assignmentId, [submission]);
            }
        });

        // 3. For SEB assignments, release results right after final submit
        const sebAssignmentIds = assignments
            .filter((assignment) => assignment.isSebRequired)
            .map((assignment) => assignment._id);

        const submittedAttempts = (await ExamAttempt.find(
            {
                studentId: dbUser._id,
                assignmentId: { $in: sebAssignmentIds },
                status: "submitted",
            },
            "assignmentId submittedAt finalScore"
        ).lean()) as AttemptRow[];

        const attemptByAssignment = new Map(
            submittedAttempts.map((attempt) => [attempt.assignmentId.toString(), attempt])
        );

        // 4. Build whole-assignment results from question-level submissions
        const results = await Promise.all(
            assignments.map(async (assignment) => {
                const assignmentId = assignment._id.toString();
                const submissions = submissionsByAssignment.get(assignmentId) || [];

                if (submissions.length === 0) return null;

                const submittedAttempt = attemptByAssignment.get(assignmentId);
                const canShowResult = assignment.isSebRequired
                    ? Boolean(submittedAttempt)
                    : now > new Date(assignment.dueAt);

                if (!canShowResult) {
                    return null;
                }

                const obtainedMarks = typeof submittedAttempt?.finalScore === "number"
                    ? submittedAttempt.finalScore
                    : submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
                const totalMarks = assignment.totalMarks;
                const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
                const submittedProblemIds = new Set(
                    submissions.map((submission) => submission.problemId.toString())
                );

                // Derive status
                let status: "Excellent" | "Good" | "Average" | "Needs Improvement" = "Needs Improvement";
                if (percentage >= 85) status = "Excellent";
                else if (percentage >= 65) status = "Good";
                else if (percentage >= 40) status = "Average";

                // Get latest submission time
                const latestSubmission = submissions.reduce((prev, curr) => {
                    return (!prev || curr.submittedAt! > prev.submittedAt!) ? curr : prev;
                }, submissions[0]);
                const evaluatedAt = submittedAttempt?.submittedAt
                    || latestSubmission.submittedAt
                    || latestSubmission.createdAt
                    || new Date();

                return {
                    id: assignmentId,
                    assignmentTitle: assignment.title,
                    subject: "Design and Analysis of Algorithms", // Hardcoded for now as it's not in the model
                    totalProblems: assignment.totalProblems,
                    submittedProblems: submittedProblemIds.size,
                    obtainedMarks,
                    totalMarks,
                    percentage,
                    evaluatedAt: format(evaluatedAt, "dd MMM yyyy, hh:mm a"),
                    status,
                };
            })
        );

        // 5. Filter out assignments whose results are not released yet
        const filteredResults = results.filter((r) => r !== null);

        return NextResponse.json({
            success: true,
            results: filteredResults,
        });
    } catch (error) {
        console.error("Fetch Student Results Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
