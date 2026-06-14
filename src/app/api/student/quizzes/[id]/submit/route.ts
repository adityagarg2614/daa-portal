import { connectDB } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { isAssignmentAccessibleToStudent } from "@/lib/batch";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import { NextResponse } from "next/server";
import { verifyQuizSebSession, markQuizAttemptAsStarted } from "@/lib/seb";
import { headers } from "next/headers";
import { gradeQuizAttempt } from "@/lib/quiz";
import { resolveCurrentUser } from "@/lib/current-user";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id: quizId } = await params;
        const body = await req.json();
        const { userId, answers, autoSubmitted = false } = body;

        if (!quizId || !userId || !Array.isArray(answers)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "quizId, userId, and answers are required",
                },
                { status: 400 }
            );
        }

        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { user: student } = await resolveCurrentUser({ role: "student" });
        if (!student) {
            return NextResponse.json(
                { success: false, message: "Student not found" },
                { status: 404 }
            );
        }

        if (student._id.toString() !== userId) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return NextResponse.json(
                { success: false, message: "Quiz not found" },
                { status: 404 }
            );
        }

        if (!isAssignmentAccessibleToStudent(quiz.batch, student.batch)) {
            return NextResponse.json(
                { success: false, message: "This quiz is not available for your batch" },
                { status: 403 }
            );
        }

        const now = new Date();
        if (now < new Date(quiz.publishAt)) {
            return NextResponse.json(
                { success: false, message: "Quiz is not yet published" },
                { status: 403 }
            );
        }

        if (now > new Date(quiz.dueAt) && !autoSubmitted) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Quiz deadline has passed. Submission is closed.",
                },
                { status: 400 }
            );
        }

        let attempt = await QuizAttempt.findOne({
            studentId: userId,
            quizId,
        });

        if (attempt?.status === "submitted") {
            return NextResponse.json(
                { success: false, message: "Quiz already submitted" },
                { status: 403 }
            );
        }

        if (quiz.isSebRequired) {
            const sebCheck = await verifyQuizSebSession(quizId, userId);
            if (!sebCheck.success) {
                return NextResponse.json(
                    {
                        success: false,
                        message: sebCheck.message,
                        sebError: sebCheck.errorCode,
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
        }

        if (!attempt) {
            attempt = await QuizAttempt.create({
                studentId: userId,
                quizId,
                status: "started",
                startedAt: now,
                expiresAt: quiz.dueAt,
            });
        }

        const formattedAnswers = answers
            .map((answer: { questionId?: string; answer?: string }) => ({
                questionId: String(answer.questionId || "").trim(),
                answer: String(answer.answer || "").trim(),
            }))
            .filter((answer: { questionId: string; answer: string }) => answer.questionId);

        const result = gradeQuizAttempt(quiz.questions, formattedAnswers);

        attempt.answers = result.gradedAnswers;
        attempt.score = result.score;
        attempt.status = "submitted";
        attempt.submittedAt = new Date();
        attempt.startedAt = attempt.startedAt || now;
        attempt.expiresAt = quiz.dueAt;
        attempt.autoSubmitted = Boolean(autoSubmitted);
        await attempt.save();

        return NextResponse.json({
            success: true,
            message: autoSubmitted
                ? "Quiz auto-submitted successfully"
                : "Quiz submitted successfully",
            quizId,
            score: result.score,
            maxScore: quiz.totalMarks,
            answeredCount: result.answeredCount,
            totalQuestions: result.totalQuestions,
            autoSubmitted: Boolean(autoSubmitted),
            answers: result.gradedAnswers,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to submit quiz";
        return NextResponse.json(
            {
                success: false,
                message,
            },
            { status: 500 }
        );
    }
}
