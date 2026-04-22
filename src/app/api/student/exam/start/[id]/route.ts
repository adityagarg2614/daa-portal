import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Assignment from "@/models/Assignment";
import ExamAttempt from "@/models/ExamAttempt";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const { id: assignmentId } = await params;
        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return NextResponse.json({ success: false, message: "Assignment not found" }, { status: 404 });
        }

        // Check if user already has an attempt
        let attempt = await ExamAttempt.findOne({
            studentId: user._id,
            assignmentId: assignment._id,
        });

        return NextResponse.json({
            success: true,
            data: {
                assignment: {
                    title: assignment.title,
                    description: assignment.description,
                    isSebRequired: assignment.isSebRequired,
                    dueAt: assignment.dueAt,
                },
                attempt: attempt || null,
            },
        });

    } catch (error) {
        console.error("Error fetching exam start info:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const { id: assignmentId } = await params;
        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return NextResponse.json({ success: false, message: "Assignment not found" }, { status: 404 });
        }

        // Check if assignment is active
        const now = new Date();
        if (now < new Date(assignment.publishAt)) {
            return NextResponse.json({ success: false, message: "Assignment is not yet published" }, { status: 403 });
        }
        if (now > new Date(assignment.dueAt)) {
            return NextResponse.json({ success: false, message: "Assignment has expired" }, { status: 403 });
        }

        // Check for existing attempt
        let attempt = await ExamAttempt.findOne({
            studentId: user._id,
            assignmentId: assignment._id,
        });

        if (attempt && attempt.status === "submitted") {
            return NextResponse.json({ success: false, message: "You have already submitted this assignment" }, { status: 403 });
        }

        if (!attempt) {
            // Create new pending attempt
            attempt = await ExamAttempt.create({
                studentId: user._id,
                assignmentId: assignment._id,
                status: "pending",
                expiresAt: assignment.dueAt,
            });
        }

        return NextResponse.json({
            success: true,
            message: "Exam attempt initialized",
            data: attempt,
        });

    } catch (error) {
        console.error("Error starting exam attempt:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
