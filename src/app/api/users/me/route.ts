import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
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
        const clerkUser = await currentUser();
        const primaryEmail = clerkUser?.emailAddresses.find(
            (email) => email.id === clerkUser.primaryEmailAddressId
        )?.emailAddress?.toLowerCase();

        let user = await User.findOne({ clerkId: clerkUserId });

        if (!user && primaryEmail) {
            user = await User.findOne({
                $or: [
                    { email: primaryEmail },
                    { clerkId: "pending_" + primaryEmail },
                ],
            });

            if (user && user.clerkId.startsWith("pending_")) {
                user.clerkId = clerkUserId;
                await user.save();
            }
        }

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
