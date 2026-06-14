import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { getAssignmentBatchFilter } from "@/lib/batch";
import Assignment from "@/models/Assignment";
import Problem from "@/models/Problem";
import { resolveCurrentUser } from "@/lib/current-user";
import { normalizeProgrammingLanguage } from "@/lib/programming-language";

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

        const { user } = await resolveCurrentUser({ role: "student" });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Student not found" },
                { status: 404 }
            );
        }

        const assignments = await Assignment.find(getAssignmentBatchFilter(user.batch))
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
                language: normalizeProgrammingLanguage(assignment.language),
                totalProblems: assignment.totalProblems,
                totalMarks: assignment.totalMarks,
                batch: assignment.batch ?? null,
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
