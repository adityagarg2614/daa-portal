import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import Problem from "@/models/Problem";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        await connectDB();

        const [problems, assignments, submissions] = await Promise.all([
            Problem.find().sort({ createdAt: -1 }).limit(5),
            Assignment.find().sort({ createdAt: -1 }).limit(5),
            Submission.find().sort({ createdAt: -1 }).limit(5),
        ]);

        const totalProblems = await Problem.countDocuments();
        const totalAssignments = await Assignment.countDocuments();
        const totalSubmissions = await Submission.countDocuments();

        const now = new Date();
        const allAssignments = await Assignment.find({}, { publishAt: 1, dueAt: 1 });

        const activeAssignments = allAssignments.filter((assignment) => {
            const publishAt = new Date(assignment.publishAt);
            const dueAt = new Date(assignment.dueAt);
            return now >= publishAt && now <= dueAt;
        }).length;

        return NextResponse.json({
            success: true,
            stats: {
                totalProblems,
                totalAssignments,
                totalSubmissions,
                activeAssignments,
            },
            recentProblems: problems,
            recentAssignments: assignments,
            recentSubmissions: submissions,
        });
    } catch (error) {
        console.error("Admin Dashboard Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}