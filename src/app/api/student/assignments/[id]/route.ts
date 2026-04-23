import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import Problem from "@/models/Problem";
import { NextResponse } from "next/server";
import { verifySebSession, markAttemptAsStarted } from "@/lib/seb";
import { auth } from "@clerk/nextjs/server";
import User from "@/models/User";
import { headers } from "next/headers";

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

        const user = await User.findOne({ clerkId });
        if (!user) {
            console.error(`[Student API] User not found for clerkId: ${clerkId}`);
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        console.log(`[Student API] Fetching assignment ID: ${id}`);
        const assignment = await Assignment.findById(id).populate({ path: "problemIds", model: Problem });

        if (!assignment) {
            console.error(`[Student API] Assignment not found in DB with ID: ${id}`);
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
                publishAt: assignment.publishAt,
                dueAt: assignment.dueAt,
                status: computedStatus,
                problems: assignment.problemIds,
            },
        });
    } catch (error) {
        console.error("Fetch Single Assignment Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch assignment" },
            { status: 500 }
        );
    }
}