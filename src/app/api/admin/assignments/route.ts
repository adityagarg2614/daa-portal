import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import Problem from "@/models/Problem";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();

        const {
            title,
            description,
            publishAt,
            dueAt,
            problemIds,
            createdBy,
        } = body;

        if (!title || !description || !publishAt || !dueAt || !problemIds?.length) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Title, description, publishAt, dueAt and problemIds are required",
                },
                { status: 400 }
            );
        }

        const problems = await Problem.find({
            _id: { $in: problemIds },
        });

        if (problems.length !== problemIds.length) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Some selected problems were not found",
                },
                { status: 404 }
            );
        }

        const totalProblems = problems.length;
        const totalMarks = problems.reduce((sum, problem) => sum + (problem.marks || 0), 0);

        const assignment = await Assignment.create({
            title,
            description,
            publishAt,
            dueAt,
            problemIds,
            totalProblems,
            totalMarks,
            createdBy: createdBy || null,
        });

        return NextResponse.json({
            success: true,
            message: "Assignment created successfully",
            assignment,
        });
    } catch (error) {
        console.error("Create Assignment Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create assignment" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await connectDB();

        const assignments = await Assignment.find()
            .populate("problemIds")
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            assignments,
        });
    } catch (error) {
        console.error("Fetch Assignments Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch assignments" },
            { status: 500 }
        );
    }
}