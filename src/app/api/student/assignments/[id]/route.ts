import { connectDB } from "@/lib/db";
import { isAssignmentAccessibleToStudent } from "@/lib/batch";
import Assignment from "@/models/Assignment";
import Problem from "@/models/Problem";
import { NextResponse } from "next/server";
import { verifySebSession, markAttemptAsStarted } from "@/lib/seb";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { resolveCurrentUser } from "@/lib/current-user";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { user } = await resolveCurrentUser({ role: "student" });
        if (!user) {
            logger.warn("Student assignment fetch failed: user not found", { clerkId, assignmentId: id });
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const assignment = await Assignment.findById(id).populate({ path: "problemIds", model: Problem });

        if (!assignment) {
            logger.warn("Student assignment fetch failed: assignment not found", { clerkId, assignmentId: id });
            return NextResponse.json(
                { success: false, message: "Assignment not found" },
                { status: 404 }
            );
        }

        if (!isAssignmentAccessibleToStudent(assignment.batch, user.batch)) {
            return NextResponse.json(
                { success: false, message: "Assignment not found" },
                { status: 404 }
            );
        }

        const now = new Date();
        let computedStatus = "Upcoming";

        if (now >= assignment.publishAt && now <= assignment.dueAt) {
            computedStatus = "Active";
        } else if (now > assignment.dueAt) {
            computedStatus = "Expired";
        }

        // SEB Verification
        if (assignment.isSebRequired) {
            const sebCheck = await verifySebSession(id, user._id.toString());
            if (!sebCheck.success) {
                return NextResponse.json(
                    { 
                        success: false, 
                        message: sebCheck.message,
                        sebError: sebCheck.errorCode,
                        assignmentTitle: assignment.title,
                        submittedAt: sebCheck.attempt?.submittedAt
                    },
                    { status: 403 }
                );
            }

            // Mark attempt as started if verified and not already started
            if (sebCheck.attempt) {
                const head = await headers();
                await markAttemptAsStarted(
                    sebCheck.attempt._id.toString(),
                    head.get("user-agent") || "unknown",
                    head.get("x-forwarded-for") || "127.0.0.1"
                );
            }
        }

        return NextResponse.json({
            success: true,
            assignment: {
                _id: assignment._id,
                title: assignment.title,
                description: assignment.description,
                totalProblems: assignment.totalProblems,
                totalMarks: assignment.totalMarks,
                batch: assignment.batch ?? null,
                publishAt: assignment.publishAt,
                dueAt: assignment.dueAt,
                status: computedStatus,
                problems: assignment.problemIds,
            },
        });
    } catch (error) {
        logger.error("Failed to fetch single student assignment", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch assignment" },
            { status: 500 }
        );
    }
}
