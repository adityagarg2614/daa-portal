import { connectDB } from "@/lib/db";
import Problem from "@/models/Problem";
import { NextResponse } from "next/server";

// Helper function to capitalize difficulty values
function capitalizeDifficulty(difficulty: string): string {
    if (!difficulty) return "Easy";
    const lower = difficulty.toLowerCase();
    if (lower === "easy") return "Easy";
    if (lower === "medium") return "Medium";
    if (lower === "hard") return "Hard";
    return "Easy"; // Default fallback
}


export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();

        const {
            title,
            slug,
            description,
            constraints,
            difficulty,
            tags,
            marks,
            starterCode,
            examples,
            testCases,
            createdBy,
        } = body;

        if (!title || !slug || !description) {
            return NextResponse.json(
                { success: false, message: "Title, slug, and description are required" },
                { status: 400 }
            );
        }

        const existingProblem = await Problem.findOne({ slug });
        if (existingProblem) {
            return NextResponse.json(
                { success: false, message: "Problem with this slug already exists" },
                { status: 409 }
            );
        }

        const problem = await Problem.create({
            title,
            slug,
            description,
            constraints: constraints || [],
            difficulty: difficulty ? capitalizeDifficulty(difficulty) : "Easy",
            tags: tags || [],
            marks: marks || 10,
            starterCode: starterCode || {
                cpp: "",
                java: "",
                python: "",
                javascript: "",
            },

            examples: examples || [],
            testCases: testCases || [],
            createdBy: createdBy || null,
        });

        return NextResponse.json({
            success: true,
            message: "Problem created successfully",
            problem,
        });
    } catch (error) {
        console.error("Create Problem Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create problem" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await connectDB();

        const problems = await Problem.find().sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            problems,
        });
    } catch (error) {
        console.error("Fetch Problems Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch problems" },
            { status: 500 }
        );
    }
}