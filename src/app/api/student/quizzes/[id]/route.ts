import { connectDB } from "@/lib/db";
import { isAssignmentAccessibleToStudent } from "@/lib/batch";
import {
    computeQuizStatus,
    sanitizeQuizQuestionsForStudent,
} from "@/lib/quiz";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import { NextResponse } from "next/server";
import { verifyQuizSebSession, markQuizAttemptAsStarted } from "@/lib/seb";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { resolveCurrentUser } from "@/lib/current-user";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { user } = await resolveCurrentUser({ role: "student" });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const quiz = await Quiz.findById(id);

        if (!quiz) {
            return NextResponse.json(
                { success: false, message: "Quiz not found" },
                { status: 404 }
            );
        }

        if (!isAssignmentAccessibleToStudent(quiz.batch, user.batch)) {
            return NextResponse.json(
                { success: false, message: "Quiz not found" },
                { status: 404 }
            );
        }

        let attempt = await QuizAttempt.findOne({
            studentId: user._id,
            quizId: quiz._id,
        });

        const submittedAt = attempt?.status === "submitted" ? attempt.submittedAt : null;
        const computedStatus = computeQuizStatus({
            publishAt: quiz.publishAt,
            dueAt: quiz.dueAt,
            submittedAt,
        });

        if (quiz.isSebRequired && computedStatus === "Active" && attempt?.status !== "submitted") {
            const sebCheck = await verifyQuizSebSession(id, user._id.toString());
            if (!sebCheck.success) {
                return NextResponse.json(
                    {
                        success: false,
                        message: sebCheck.message,
                        sebError: sebCheck.errorCode,
                        quizTitle: quiz.title,
                        submittedAt: sebCheck.attempt?.submittedAt,
                    },
                    { status: 403 }
                );
            }

            if (sebCheck.attempt) {
                attempt = sebCheck.attempt;
                const head = await headers();
                await markQuizAttemptAsStarted(
                    sebCheck.attempt._id.toString(),
                    head.get("user-agent") || "unknown",
                    head.get("x-forwarded-for") || "127.0.0.1"
                );
            }
        } else if (computedStatus === "Active") {
            if (!attempt) {
                attempt = await QuizAttempt.create({
                    studentId: user._id,
                    quizId: quiz._id,
                    status: "started",
                    startedAt: new Date(),
                    expiresAt: quiz.dueAt,
                });
            } else if (attempt.status === "pending") {
                attempt.status = "started";
                attempt.startedAt = attempt.startedAt || new Date();
                await attempt.save();
            }
        }

        return NextResponse.json({
            success: true,
            quiz: {
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
                    submittedAt: attempt?.status === "submitted" ? attempt.submittedAt : null,
                }),
                questions:
                    computedStatus === "Active" && attempt?.status !== "submitted"
                        ? sanitizeQuizQuestionsForStudent(quiz.questions)
                        : [],
            },
            attempt: attempt
                ? {
                      status: attempt.status,
                      score: attempt.score,
                      submittedAt: attempt.submittedAt,
                      autoSubmitted: attempt.autoSubmitted,
                      answeredCount: attempt.answers.filter(
                          (answer: { answer: string }) => answer.answer
                      ).length,
                  }
                : null,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch quiz";
        return NextResponse.json(
            { success: false, message },
            { status: 500 }
        );
    }
}
