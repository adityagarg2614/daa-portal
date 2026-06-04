import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAssignmentBatchFilter } from "@/lib/batch";
import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import Attendance from "@/models/Attendance";
import { resolveCurrentUser } from "@/lib/current-user";

type AttendanceSessionRecord = {
    userId: { toString(): string };
    present: boolean;
};

type RecentSubmissionRow = {
    _id: unknown;
    score?: number;
    createdAt: Date;
    assignmentId: { title?: string };
};

export async function GET() {
    try {
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { user } = await resolveCurrentUser({ role: "student" });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const userId = user._id;
        const assignmentBatchFilter = getAssignmentBatchFilter(user.batch);

        // 1. Fetch Assignments Count
        const totalAssignments = await Assignment.countDocuments(assignmentBatchFilter);

        // 2. Fetch Completed Assignments
        // An assignment is completed if there is a submission for it by this user
        const submissions = await Submission.find({ userId });
        const completedAssignmentIds = [...new Set(submissions.map(s => s.assignmentId.toString()))];
        const completedAssignmentsCount = completedAssignmentIds.length;

        // 3. Fetch Upcoming Assignments (Top 3 active)
        const now = new Date();
        const upcomingAssignments = await Assignment.find({
            ...assignmentBatchFilter,
            dueAt: { $gt: now },
        }).sort({ dueAt: 1 }).limit(3);

        // 4. Fetch Recent Results (Top 3)
        // Need to populate assignment title
        const recentSubmissions = await Submission.find({ userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate("assignmentId", "title");

        // 5. Calculate Average Score
        // (Sum of best scores for each problem / Sum of max marks)
        // Simplified for dashboard: average of scores in submissions
        let averageScore = 0;
        if (submissions.length > 0) {
            const totalScore = submissions.reduce((acc, curr) => acc + (curr.score || 0), 0);
            averageScore = Math.round(totalScore / submissions.length); // This is a rough average
        }

        // 6. Fetch Attendance Summary
        const attendanceSessions = await Attendance.find({
            "records.userId": userId
        });
        
        const totalSessions = attendanceSessions.length;
        const attendedSessions = attendanceSessions.filter(session => 
            session.records.find(
                (record: AttendanceSessionRecord) =>
                    record.userId.toString() === userId.toString()
            )?.present
        ).length;

        const attendancePercentage = totalSessions > 0 
            ? Math.round((attendedSessions / totalSessions) * 100) 
            : 100;

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    totalAssignments,
                    completedAssignments: completedAssignmentsCount,
                    pendingAssignments: Math.max(0, totalAssignments - completedAssignmentsCount),
                    averageScore: `${averageScore}%`,
                },
                upcomingAssignments: upcomingAssignments.map(a => ({
                    _id: a._id,
                    title: a.title,
                    due: a.dueAt,
                    status: new Date(a.publishAt) <= now ? "Active" : "Upcoming"
                })),
                recentResults: (recentSubmissions as RecentSubmissionRow[]).map((submission) => ({
                    _id: submission._id,
                    title: submission.assignmentId?.title || "Assignment",
                    score: submission.score,
                    submittedAt: submission.createdAt
                })),
                attendance: {
                    percentage: attendancePercentage
                }
            }
        });

    } catch (error) {
        console.error("Error fetching student dashboard data:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
