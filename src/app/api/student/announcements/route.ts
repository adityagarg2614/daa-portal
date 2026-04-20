import { connectDB } from "@/lib/db";
import Announcement from "@/models/Announcement";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET - Fetch active announcements for students
export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "";
        const limit = parseInt(searchParams.get("limit") || "10");

        // Build filters for active announcements
        const filters: Record<string, string | boolean | object> = {
            isActive: true,
        };

        if (type && type !== "all") {
            filters.type = type;
        }

        // Fetch active announcements
        const announcements = await Announcement.find(filters)
            .populate("createdBy", "name")
            .sort({ createdAt: -1 })
            .limit(limit);

        return NextResponse.json({
            success: true,
            data: announcements,
        });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch announcements" },
            { status: 500 }
        );
    }
}
