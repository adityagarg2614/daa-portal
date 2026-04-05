import { connectDB } from "@/lib/db";
import Problem from "@/models/Problem";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Helper function to capitalize difficulty values
function capitalizeDifficulty(difficulty: string): string {
    if (!difficulty) return "Easy";
    const lower = difficulty.toLowerCase();
    if (lower === "easy") return "Easy";
    if (lower === "medium") return "Medium";
    if (lower === "hard") return "Hard";
    return "Easy";
}

// GET - Fetch single problem by ID
export async function GET(
    request: Request,
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

        // Verify admin role
        const adminUser = await User.findOne({ clerkId: userId });
        if (!adminUser || adminUser.role !== "admin") {
            return NextResponse.json(
                { success: false, message: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        await connectDB();

        const { id: problemId } = await params;

        const problem = await Problem.findById(problemId);

        if (!problem) {
            return NextResponse.json(
                { success: false, message: "Problem not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: problem,
        });
    } catch (error) {
        console.error("Error fetching problem:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch problem" },
            { status: 500 }
        );
    }
}

// PUT - Update problem
export async function PUT(
    request: Request,
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

        // Verify admin role
        const adminUser = await User.findOne({ clerkId: userId });
        if (!adminUser || adminUser.role !== "admin") {
            return NextResponse.json(
                { success: false, message: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        await connectDB();

        const { id: problemId } = await params;
        const body = await request.json();

        const {
            title,
            slug,
            description,
            constraints,
            difficulty,
            tags,
            marks,
            examples,
            testCases,
            starterCode,
        } = body;

        // Find problem
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return NextResponse.json(
                { success: false, message: "Problem not found" },
                { status: 404 }
            );
        }

        // Validation
        if (title !== undefined) {
            if (title.trim().length < 3 || title.trim().length > 100) {
                return NextResponse.json(
                    { success: false, message: "Title must be between 3 and 100 characters" },
                    { status: 400 }
                );
            }
            problem.title = title.trim();
        }

        if (slug !== undefined) {
            if (slug.trim().length === 0) {
                return NextResponse.json(
                    { success: false, message: "Slug is required" },
                    { status: 400 }
                );
            }
            // Check for duplicate slug if it's changed
            if (slug !== problem.slug) {
                const existingProblem = await Problem.findOne({ slug: slug.trim() });
                if (existingProblem) {
                    return NextResponse.json(
                        { success: false, message: "Problem with this slug already exists" },
                        { status: 409 }
                    );
                }
            }
            problem.slug = slug.trim();
        }

        if (description !== undefined) {
            if (description.trim().length < 10) {
                return NextResponse.json(
                    { success: false, message: "Description must be at least 10 characters" },
                    { status: 400 }
                );
            }
            problem.description = description.trim();
        }

        if (difficulty !== undefined) {
            problem.difficulty = capitalizeDifficulty(difficulty) as "Easy" | "Medium" | "Hard";
        }

        if (marks !== undefined) {
            const marksNum = Number(marks);
            if (isNaN(marksNum) || marksNum < 1) {
                return NextResponse.json(
                    { success: false, message: "Marks must be a positive number" },
                    { status: 400 }
                );
            }
            problem.marks = marksNum;
        }

        if (tags !== undefined) {
            if (!Array.isArray(tags)) {
                return NextResponse.json(
                    { success: false, message: "Tags must be an array" },
                    { status: 400 }
                );
            }
            problem.tags = tags.filter((tag: string) => tag.trim().length > 0 && tag.trim().length <= 20);
        }

        if (constraints !== undefined) {
            if (!Array.isArray(constraints)) {
                return NextResponse.json(
                    { success: false, message: "Constraints must be an array" },
                    { status: 400 }
                );
            }
            problem.constraints = constraints.filter((c: string) => c.trim().length > 0);
        }

        if (examples !== undefined) {
            if (!Array.isArray(examples)) {
                return NextResponse.json(
                    { success: false, message: "Examples must be an array" },
                    { status: 400 }
                );
            }
            problem.examples = examples
                .filter((ex: any) => ex.input?.trim() && ex.output?.trim())
                .map((ex: any) => ({
                    input: ex.input.trim(),
                    output: ex.output.trim(),
                    explanation: ex.explanation?.trim() || "",
                }));
        }

        if (testCases !== undefined) {
            if (!Array.isArray(testCases)) {
                return NextResponse.json(
                    { success: false, message: "Test cases must be an array" },
                    { status: 400 }
                );
            }
            problem.testCases = testCases
                .filter((tc: any) => tc.input?.trim() && tc.output?.trim())
                .map((tc: any) => ({
                    input: tc.input.trim(),
                    output: tc.output.trim(),
                    isHidden: tc.isHidden !== undefined ? tc.isHidden : true,
                }));
        }

        if (starterCode !== undefined) {
            problem.starterCode = {
                cpp: starterCode.cpp || "",
                java: starterCode.java || "",
                python: starterCode.python || "",
                javascript: starterCode.javascript || "",
            };
        }

        await problem.save();

        return NextResponse.json(
            {
                success: true,
                message: "Problem updated successfully",
                data: problem,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating problem:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update problem" },
            { status: 500 }
        );
    }
}

// DELETE - Delete problem
export async function DELETE(
    request: Request,
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

        // Verify admin role
        const adminUser = await User.findOne({ clerkId: userId });
        if (!adminUser || adminUser.role !== "admin") {
            return NextResponse.json(
                { success: false, message: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        await connectDB();

        const { id: problemId } = await params;

        const problem = await Problem.findByIdAndDelete(problemId);

        if (!problem) {
            return NextResponse.json(
                { success: false, message: "Problem not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Problem deleted successfully",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting problem:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete problem" },
            { status: 500 }
        );
    }
}
