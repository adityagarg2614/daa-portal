import { connectDB } from "@/lib/db";
import Announcement from "@/models/Announcement";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET - Fetch single announcement by ID for students
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

        await connectDB();

        const { id: announcementId } = await params;

        const now = new Date();

        // Fetch active announcement only
        const announcement = await Announcement.findOne({
            _id: announcementId,
            isActive: true,
            publishAt: { $lte: now },
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: now } },
            ],
        }).populate("createdBy", "name");

        if (!announcement) {
            return NextResponse.json(
                { success: false, message: "Announcement not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: announcement,
        });
    } catch (error) {
        console.error("Error fetching announcement:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch announcement" },
            { status: 500 }
        );
    }
}
