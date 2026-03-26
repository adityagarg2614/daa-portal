import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";


export async function GET() {
    try {
        const { userId: clerkUserId } = await auth();

        if (!clerkUserId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const user = await User.findOne({ clerkId: clerkUserId });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found in database" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Get Current User Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch current user" },
            { status: 500 }
        );
    }
}