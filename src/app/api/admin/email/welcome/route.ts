import { verifyAdmin } from "@/lib/auth";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * POST /api/admin/email/welcome
 * 
 * Send welcome email to a user
 * Requires admin authentication
 */
export async function POST(request: Request) {
    try {
        const { authorized, response, userId, dbUser } = await verifyAdmin();

        if (!authorized) return response;

        // Parse request body
        const body = await request.json();
        const { to, name, password, role, rollNo, loginUrl } = body;

        // Validate required fields
        if (!to || !name || !password || !role) {
            return NextResponse.json(
                { success: false, message: "Email, name, password, and role are required" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            return NextResponse.json(
                { success: false, message: "Invalid email format" },
                { status: 400 }
            );
        }

        // Validate role
        if (!["admin", "student"].includes(role)) {
            return NextResponse.json(
                { success: false, message: "Invalid role. Must be 'admin' or 'student'" },
                { status: 400 }
            );
        }

        // Send welcome email
        const result = await sendWelcomeEmail({
            to,
            name,
            password,
            role: role as "admin" | "student",
            rollNo,
            loginUrl,
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Welcome email sent successfully",
                emailId: result.emailId,
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    message: result.error || "Failed to send welcome email",
                },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in welcome email endpoint:", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to send welcome email",
            },
            { status: 500 }
        );
    }
}
