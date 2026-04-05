import { Resend } from "resend";
import { connectDB } from "@/lib/db";
import EmailLog from "@/models/EmailLog";
import { generateWelcomeEmailHTML } from "@/lib/email-templates/welcome-email";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

interface SendWelcomeEmailParams {
    to: string;
    name: string;
    password: string;
    role: "admin" | "student";
    rollNo?: string;
    loginUrl?: string;
}

/**
 * Send welcome email to new user
 * Logs the result to database for audit trail
 */
export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<{ success: boolean; emailId?: string; error?: string }> {
    const { to, name, password, role, rollNo, loginUrl } = params;

    try {
        await connectDB();

        // Create email log entry
        const emailLog = await EmailLog.create({
            to,
            subject: "Welcome to Algo-Grade - Your Account Details",
            type: "welcome",
            status: "pending",
            template: "welcome-email",
            metadata: { name, role, rollNo },
        });

        // Generate HTML
        const html = generateWelcomeEmailHTML({
            name,
            email: to,
            password,
            role,
            rollNo,
            loginUrl,
        });

        // Send email via Resend
        const { data, error } = await resend.emails.send({
            from: `Algo-Grade <${fromEmail}>`,
            to: [to],
            subject: "Welcome to Algo-Grade - Your Account Details",
            html,
        });

        if (error) {
            console.error("Resend API error:", error);

            // Update log as failed
            await EmailLog.findByIdAndUpdate(emailLog._id, {
                status: "failed",
                error: error.message,
            });

            return {
                success: false,
                error: error.message || "Failed to send email",
            };
        }

        // Update log as sent
        await EmailLog.findByIdAndUpdate(emailLog._id, {
            status: "sent",
            sentAt: new Date(),
        });

        return {
            success: true,
            emailId: data?.id,
        };
    } catch (error: any) {
        console.error("Error sending welcome email:", error);

        // Try to update log as failed if we have an ID
        try {
            await EmailLog.findOneAndUpdate(
                { to, status: "pending" },
                {
                    status: "failed",
                    error: error.message || "Unknown error",
                },
                { sort: { createdAt: -1 } }
            );
        } catch (logError) {
            console.error("Failed to update email log:", logError);
        }

        return {
            success: false,
            error: error.message || "Failed to send email",
        };
    }
}

/**
 * Get email logs for a specific user
 */
export async function getEmailLogs(to: string, limit = 10) {
    await connectDB();

    const logs = await EmailLog.find({ to })
        .sort({ createdAt: -1 })
        .limit(limit);

    return logs;
}
