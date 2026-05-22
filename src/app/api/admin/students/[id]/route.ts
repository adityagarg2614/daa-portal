import { verifyAdmin } from "@/lib/auth";
import { getAssignmentBatchFilter, normalizeBatch } from "@/lib/batch";
import User from "@/models/User";
import Submission from "@/models/Submission";
import Assignment from "@/models/Assignment";
import { NextResponse } from "next/server";

type StudentSubmissionRow = {
    assignmentId: { toString(): string };
    score?: number;
    status: string;
    language: string;
    submittedAt?: Date | null;
    executionTime?: number;
    memoryUsed?: number;
};

type StudentScoreRow = {
    _id: { toString(): string };
    totalScore: number;
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response } = await verifyAdmin();

        if (!authorized) return response;

        const { id: studentId } = await params;

        // Fetch student details
        const student = await User.findOne({ _id: studentId, role: "student" });
        if (!student) {
            return NextResponse.json(
                { success: false, message: "Student not found" },
                { status: 404 }
            );
        }

        // Fetch all submissions for this student with assignment and problem details
        const submissions: StudentSubmissionRow[] = await Submission.aggregate([
            {
                $match: { userId: student._id },
            },
            {
                $lookup: {
                    from: "assignments",
                    localField: "assignmentId",
                    foreignField: "_id",
                    as: "assignment",
                },
            },
            {
                $unwind: "$assignment",
            },
            {
                $lookup: {
                    from: "problems",
                    localField: "problemId",
                    foreignField: "_id",
                    as: "problem",
                },
            },
            {
                $unwind: "$problem",
            },
            {
                $project: {
                    _id: 1,
                    assignmentId: 1,
                    assignmentTitle: "$assignment.title",
                    assignmentDueAt: "$assignment.dueAt",
                    problemTitle: "$problem.title",
                    problemMarks: "$problem.marks",
                    score: 1,
                    status: 1,
                    language: 1,
                    submittedAt: 1,
                    executionTime: 1,
                    memoryUsed: 1,
                },
            },
            {
                $sort: { submittedAt: -1 },
            },
        ]);

        // Calculate detailed stats
        const totalSubmissions = submissions.length;
        const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
        const averageScore = totalSubmissions > 0 ? Math.round(totalScore / totalSubmissions) : 0;

        // Get unique assignments count
        const uniqueAssignments = new Set(submissions.map((submission) => submission.assignmentId.toString()));
        const completedAssignmentsCount = uniqueAssignments.size;

        // Get total assignments available
        const totalAssignments = await Assignment.countDocuments(
            getAssignmentBatchFilter(student.batch)
        );

        // Calculate rank (position of this student based on total score)
        const studentsWithScores: StudentScoreRow[] = await User.aggregate([
            {
                $match: {
                    role: "student",
                    ...(normalizeBatch(student.batch) ? { batch: normalizeBatch(student.batch) } : {}),
                },
            },
            {
                $lookup: {
                    from: "submissions",
                    localField: "_id",
                    foreignField: "userId",
                    as: "submissions",
                },
            },
            {
                $addFields: {
                    totalScore: { $sum: "$submissions.score" },
                },
            },
            {
                $sort: { totalScore: -1 },
            },
            {
                $project: {
                    _id: 1,
                    totalScore: 1,
                },
            },
        ]);

        const rank = studentsWithScores.findIndex((entry) => entry._id.toString() === studentId) + 1;

        // Get last active date
        const lastSubmission = await Submission.findOne({ userId: studentId }).sort({ submittedAt: -1 });
        const lastActive = lastSubmission?.submittedAt || null;

        // Determine status
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const status = lastActive && lastActive >= thirtyDaysAgo ? "active" : "inactive";

        return NextResponse.json({
            success: true,
            data: {
                student: {
                    _id: student._id,
                    name: student.name,
                    email: student.email,
                    rollNo: student.rollNo,
                    batch: student.batch ?? null,
                    clerkId: student.clerkId,
                    createdAt: student.createdAt,
                },
                submissions,
                stats: {
                    totalSubmissions,
                    totalScore,
                    averageScore,
                    completedAssignments: completedAssignmentsCount,
                    totalAssignments,
                    rank: rank > 0 ? rank : studentsWithScores.length,
                    lastActive,
                    status,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching student details:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch student details" },
            { status: 500 }
        );
    }
}
