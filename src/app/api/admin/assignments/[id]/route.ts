import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

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
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

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
