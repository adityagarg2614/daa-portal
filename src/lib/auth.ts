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
            console.log(`[Auth] Auto-syncing admin user: ${userId}`);
            
            if (!dbUser) {
                // Fetch full user details from Clerk to populate DB
                const client = await clerkClient();
                const clerkUser = await client.users.getUser(userId);
                
                dbUser = await User.create({
                    clerkId: userId,
                    email: clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase(),
                    name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Admin User",
                    role: "admin",
                });
            } else {
                dbUser.role = "admin";
                await dbUser.save();
            }
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
