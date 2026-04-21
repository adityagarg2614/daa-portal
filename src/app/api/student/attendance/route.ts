import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Attendance from "@/models/Attendance";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export async function GET(request: Request) {
    try {
        await connectDB();
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const userId = user._id;

        // Fetch all attendance records for this user
        // We need to find all Attendance documents where this user is in the records
        const attendanceSessions = await Attendance.find({
            "records.userId": userId
        }).sort({ date: -1 });

        const sessions = attendanceSessions.map(session => ({
            _id: session._id,
            title: session.title,
            date: session.date,
            type: session.type,
            present: session.records.find((r: any) => r.userId.toString() === userId.toString())?.present || false
        }));

        // Calculate Stats
        const stats = {
            totalClasses: sessions.filter(s => s.type === "class").length,
            attendedClasses: sessions.filter(s => s.type === "class" && s.present).length,
            totalAssignments: sessions.filter(s => s.type === "assignment").length,
            attendedAssignments: sessions.filter(s => s.type === "assignment" && s.present).length,
        };

        // Prepare Heatmap data: map of date string to status
        // If a student had multiple sessions in a day (e.g. 1 class, 1 assignment)
        // status is "present" if they were present in ANY session that day? 
        // Or "mixed"? User said "present and absent only".
        // Let's go with: if ANY session was "present", mark day as green. 
        // If ALL sessions were "absent", mark as red.
        const heatmap: Record<string, string> = {};
        sessions.forEach(s => {
            const dateStr = new Date(s.date).toISOString().split('T')[0];
            if (!heatmap[dateStr]) {
                heatmap[dateStr] = s.present ? "present" : "absent";
            } else if (s.present) {
                heatmap[dateStr] = "present"; // Upgrade to present if multiple sessions
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                sessions,
                stats,
                heatmap
            }
        });

    } catch (error) {
        console.error("Error fetching student attendance:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}
