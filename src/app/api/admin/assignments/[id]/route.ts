import { verifyAdmin } from "@/lib/auth";
import Assignment from "@/models/Assignment";
import Problem from "@/models/Problem";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";

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
    } catch (error: any) {
        console.error("[API] Fetch Assignment Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch assignment: " + error.message },
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
            publishAt,
            dueAt,
            problemIds,
            isSebRequired,
        } = body;

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return NextResponse.json(
                { success: false, message: "Assignment not found" },
                { status: 404 }
            );
        }

        // Calculate total marks if problems changed
        let totalMarks = assignment.totalMarks;
        let totalProblems = assignment.totalProblems;

        if (problemIds) {
            const problems = await Problem.find({ _id: { $in: problemIds } });
            totalProblems = problems.length;
            totalMarks = problems.reduce((sum: number, p: any) => sum + (p.marks || 0), 0);
        }

        const updatedAssignment = await Assignment.findByIdAndUpdate(
            id,
            {
                title: title ?? assignment.title,
                description: description ?? assignment.description,
                publishAt: publishAt ?? assignment.publishAt,
                dueAt: dueAt ?? assignment.dueAt,
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
