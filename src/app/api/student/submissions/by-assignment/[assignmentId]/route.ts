import { connectDB } from "@/lib/db";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";


export async function GET(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        await connectDB();
        
        const { assignmentId } = await params;

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "userId is required" },
                { status: 400 }
            );
        }

        const submissions = await Submission.find({
            assignmentId,
            userId,
        }).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            submissions,
        });
    } catch (error) {
        console.error("Fetch Assignment Submissions Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch assignment submissions" },
            { status: 500 }
        );
    }
}