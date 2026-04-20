import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import User from "@/models/User";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { format } from "date-fns";

export async function GET() {
    try {
        await connectDB();

        const user = await currentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const dbUser = await User.findOne({ clerkId: user.id });
        if (!dbUser) {
            return NextResponse.json(
                { success: false, message: "User not found in database" },
                { status: 404 }
            );
        }

        // 1. Get all assignments
        const assignments = await Assignment.find().sort({ publishAt: -1 });

        // 2. For each assignment, get student's submissions and aggregate results
        const results = await Promise.all(
            assignments.map(async (assignment) => {
                const submissions = await Submission.find({
                    userId: dbUser._id,
                    assignmentId: assignment._id,
                });

                if (submissions.length === 0) return null;

                const obtainedMarks = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
                const totalMarks = assignment.totalMarks;
                const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

                // Derive status
                let status: "Excellent" | "Good" | "Average" | "Needs Improvement" = "Needs Improvement";
                if (percentage >= 85) status = "Excellent";
                else if (percentage >= 65) status = "Good";
                else if (percentage >= 40) status = "Average";

                // Get latest submission time
                const latestSubmission = submissions.reduce((prev, curr) => {
                    return (!prev || curr.submittedAt! > prev.submittedAt!) ? curr : prev;
                }, submissions[0]);

                return {
                    id: assignment._id.toString(),
                    assignmentTitle: assignment.title,
                    subject: "Design and Analysis of Algorithms", // Hardcoded for now as it's not in the model
                    totalProblems: assignment.totalProblems,
                    submittedProblems: submissions.length,
                    obtainedMarks,
                    totalMarks,
                    percentage,
                    evaluatedAt: format(latestSubmission.submittedAt || new Date(), "dd MMM yyyy, hh:mm a"),
                    status,
                };
            })
        );

        // 3. Filter out assignments where student has no submissions
        const filteredResults = results.filter((r) => r !== null);

        return NextResponse.json({
            success: true,
            results: filteredResults,
        });
    } catch (error) {
        console.error("Fetch Student Results Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
