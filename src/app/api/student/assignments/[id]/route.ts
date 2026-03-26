import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import Problem from "@/models/Problem";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const assignment = await Assignment.findById(id).populate({ path: "problemIds", model: Problem });

        if (!assignment) {
            return NextResponse.json(
                { success: false, message: "Assignment not found" },
                { status: 404 }
            );
        }

        const now = new Date();
        let computedStatus = "Upcoming";

        if (now >= assignment.publishAt && now <= assignment.dueAt) {
            computedStatus = "Active";
        } else if (now > assignment.dueAt) {
            computedStatus = "Expired";
        }

        return NextResponse.json({
            success: true,
            assignment: {
                _id: assignment._id,
                title: assignment.title,
                description: assignment.description,
                totalProblems: assignment.totalProblems,
                totalMarks: assignment.totalMarks,
                publishAt: assignment.publishAt,
                dueAt: assignment.dueAt,
                status: computedStatus,
                problems: assignment.problemIds,
            },
        });
    } catch (error) {
        console.error("Fetch Single Assignment Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch assignment" },
            { status: 500 }
        );
    }
}