import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const name = String(body.name || "").trim();
        const rollNo = String(body.rollNo || "").trim();

        if (!name) {
            return NextResponse.json(
                { message: "Full name is required" },
                { status: 400 }
            );
        }

        if (!rollNo) {
            return NextResponse.json(
                { message: "Roll number could not be determined" },
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

        const client = await clerkClient();

        // Verify the roll number actually matches the user's primary email
        const clerkUser = await client.users.getUser(userId);
        const primaryEmail = clerkUser.emailAddresses.find(
            (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress ?? "";

        const emailMatch = primaryEmail.match(/^([^@]+)@iiitdmj\.ac\.in$/i);
        if (!emailMatch || emailMatch[1].toLowerCase() !== rollNo.toLowerCase()) {
            return NextResponse.json(
                { message: "Roll number does not match your college email" },
                { status: 400 }
            );
        }

        // Determine role: default to student, but check if already set to admin or if in admin list
        // You can add admin emails here or manage them via Clerk dashboard
        const adminEmails = ["admin@iiitdmj.ac.in"]; // Example admin email
        let role = clerkUser.publicMetadata.role as string || "student";
        
        if (adminEmails.includes(primaryEmail.toLowerCase())) {
            role = "admin";
        }

        await client.users.updateUser(userId, {
            publicMetadata: {
                rollNo: rollNo.toLowerCase(),
                name,
                onboardingComplete: true,
                role: role,
            },
        });

        return NextResponse.json({ message: "Onboarding completed" });
    } catch (error) {
        console.error("[onboarding/complete]", error);
        return NextResponse.json(
            { message: "Failed to complete onboarding" },
            { status: 500 }
        );
    }
}