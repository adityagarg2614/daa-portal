import { connectDB } from "@/lib/db";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();

        const {
            assignmentId,
            problemId,
            userId,
            code,
            language,
        } = body;

        if (!assignmentId || !problemId || !userId || !code || !language) {
            return NextResponse.json(
                {
                    success: false,
                    message: "assignmentId, problemId, userId, code, and language are required",
                },
                { status: 400 }
            );
        }

        const submission = await Submission.create({
            assignmentId,
            problemId,
            userId,
            code,
            language,
            status: "Submitted",
            submittedAt: new Date(),
            score: 0,
        });

        return NextResponse.json({
            success: true,
            message: "Submission saved successfully",
            submission,
        });
    } catch (error) {
        console.error("Create Submission Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to save submission" },
            { status: 500 }
        );
    }
}


export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "userId is required" },
                { status: 400 }
            );
        }

        const submissions = await Submission.find({ userId })
            .populate("assignmentId")
            .populate("problemId")
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            submissions,
        });
    } catch (error) {
        console.error("Fetch Submissions Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch submissions" },
            { status: 500 }
        );
    }
}