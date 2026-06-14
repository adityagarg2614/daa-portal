import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { isAssignmentAccessibleToStudent } from "@/lib/batch";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import { resolveCurrentUser } from "@/lib/current-user";

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

        const { user } = await resolveCurrentUser({ role: "student" });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const { id: quizId } = await params;
        const quiz = await Quiz.findById(quizId);

        if (!quiz) {
            return NextResponse.json({ success: false, message: "Quiz not found" }, { status: 404 });
        }

        if (!isAssignmentAccessibleToStudent(quiz.batch, user.batch)) {
            return NextResponse.json({ success: false, message: "Quiz not found" }, { status: 404 });
        }

        const attempt = await QuizAttempt.findOne({
            studentId: user._id,
            quizId: quiz._id,
        });

        return NextResponse.json({
            success: true,
            data: {
                quiz: {
                    title: quiz.title,
                    description: quiz.description,
                    isSebRequired: quiz.isSebRequired || false,
                    dueAt: quiz.dueAt,
                },
                attempt: attempt || null,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ success: false, message }, { status: 500 });
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

        const { user } = await resolveCurrentUser({ role: "student" });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const { id: quizId } = await params;
        const quiz = await Quiz.findById(quizId);

        if (!quiz) {
            return NextResponse.json({ success: false, message: "Quiz not found" }, { status: 404 });
        }

        if (!isAssignmentAccessibleToStudent(quiz.batch, user.batch)) {
            return NextResponse.json({ success: false, message: "Quiz not found" }, { status: 404 });
        }

        const now = new Date();
        if (now < new Date(quiz.publishAt)) {
            return NextResponse.json({ success: false, message: "Quiz is not yet published" }, { status: 403 });
        }
        if (now > new Date(quiz.dueAt)) {
            return NextResponse.json({ success: false, message: "Quiz has expired" }, { status: 403 });
        }

        let attempt = await QuizAttempt.findOne({
            studentId: user._id,
            quizId: quiz._id,
        });

        if (attempt && attempt.status === "submitted") {
            return NextResponse.json({ success: false, message: "You have already submitted this quiz" }, { status: 403 });
        }

        if (!attempt) {
            attempt = await QuizAttempt.create({
                studentId: user._id,
                quizId: quiz._id,
                status: quiz.isSebRequired ? "pending" : "started",
                startedAt: quiz.isSebRequired ? undefined : now,
                expiresAt: quiz.dueAt,
            });
        }

        return NextResponse.json({
            success: true,
            message: "Quiz attempt initialized",
            data: attempt,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
