import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

/**
 * POST /api/admin/setup
 * 
 * Create an admin user with any email domain.
 * 
 * Authentication Methods:
 * 1. Admin Session (Recommended): Logged-in admin making request
 * 2. Setup Secret: Bearer token for initial setup
 * 
 * Body: { email: string, name: string, designation?: string }
 */
export async function POST(req: Request) {
    try {
        let isAdmin = false;
        let userId: string | null = null;

        // Method 1: Check for admin session (from dashboard)
        try {
            const { userId: authUserId } = await auth();
            if (authUserId) {
                await connectDB();
                const dbUser = await UserModel.findOne({ clerkId: authUserId });
                if (dbUser?.role === "admin") {
                    isAdmin = true;
                    userId = authUserId;
                }
            }
        } catch (err) {
            // Auth might fail if no session, that's okay - try secret method
        }

        // Method 2: Check for setup secret (fallback for public setup)
        if (!isAdmin) {
            const authHeader = req.headers.get("authorization");
            const expectedSecret = process.env.ADMIN_SETUP_SECRET;

            if (authHeader && authHeader.startsWith("Bearer ") && expectedSecret) {
                const providedSecret = authHeader.substring(7);
                if (providedSecret === expectedSecret) {
                    isAdmin = true;
                }
            }
        }

        if (!isAdmin) {
            return NextResponse.json(
                { message: "Unauthorized - Admin access required" },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await req.json();
        const { email, name } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        if (!name || typeof name !== "string") {
            return NextResponse.json(
                { message: "Name is required" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Invalid email format" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if user already exists in DB
        const existingUser = await UserModel.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            // Update existing user to admin
            existingUser.role = "admin";
            existingUser.name = name;
            await existingUser.save();

            // Update Clerk metadata
            const client = await clerkClient();
            const clerkUsers = await client.users.getUserList({ emailAddress: [email.toLowerCase()] });

            if (clerkUsers.data.length > 0) {
                const clerkUser = clerkUsers.data[0];
                await client.users.updateUser(clerkUser.id, {
                    publicMetadata: {
                        ...clerkUser.publicMetadata,
                        role: "admin",
                        onboardingComplete: true,
                        name: name,
                    },
                });
            }

            return NextResponse.json({
                message: "User updated to admin successfully",
                user: {
                    email: existingUser.email,
                    name: existingUser.name,
                    role: existingUser.role,
                },
            });
        }

        // User doesn't exist in DB - they need to sign up first via Clerk
        // We'll create a pending admin record that will be activated on first login
        const adminUser = await UserModel.create({
            email: email.toLowerCase(),
            name: name,
            role: "admin",
            clerkId: "pending_" + email.toLowerCase(), // Placeholder, will be updated on first login
        });

        // Try to update Clerk metadata if user already exists in Clerk
        try {
            const clerkClientInstance = await clerkClient();
            const clerkUsers = await clerkClientInstance.users.getUserList({ emailAddress: [email.toLowerCase()] });
            if (clerkUsers.data.length > 0) {
                const clerkUser = clerkUsers.data[0];
                await clerkClientInstance.users.updateUser(clerkUser.id, {
                    publicMetadata: {
                        ...clerkUser.publicMetadata,
                        role: "admin",
                        email: email.toLowerCase(),
                    },
                });
            }
        } catch (err) {
            console.error("[admin/setup] Failed to update Clerk metadata:", err);
        }

        return NextResponse.json({
            message: "Admin user created successfully. User should sign in with Clerk to activate.",
            user: {
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role,
            },
            note: "User must sign in with Clerk to complete setup. Clerk ID will be updated on first login.",
        });

    } catch (error) {
        console.error("[admin/setup]", error);
        return NextResponse.json(
            { message: "Failed to create admin user", error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/setup
 * 
 * Check if admin setup is configured (for testing purposes)
 */
export async function GET() {
    const isConfigured = !!process.env.ADMIN_SETUP_SECRET;
    return NextResponse.json({
        configured: isConfigured,
        message: isConfigured
            ? "Admin setup is configured. Use POST to create admin users."
            : "ADMIN_SETUP_SECRET not set in environment variables",
    });
}
