import { connectDB } from "@/lib/db";
import Announcement from "@/models/Announcement";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET - Fetch all announcements with pagination and filters
export async function GET(request: Request) {
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

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const type = searchParams.get("type") || "";
        const status = searchParams.get("status") || ""; // active, inactive, all

        // Build filters
        const filters: any = {};

        if (type && type !== "all") {
            filters.type = type;
        }

        if (status && status !== "all") {
            filters.isActive = status === "active";
        }

        // Get total count
        const totalAnnouncements = await Announcement.countDocuments(filters);

        // Fetch announcements with pagination
        const announcements = await Announcement.find(filters)
            .populate("createdBy", "name email")
            .sort({ publishAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalPages = Math.ceil(totalAnnouncements / limit);

        return NextResponse.json({
            success: true,
            data: {
                announcements,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalAnnouncements,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch announcements" },
            { status: 500 }
        );
    }
}

// POST - Create new announcement
export async function POST(request: Request) {
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

        const body = await request.json();
        const { title, content, type, priority, publishAt, expiresAt } = body;

        // Validation
        if (!title || !content) {
            return NextResponse.json(
                { success: false, message: "Title and content are required" },
                { status: 400 }
            );
        }

        if (title.length < 5 || title.length > 100) {
            return NextResponse.json(
                { success: false, message: "Title must be between 5 and 100 characters" },
                { status: 400 }
            );
        }

        if (content.length < 10 || content.length > 1000) {
            return NextResponse.json(
                { success: false, message: "Content must be between 10 and 1000 characters" },
                { status: 400 }
            );
        }

        // Validate dates
        const publishDate = publishAt ? new Date(publishAt) : new Date();
        if (expiresAt) {
            const expiryDate = new Date(expiresAt);
            if (expiryDate <= publishDate) {
                return NextResponse.json(
                    { success: false, message: "Expiry date must be after publish date" },
                    { status: 400 }
                );
            }
        }

        // Create announcement
        const announcement = await Announcement.create({
            title,
            content,
            type: type || "general",
            priority: priority || "medium",
            isActive: true,
            publishAt: publishDate,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: adminUser._id,
        });

        // Populate creator info
        await announcement.populate("createdBy", "name email");

        return NextResponse.json(
            {
                success: true,
                message: "Announcement created successfully",
                data: announcement,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating announcement:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create announcement" },
            { status: 500 }
        );
    }
}
