import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import Problem from "@/models/Problem";

export async function GET() {
    try {
        await connectDB();

        const assignments = await Assignment.find()
            .populate({ path: "problemIds", model: Problem })
            .sort({ publishAt: -1 });

        const now = new Date();

        const formattedAssignments = assignments.map((assignment) => {
            let computedStatus = "Upcoming";

            if (now >= assignment.publishAt && now <= assignment.dueAt) {
                computedStatus = "Active";
            } else if (now > assignment.dueAt) {
                computedStatus = "Expired";
            }

            return {
                _id: assignment._id,
                title: assignment.title,
                description: assignment.description,
                totalProblems: assignment.totalProblems,
                totalMarks: assignment.totalMarks,
                publishAt: assignment.publishAt,
                dueAt: assignment.dueAt,
                status: computedStatus,
                problems: assignment.problemIds,
            };
        });

        return NextResponse.json({
            success: true,
            assignments: formattedAssignments,
        });
    } catch (error) {
        console.error("Fetch Student Assignments Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch assignments" },
            { status: 500 }
        );
    }
}