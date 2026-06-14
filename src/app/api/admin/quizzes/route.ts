import { verifyAdmin } from "@/lib/auth";
import { normalizeBatch } from "@/lib/batch";
import { validateQuizQuestions } from "@/lib/quiz";
import Quiz from "@/models/Quiz";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { authorized, response, dbUser } = await verifyAdmin();
        if (!authorized) return response;

        const body = await req.json();
        const {
            title,
            description,
            publishAt,
            dueAt,
            isSebRequired,
            batch,
            questions,
        } = body;

        const normalizedBatch = normalizeBatch(batch);

        if (!title || !description || !publishAt || !dueAt || !normalizedBatch) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Title, description, batch, publishAt, and dueAt are required",
                },
                { status: 400 }
            );
        }

        const publishDate = new Date(publishAt);
        const dueDate = new Date(dueAt);

        if (Number.isNaN(publishDate.getTime()) || Number.isNaN(dueDate.getTime()) || publishDate >= dueDate) {
            return NextResponse.json(
                { success: false, message: "Publish time must be before due time" },
                { status: 400 }
            );
        }

        const validation = validateQuizQuestions(questions);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, message: validation.message },
                { status: 400 }
            );
        }

        const quiz = await Quiz.create({
            title: String(title).trim(),
            description: String(description).trim(),
            batch: normalizedBatch,
            publishAt: publishDate,
            dueAt: dueDate,
            questions: validation.questions,
            totalQuestions: validation.totalQuestions,
            totalMarks: validation.totalMarks,
            isSebRequired: Boolean(isSebRequired),
            createdBy: dbUser?._id || null,
        });

        return NextResponse.json({
            success: true,
            message: "Quiz created successfully",
            quiz,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create quiz";
        return NextResponse.json(
            { success: false, message },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const { authorized, response } = await verifyAdmin();
        if (!authorized) return response;

        const quizzes = await Quiz.find()
            .populate({
                path: "createdBy",
                model: "User",
                select: "name email",
            })
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            quizzes,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch quizzes";
        return NextResponse.json(
            { success: false, message },
            { status: 500 }
        );
    }
}
