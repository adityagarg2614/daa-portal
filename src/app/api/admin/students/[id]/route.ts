import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Submission from "@/models/Submission";
import Assignment from "@/models/Assignment";
import Problem from "@/models/Problem";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify admin role
        const adminUser = await User.findOne({ clerkId: userId });
        if (!adminUser || adminUser.role !== "admin") {
            return NextResponse.json(
                { success: false, message: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        await connectDB();

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
        const submissions = await Submission.aggregate([
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
        const uniqueAssignments = new Set(submissions.map((s: any) => s.assignmentId.toString()));
        const completedAssignmentsCount = uniqueAssignments.size;

        // Get total assignments available
        const totalAssignments = await Assignment.countDocuments();

        // Calculate rank (position of this student based on total score)
        const studentsWithScores = await User.aggregate([
            {
                $match: { role: "student" },
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

        const rank = studentsWithScores.findIndex((s: any) => s._id.toString() === studentId) + 1;

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
