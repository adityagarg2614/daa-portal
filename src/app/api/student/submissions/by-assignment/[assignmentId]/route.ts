import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAssignmentAccessibleToStudent } from "@/lib/batch";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        await connectDB();

        const { assignmentId } = await params;
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return NextResponse.json(
                { success: false, message: "Assignment not found" },
                { status: 404 }
            );
        }

        if (!isAssignmentAccessibleToStudent(assignment.batch, user.batch)) {
            return NextResponse.json(
                { success: false, message: "Assignment not found" },
                { status: 404 }
            );
        }

        // Also support optional ?userId= for backwards compatibility
        const { searchParams } = new URL(req.url);
        const queryUserId = searchParams.get("userId");
        const resolvedUserId = queryUserId || user._id.toString();

        const submissions = await Submission.find({
            assignmentId,
            userId: resolvedUserId,
        }).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            submissions,
        });
    } catch (error) {
        console.error("Fetch Assignment Submissions Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch assignment submissions" },
            { status: 500 }
        );
    }
}
