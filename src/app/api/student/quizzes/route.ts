import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { getAssignmentBatchFilter } from "@/lib/batch";
import { computeQuizStatus } from "@/lib/quiz";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import { resolveCurrentUser } from "@/lib/current-user";

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

        const [quizzes, attempts] = await Promise.all([
            Quiz.find(getAssignmentBatchFilter(user.batch)).sort({ publishAt: -1 }),
            QuizAttempt.find({ studentId: user._id, status: "submitted" }).select("quizId submittedAt"),
        ]);

        const submittedByQuizId = new Map(
            attempts.map((attempt) => [attempt.quizId.toString(), attempt.submittedAt || attempt.updatedAt])
        );

        const formattedQuizzes = quizzes.map((quiz) => {
            const submittedAt = submittedByQuizId.get(quiz._id.toString()) || null;

            return {
                _id: quiz._id,
                title: quiz.title,
                description: quiz.description,
                batch: quiz.batch ?? null,
                totalQuestions: quiz.totalQuestions,
                totalMarks: quiz.totalMarks,
                publishAt: quiz.publishAt,
                dueAt: quiz.dueAt,
                isSebRequired: quiz.isSebRequired || false,
                status: computeQuizStatus({
                    publishAt: quiz.publishAt,
                    dueAt: quiz.dueAt,
                    submittedAt,
                }),
            };
        });

        return NextResponse.json({
            success: true,
            quizzes: formattedQuizzes,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch quizzes";
        return NextResponse.json(
            { success: false, message },
            { status: 500 }
        );
    }
}
