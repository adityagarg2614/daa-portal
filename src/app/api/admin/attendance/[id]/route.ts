import { connectDB } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";
import Attendance from "@/models/Attendance";
import { NextResponse } from "next/server";

// GET - Fetch a single attendance session
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response } = await verifyAdmin();
        if (!authorized) return response;

        await connectDB();
        const { id } = await params;

        const session = await Attendance.findById(id).populate("records.userId", "name email rollNo");
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Attendance session not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: session });
    } catch (error: any) {
        console.error("Error fetching session:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to fetch session" },
            { status: 500 }
        );
    }
}

// PUT - Update an attendance session
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response } = await verifyAdmin();
        if (!authorized) return response;

        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const session = await Attendance.findByIdAndUpdate(id, body, { new: true });
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Attendance session not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Attendance session updated successfully",
            data: session
        });
    } catch (error: any) {
        console.error("Error updating session:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to update session" },
            { status: 500 }
        );
    }
}

// DELETE - Delete an attendance session
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response } = await verifyAdmin();
        if (!authorized) return response;

        await connectDB();
        const { id } = await params;

        const session = await Attendance.findByIdAndDelete(id);
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Attendance session not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Attendance session deleted successfully"
        });
    } catch (error: any) {
        console.error("Error deleting session:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to delete session" },
            { status: 500 }
        );
    }
}
