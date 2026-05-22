import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { normalizeBatch } from "@/lib/batch";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const name = String(body.name || "").trim();
        const rollNo = String(body.rollNo || "").trim();
        const isAdmin = Boolean(body.isAdmin);
        const batch = normalizeBatch(body.batch);

        await connectDB();

        if (!name) {
            return NextResponse.json(
                { message: "Full name is required" },
                { status: 400 }
            );
        }

        const client = await clerkClient();

        // Get user's email from Clerk
        const clerkUser = await client.users.getUser(userId);
        const primaryEmail = clerkUser.emailAddresses.find(
            (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress?.toLowerCase() ?? "";

        const existingUser = await UserModel.findOne({
            $or: [
                { clerkId: userId },
                { email: primaryEmail },
                { clerkId: "pending_" + primaryEmail },
            ],
        });

        if (existingUser?.clerkId?.startsWith("pending_")) {
            existingUser.clerkId = userId;
        }

        let role = "student";
        let validatedRollNo = rollNo;

        // Check if this is an admin user
        if (isAdmin) {
            role = "admin";

            // Check if user was pre-registered as admin via /api/admin/setup
            const existingAdmin = existingUser;

            if (existingAdmin && existingAdmin.role === "admin") {
                // Update the clerkId for pending admin users
                if (existingAdmin.clerkId.startsWith("pending_")) {
                    existingAdmin.clerkId = userId;
                    existingAdmin.email = primaryEmail;
                    existingAdmin.name = name;
                    await existingAdmin.save();
                }
            } else {
                // Create new admin user if not found (fallback)
                await UserModel.create({
                    clerkId: userId,
                    email: primaryEmail,
                    name,
                    role: "admin",
                });
            }
        } else {
            if (existingUser?.role === "student" && existingUser.rollNo && existingUser.batch) {
                existingUser.name = name;
                existingUser.email = primaryEmail;
                await existingUser.save();

                await client.users.updateUser(userId, {
                    publicMetadata: {
                        name,
                        role: "student",
                        rollNo: existingUser.rollNo,
                        batch: existingUser.batch,
                        onboardingComplete: true,
                    },
                });

                return NextResponse.json({
                    message: "Onboarding completed",
                    role: "student",
                });
            }

            // Student flow - validate roll number
            if (!rollNo) {
                return NextResponse.json(
                    { message: "Roll number is required for students" },
                    { status: 400 }
                );
            }

            // Validate rollNo format: e.g. "22bcs010"
            if (!/^\d{2}[a-z]{3}\d{3}$/i.test(rollNo)) {
                return NextResponse.json(
                    { message: "Invalid roll number format" },
                    { status: 400 }
                );
            }

            // Verify the roll number matches the user's primary email
            const emailMatch = primaryEmail.match(/^([^@]+)@iiitdmj\.ac\.in$/i);
            if (!emailMatch || emailMatch[1].toLowerCase() !== rollNo.toLowerCase()) {
                return NextResponse.json(
                    { message: "Roll number does not match your college email" },
                    { status: 400 }
                );
            }

            validatedRollNo = rollNo.toLowerCase();

            if (!batch) {
                return NextResponse.json(
                    { message: "Batch is required for students" },
                    { status: 400 }
                );
            }
        }

        // 1. Update Clerk Metadata
        await client.users.updateUser(userId, {
            publicMetadata: {
                ...(validatedRollNo && { rollNo: validatedRollNo }),
                name,
                onboardingComplete: true,
                role: role,
                ...(role === "student" && batch ? { batch } : {}),
            },
        });

        // 2. Sync to MongoDB
        await UserModel.findOneAndUpdate(
            {
                $or: [
                    { clerkId: userId },
                    { email: primaryEmail },
                    { clerkId: "pending_" + primaryEmail },
                ],
            },
            {
                clerkId: userId,
                name,
                email: primaryEmail,
                ...(validatedRollNo && { rollNo: validatedRollNo }),
                role: role,
                batch: role === "student" ? batch : null,
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            message: "Onboarding completed",
            role: role,
        });
    } catch (error) {
        console.error("[onboarding/complete]", error);
        return NextResponse.json(
            { message: "Failed to complete onboarding" },
            { status: 500 }
        );
    }
}
