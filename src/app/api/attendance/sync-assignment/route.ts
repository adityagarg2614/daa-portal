import { connectDB } from "@/lib/db";
import Attendance from "@/models/Attendance";
import Assignment from "@/models/Assignment";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import User from "@/models/User";
import { getIndiaDayBounds } from "@/lib/attendance-date";

type AttendanceRecord = {
    userId: {
        toString(): string
    }
    present: boolean
}

// POST - Sync assignment attendance (called when a student views an assignment)
export async function POST(request: Request) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { assignmentId } = body;

        if (!assignmentId) {
            return NextResponse.json({ success: false, message: "Assignment ID is required" }, { status: 400 });
        }

        // 1. Get dB user
        const dbUser = await User.findOne({ clerkId });
        if (!dbUser || dbUser.role !== "student") {
            return NextResponse.json({ success: true, message: "Only student views are tracked" });
        }

        // 2. Get assignment info
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return NextResponse.json({ success: false, message: "Assignment not found" }, { status: 404 });
        }

        // 3. Find or create attendance session for this assignment on this date
        // We track assignment attendance daily. If they open it multiple times a day, it's one record.
        const { start, end } = getIndiaDayBounds();

        let session = await Attendance.findOne({
            assignmentId,
            type: "assignment",
            date: {
                $gte: start,
                $lt: end,
            },
        });

        if (!session) {
            session = await Attendance.create({
                type: "assignment",
                title: `Assignment: ${assignment.title}`,
                date: start,
                assignmentId,
                records: [],
                createdBy: dbUser._id, // System tracked, but assigned to someone
            });
        }

        // 4. Mark student as present if not already
        const studentRecord = session.records.find(
            (record: AttendanceRecord) => record.userId.toString() === dbUser._id.toString()
        );

        if (!studentRecord) {
            session.records.push({ userId: dbUser._id, present: true });
            await session.save();
        } else if (!studentRecord.present) {
            studentRecord.present = true;
            await session.save();
        }

        return NextResponse.json({ success: true, message: "Attendance synced" });
    } catch (error: unknown) {
        console.error("Error syncing assignment attendance:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Sync failed",
            },
            { status: 500 }
        );
    }
}
