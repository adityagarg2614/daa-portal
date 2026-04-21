import { connectDB } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";
import Attendance from "@/models/Attendance";
import User from "@/models/User";
import { NextResponse } from "next/server";

// GET - Calculate per-student attendance statistics
export async function GET() {
    try {
        const { authorized, response } = await verifyAdmin();
        if (!authorized) return response;

        await connectDB();

        // 1. Get all students
        const students = await User.find({ role: "student" }).select("name email rollNo");

        // 2. Fetch all attendance sessions
        const sessions = await Attendance.find({});

        const summary = students.map(student => {
            let attendedClasses = 0;
            let totalClasses = 0;
            let attendedAssignments = 0;
            let totalAssignments = 0;

            const studentIdStr = student._id.toString();

            sessions.forEach(session => {
                const isPresent = session.records.some(
                    (rec: any) => rec.userId.toString() === studentIdStr && rec.present
                );

                if (session.type === "class") {
                    totalClasses++;
                    if (isPresent) attendedClasses++;
                } else if (session.type === "assignment") {
                    totalAssignments++;
                    if (isPresent) attendedAssignments++;
                }
            });

            const totalSessions = totalClasses + totalAssignments;
            const totalAttended = attendedClasses + attendedAssignments;
            const percentage = totalSessions > 0 
                ? (totalAttended / totalSessions) * 100 
                : 0;

            return {
                userId: student._id,
                name: student.name,
                email: student.email,
                rollNo: student.rollNo,
                attendedClasses,
                totalClasses,
                attendedAssignments,
                totalAssignments,
                totalAttended,
                totalSessions,
                percentage: parseFloat(percentage.toFixed(2))
            };
        });

        // Filter and sort optionally if needed (can be done client-side)
        return NextResponse.json({ success: true, data: summary });
    } catch (error: any) {
        console.error("Error generating attendance summary:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to generate summary" },
            { status: 500 }
        );
    }
}
