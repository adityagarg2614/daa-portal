import { connectDB } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";
import Attendance from "@/models/Attendance";
import User from "@/models/User";
import { NextResponse } from "next/server";

// GET - Fetch attendance sessions with filters
export async function GET(request: Request) {
    try {
        const { authorized, response } = await verifyAdmin();
        if (!authorized) return response;

        await connectDB();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        const query: any = {};
        if (type && type !== "all") {
            query.type = type;
        }

        const sessions = await Attendance.find(query)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("createdBy", "name email");

        const total = await Attendance.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: {
                sessions,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page,
                }
            }
        });
    } catch (error: any) {
        console.error("Error fetching attendance sessions:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to fetch attendance sessions" },
            { status: 500 }
        );
    }
}

// POST - Create a new attendance session (manual class attendance)
export async function POST(request: Request) {
    try {
        const { authorized, response, dbUser } = await verifyAdmin();
        if (!authorized) return response;

        await connectDB();

        const body = await request.json();
        const { title, date, records, type = "class" } = body;

        if (!title || !date || !records || !Array.isArray(records)) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        const session = await Attendance.create({
            title,
            date: new Date(date),
            type,
            records,
            createdBy: dbUser._id,
        });

        return NextResponse.json({
            success: true,
            message: "Attendance session created successfully",
            data: session
        });
    } catch (error: any) {
        console.error("Error creating attendance session:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to create attendance session" },
            { status: 500 }
        );
    }
}
