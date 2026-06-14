import { verifyAdmin } from "@/lib/auth";
import { normalizeBatch } from "@/lib/batch";
import { validateQuizQuestions } from "@/lib/quiz";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response } = await verifyAdmin();
        if (!authorized) return response;

        const { id } = await params;

        const quiz = await Quiz.findById(id)
            .populate({
                path: "createdBy",
                model: "User",
                select: "name email",
            });

        if (!quiz) {
            return NextResponse.json(
                { success: false, message: "Quiz not found" },
                { status: 404 }
            );
        }

        const attempts = await QuizAttempt.find({ quizId: id });
        const submittedAttempts = attempts.filter((attempt) => attempt.status === "submitted");
        const averageScore =
            submittedAttempts.length > 0
                ? submittedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) /
                  submittedAttempts.length
                : 0;

        const topPerformers = await QuizAttempt.find({
            quizId: id,
            status: "submitted",
        })
            .sort({ score: -1, submittedAt: 1 })
            .limit(5)
            .populate({
                path: "studentId",
                model: "User",
                select: "name email rollNo",
            });

        return NextResponse.json({
            success: true,
            data: {
                ...JSON.parse(JSON.stringify(quiz)),
                submissionStats: {
                    total: attempts.length,
                    submitted: submittedAttempts.length,
                    pending: attempts.filter((attempt) => attempt.status !== "submitted").length,
                    averageScore: Math.round(averageScore * 100) / 100,
                    topPerformers: topPerformers.map((attempt) => ({
                        student: attempt.studentId,
                        score: attempt.score,
                        submittedAt: attempt.submittedAt,
                    })),
                },
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch quiz";
        return NextResponse.json(
            { success: false, message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response } = await verifyAdmin();
        if (!authorized) return response;

        const { id } = await params;
        const quiz = await Quiz.findById(id);

        if (!quiz) {
            return NextResponse.json(
                { success: false, message: "Quiz not found" },
                { status: 404 }
            );
        }

        await QuizAttempt.deleteMany({ quizId: id });
        await Quiz.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: "Quiz and related attempts deleted successfully",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete quiz";
        return NextResponse.json(
            { success: false, message },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response } = await verifyAdmin();
        if (!authorized) return response;

        const { id } = await params;
        const body = await req.json();

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return NextResponse.json(
                { success: false, message: "Quiz not found" },
                { status: 404 }
            );
        }

        const nextBatch =
            body.batch !== undefined ? normalizeBatch(body.batch) : quiz.batch;

        if (!nextBatch) {
            return NextResponse.json(
                { success: false, message: "Valid batch is required" },
                { status: 400 }
            );
        }

        const nextPublishAt = body.publishAt ? new Date(body.publishAt) : new Date(quiz.publishAt);
        const nextDueAt = body.dueAt ? new Date(body.dueAt) : new Date(quiz.dueAt);

        if (Number.isNaN(nextPublishAt.getTime()) || Number.isNaN(nextDueAt.getTime()) || nextPublishAt >= nextDueAt) {
            return NextResponse.json(
                { success: false, message: "Publish time must be before due time" },
                { status: 400 }
            );
        }

        let totalQuestions = quiz.totalQuestions;
        let totalMarks = quiz.totalMarks;
        let questions = quiz.questions;

        if (body.questions !== undefined) {
            const validation = validateQuizQuestions(body.questions);
            if (!validation.valid) {
                return NextResponse.json(
                    { success: false, message: validation.message },
                    { status: 400 }
                );
            }

            questions = validation.questions;
            totalQuestions = validation.totalQuestions;
            totalMarks = validation.totalMarks;
        }

        const updatedQuiz = await Quiz.findByIdAndUpdate(
            id,
            {
                title: body.title !== undefined ? String(body.title).trim() : quiz.title,
                description:
                    body.description !== undefined
                        ? String(body.description).trim()
                        : quiz.description,
                batch: nextBatch,
                publishAt: nextPublishAt,
                dueAt: nextDueAt,
                questions,
                totalQuestions,
                totalMarks,
                isSebRequired:
                    body.isSebRequired !== undefined
                        ? Boolean(body.isSebRequired)
                        : quiz.isSebRequired,
            },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            message: "Quiz updated successfully",
            quiz: updatedQuiz,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update quiz";
        return NextResponse.json(
            { success: false, message },
            { status: 500 }
        );
    }
}
