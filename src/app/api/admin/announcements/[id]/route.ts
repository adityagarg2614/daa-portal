import { verifyAdmin } from "@/lib/auth";
import Announcement from "@/models/Announcement";
import User from "@/models/User";
import { NextResponse } from "next/server";

// GET - Fetch single announcement by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response, userId, dbUser } = await verifyAdmin();

        if (!authorized) return response;

        const { id: announcementId } = await params;

        const announcement = await Announcement.findById(announcementId)
            .populate("createdBy", "name email");

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

// PUT - Update announcement
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response, userId, dbUser } = await verifyAdmin();

        if (!authorized) return response;

        const { id: announcementId } = await params;
        const body = await request.json();
        const { title, content, type, priority, publishAt, expiresAt, isActive } = body;

        // Find announcement
        const announcement = await Announcement.findById(announcementId);
        if (!announcement) {
            return NextResponse.json(
                { success: false, message: "Announcement not found" },
                { status: 404 }
            );
        }

        // Validation
        if (title !== undefined) {
            if (title.length < 5 || title.length > 100) {
                return NextResponse.json(
                    { success: false, message: "Title must be between 5 and 100 characters" },
                    { status: 400 }
                );
            }
            announcement.title = title;
        }

        if (content !== undefined) {
            if (content.length < 10 || content.length > 1000) {
                return NextResponse.json(
                    { success: false, message: "Content must be between 10 and 1000 characters" },
                    { status: 400 }
                );
            }
            announcement.content = content;
        }

        if (type !== undefined) {
            if (!["general", "assignment", "event", "urgent"].includes(type)) {
                return NextResponse.json(
                    { success: false, message: "Invalid type" },
                    { status: 400 }
                );
            }
            announcement.type = type;
        }

        if (priority !== undefined) {
            if (!["low", "medium", "high"].includes(priority)) {
                return NextResponse.json(
                    { success: false, message: "Invalid priority" },
                    { status: 400 }
                );
            }
            announcement.priority = priority;
        }

        if (isActive !== undefined) {
            announcement.isActive = isActive;
        }

        await announcement.save();

        // Populate creator info
        await announcement.populate("createdBy", "name email");

        return NextResponse.json(
            {
                success: true,
                message: "Announcement updated successfully",
                data: announcement,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating announcement:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update announcement" },
            { status: 500 }
        );
    }
}

// DELETE - Delete announcement permanently
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response, userId, dbUser } = await verifyAdmin();

        if (!authorized) return response;

        const { id: announcementId } = await params;

        const announcement = await Announcement.findByIdAndDelete(announcementId);

        if (!announcement) {
            return NextResponse.json(
                { success: false, message: "Announcement not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Announcement deleted successfully",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete announcement" },
            { status: 500 }
        );
    }
}

// PATCH - Toggle isActive status (quick enable/disable)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response, userId, dbUser } = await verifyAdmin();

        if (!authorized) return response;

        const { id: announcementId } = await params;
        const body = await request.json();
        const { isActive } = body;

        if (isActive === undefined) {
            return NextResponse.json(
                { success: false, message: "isActive field is required" },
                { status: 400 }
            );
        }

        const announcement = await Announcement.findByIdAndUpdate(
            announcementId,
            { isActive },
            { new: true }
        ).populate("createdBy", "name email");

        if (!announcement) {
            return NextResponse.json(
                { success: false, message: "Announcement not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Announcement " + (isActive ? "activated" : "deactivated") + " successfully",
                data: announcement,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error toggling announcement status:", error);
        return NextResponse.json(
            { success: false, message: "Failed to toggle announcement status" },
            { status: 500 }
        );
    }
}
