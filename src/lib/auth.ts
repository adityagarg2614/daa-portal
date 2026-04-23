import { auth, clerkClient } from "@clerk/nextjs/server";
import User from "@/models/User";
import { connectDB } from "./db";
import { NextResponse } from "next/server";

/**
 * Robust admin verification utility.
 * Checks Clerk metadata first, then falls back to MongoDB.
 * Automatically syncs the user to MongoDB if they are an admin in Clerk but missing in DB.
 */
export async function verifyAdmin() {
    try {
        const { userId, sessionClaims } = await auth();

        if (!userId) {
            return {
                authorized: false,
                response: NextResponse.json(
                    { success: false, message: "Unauthorized" },
                    { status: 401 }
                ),
            };
        }

        // 1. Check Clerk Metadata (Role from Session Claims)
        const metadata = (sessionClaims?.metadata as Record<string, unknown>) || {};
        const isClerkAdmin = metadata?.role === "admin";

        await connectDB();

        // 2. Check Database
        let dbUser = await User.findOne({ clerkId: userId });

        // 3. Auto-sync if Clerk says Admin but DB is missing or not Admin
        if (isClerkAdmin && (!dbUser || dbUser.role !== "admin")) {
            dbUser = await syncAdminUser(userId, dbUser);
        }


        // 4. Final authorization check
        if (isClerkAdmin || dbUser?.role === "admin") {
            return { 
                authorized: true, 
                userId, 
                dbUser: dbUser ? JSON.parse(JSON.stringify(dbUser)) : null 
            };
        }

        return {
            authorized: false,
            response: NextResponse.json(
                { success: false, message: "Forbidden - Admin access required" },
                { status: 403 }
            ),
        };
    } catch (error) {
        console.error("[Auth] Verification Error:", error);
        return {
            authorized: false,
            response: NextResponse.json(
                { success: false, message: "Authentication internal error" },
                { status: 500 }
            ),
        };
    }
}

/**
 * Helper to sync Clerk user data with MongoDB.
 * Handles re-linking by email to prevent duplicate key errors.
 */
async function syncAdminUser(userId: string, existingUser: any | null) {
    console.log(`[Auth] Auto-syncing admin user: ${userId}`);
    
    if (!existingUser) {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();

        // Check if user exists with this email but different clerkId
        let dbUser = email ? await User.findOne({ email }) : null;

        if (dbUser) {
            console.log(`[Auth] Re-linking existing user record (${email}) to new Clerk ID: ${userId}`);
            dbUser.clerkId = userId;
            dbUser.role = "admin";
            await dbUser.save();
            return dbUser;
        } else {
            return await User.create({
                clerkId: userId,
                email,
                name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Admin User",
                role: "admin",
            });
        }
    } else {
        existingUser.role = "admin";
        await existingUser.save();
        return existingUser;
    }
}
