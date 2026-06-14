import { verifyAdmin } from "@/lib/auth";
import { normalizeBatch } from "@/lib/batch";
import { normalizeProgrammingLanguage } from "@/lib/programming-language";
import Assignment from "@/models/Assignment";
import Problem from "@/models/Problem";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";

type ProblemMarksRow = {
    marks?: number;
};

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response } = await verifyAdmin();
        if (!authorized) return response;

        const { id } = await params;

        const assignment = await Assignment.findById(id)
            .populate({
                path: "problemIds",
                model: "Problem",
            })
            .populate({
                path: "createdBy",
                model: "User",
                select: "name email",
            });

        if (!assignment) {
            return NextResponse.json(
                { success: false, message: "Assignment not found" },
                { status: 404 }
            );
        }

        // Get submission statistics for this assignment
        const submissions = await Submission.find({ assignmentId: id });

        const totalSubmissions = submissions.length;
        const gradedSubmissions = submissions.filter(
            (s) => s.status === "Evaluated"
        ).length;
        const pendingSubmissions = submissions.filter(
            (s) => s.status === "Submitted" || s.status === "Attempted"
        ).length;

        const scores = submissions
            .filter((s) => s.score !== undefined && s.score !== null)
            .map((s) => s.score as number);

        const averageScore =
            scores.length > 0
                ? scores.reduce((sum, score) => sum + score, 0) / scores.length
                : 0;

        // Get top performers (submissions with highest scores)
        const topPerformers = await Submission.find({ assignmentId: id })
            .sort({ score: -1 })
            .limit(5)
            .populate({
                path: "userId",
                model: "User",
                select: "name rollNo email",
            });

        const assignmentObj = JSON.parse(JSON.stringify(assignment));

        const topPerformersData = topPerformers.map((tp) => {
            const userIdObj = tp.userId ? JSON.parse(JSON.stringify(tp.userId)) : null;
            return {
                userId: userIdObj,
                score: tp.score,
                status: tp.status,
                submittedAt: tp.submittedAt || new Date(),
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                ...assignmentObj,
                submissionStats: {
                    total: totalSubmissions,
                    graded: gradedSubmissions,
                    pending: pendingSubmissions,
                    averageScore: Math.round(averageScore * 100) / 100,
                    topPerformers: topPerformersData,
                },
            },
        });
    } catch (error: unknown) {
        const err = error as Error;
        console.error("[API] Fetch Assignment Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch assignment: " + err.message },
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

        const assignment = await Assignment.findById(id);

        if (!assignment) {
            return NextResponse.json(
                { success: false, message: "Assignment not found" },
                { status: 404 }
            );
        }

        // Delete all submissions related to this assignment
        await Submission.deleteMany({ assignmentId: id });

        // Delete the assignment
        await Assignment.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: "Assignment and related submissions deleted successfully",
        });
    } catch (error) {
        console.error("Delete Assignment Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete assignment" },
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

        const {
            title,
            description,
            language,
            publishAt,
            dueAt,
            problemIds,
            isSebRequired,
            batch,
        } = body;

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return NextResponse.json(
                { success: false, message: "Assignment not found" },
                { status: 404 }
            );
        }

        if (
            publishAt !== undefined &&
            dueAt !== undefined &&
            new Date(publishAt) >= new Date(dueAt)
        ) {
            return NextResponse.json(
                { success: false, message: "Due date must be later than the publish date" },
                { status: 400 }
            );
        }

        const nextPublishAt = publishAt ?? assignment.publishAt;
        const nextDueAt = dueAt ?? assignment.dueAt;
        if (new Date(nextPublishAt) >= new Date(nextDueAt)) {
            return NextResponse.json(
                { success: false, message: "Due date must be later than the publish date" },
                { status: 400 }
            );
        }

        // Calculate total marks if problems changed
        let totalMarks = assignment.totalMarks;
        let totalProblems = assignment.totalProblems;

        if (problemIds) {
            const problems = await Problem.find({ _id: { $in: problemIds } });
            totalProblems = problems.length;
            totalMarks = problems.reduce(
                (sum: number, problem: ProblemMarksRow) => sum + (problem.marks || 0),
                0
            );
        }

        const normalizedBatch = batch !== undefined ? normalizeBatch(batch) : undefined;
        if (batch !== undefined && !normalizedBatch) {
            return NextResponse.json(
                { success: false, message: "Valid batch is required" },
                { status: 400 }
            );
        }

        const normalizedLanguage =
            language !== undefined ? normalizeProgrammingLanguage(language) : undefined;
        if (language !== undefined && !normalizedLanguage) {
            return NextResponse.json(
                { success: false, message: "Valid assignment language is required" },
                { status: 400 }
            );
        }

        const updatedAssignment = await Assignment.findByIdAndUpdate(
            id,
            {
                title: title ?? assignment.title,
                description: description ?? assignment.description,
                language: normalizedLanguage ?? assignment.language ?? null,
                batch: normalizedBatch ?? assignment.batch,
                publishAt: nextPublishAt,
                dueAt: nextDueAt,
                problemIds: problemIds ?? assignment.problemIds,
                totalProblems,
                totalMarks,
                isSebRequired: isSebRequired !== undefined ? isSebRequired : assignment.isSebRequired,
            },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            message: "Assignment updated successfully",
            assignment: updatedAssignment,
        });
    } catch (error) {
        console.error("Update Assignment Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update assignment" },
            { status: 500 }
        );
    }
}
