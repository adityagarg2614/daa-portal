import { verifyAdmin } from "@/lib/auth";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

// GET - Fetch single user by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response, userId, dbUser } = await verifyAdmin();

        if (!authorized) return response;

        const { id: userIdParam } = await params;

        const user = await User.findById(userIdParam);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // If student, include submission stats
        let userData = user.toObject();
        if (user.role === "student") {
            // Aggregate submission stats
            const submissionStats = await User.aggregate([
                { $match: { _id: user._id } },
                {
                    $lookup: {
                        from: "submissions",
                        localField: "_id",
                        foreignField: "userId",
                        as: "submissions",
                    },
                },
                {
                    $addFields: {
                        totalSubmissions: { $size: "$submissions" },
                        totalScore: { $sum: "$submissions.score" },
                        averageScore: {
                            $cond: [
                                { $eq: [{ $size: "$submissions" }, 0] },
                                0,
                                { $divide: [{ $sum: "$submissions.score" }, { $size: "$submissions" }] },
                            ],
                        },
                    },
                },
                {
                    $project: {
                        totalSubmissions: 1,
                        totalScore: 1,
                        averageScore: { $round: ["$averageScore", 2] },
                    },
                },
            ]);

            if (submissionStats.length > 0) {
                userData = { ...userData, ...submissionStats[0] };
            }
        }

        return NextResponse.json({
            success: true,
            data: userData,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch user" },
            { status: 500 }
        );
    }
}

// PUT - Update user
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response, userId, dbUser } = await verifyAdmin();

        if (!authorized) return response;

        const { id: userIdParam } = await params;
        const body = await request.json();
        const { name, role, rollNo } = body;

        // Find user
        const user = await User.findById(userIdParam);
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Prevent admin from changing their own role
        if (user.clerkId === userId && role && role !== user.role) {
            return NextResponse.json(
                { success: false, message: "You cannot change your own role" },
                { status: 403 }
            );
        }

        // If changing to student, ensure at least one admin remains
        if (user.role === "admin" && role === "student") {
            const adminCount = await User.countDocuments({ role: "admin" });
            if (adminCount <= 1) {
                return NextResponse.json(
                    { success: false, message: "Cannot change role. At least one admin must exist" },
                    { status: 400 }
                );
            }
        }

        // Update name
        if (name !== undefined) {
            if (name.trim().length < 2) {
                return NextResponse.json(
                    { success: false, message: "Name must be at least 2 characters" },
                    { status: 400 }
                );
            }
            user.name = name.trim();
        }

        // Update role
        if (role !== undefined) {
            if (!["admin", "student"].includes(role)) {
                return NextResponse.json(
                    { success: false, message: "Invalid role" },
                    { status: 400 }
                );
            }
            user.role = role;

            // Update Clerk metadata
            try {
                const clerkClientInstance = await clerkClient();
                await clerkClientInstance.users.updateUser(user.clerkId, {
                    publicMetadata: {
                        role,
                    },
                });
            } catch (clerkError) {
                console.error("Failed to update Clerk metadata:", clerkError);
                // Continue anyway, MongoDB update is primary
            }
        }

        // Update rollNo (only for students)
        if (rollNo !== undefined) {
            if (user.role !== "student") {
                return NextResponse.json(
                    { success: false, message: "Roll number can only be set for students" },
                    { status: 400 }
                );
            }

            // Check uniqueness if rollNo is changing
            if (rollNo !== user.rollNo && rollNo) {
                const existingRollNo = await User.findOne({ rollNo, role: "student", _id: { $ne: user._id } });
                if (existingRollNo) {
                    return NextResponse.json(
                        { success: false, message: "Roll number already exists" },
                        { status: 409 }
                    );
                }
            }
            user.rollNo = rollNo || null;

            // Update Clerk metadata
            try {
                const clerkClientInstance = await clerkClient();
                await clerkClientInstance.users.updateUser(user.clerkId, {
                    publicMetadata: {
                        rollNo: user.rollNo || undefined,
                    },
                });
            } catch (clerkError) {
                console.error("Failed to update Clerk metadata:", clerkError);
            }
        }

        await user.save();

        return NextResponse.json(
            {
                success: true,
                message: "User updated successfully",
                data: user,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update user" },
            { status: 500 }
        );
    }
}

// DELETE - Delete user
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { authorized, response, userId, dbUser } = await verifyAdmin();

        if (!authorized) return response;

        const { id: userIdParam } = await params;

        // Find user
        const user = await User.findById(userIdParam);
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Prevent admin from deleting themselves
        if (user.clerkId === userId) {
            return NextResponse.json(
                { success: false, message: "You cannot delete your own account" },
                { status: 403 }
            );
        }

        // Prevent deletion of last admin
        if (user.role === "admin") {
            const adminCount = await User.countDocuments({ role: "admin" });
            if (adminCount <= 1) {
                return NextResponse.json(
                    { success: false, message: "Cannot delete the last admin account" },
                    { status: 400 }
                );
            }
        }

        // Delete user from Clerk
        try {
            const clerkClientInstance = await clerkClient();
            await clerkClientInstance.users.deleteUser(user.clerkId);
        } catch (clerkError: any) {
            // If user not found in Clerk, continue with MongoDB deletion
            if (clerkError?.status !== 404) {
                console.error("Failed to delete user from Clerk:", clerkError);
                return NextResponse.json(
                    { success: false, message: "Failed to delete user from authentication provider" },
                    { status: 500 }
                );
            }
        }

        // Delete from MongoDB (Inngest webhook will also attempt this, but we do it here for immediate effect)
        await User.findByIdAndDelete(userIdParam);

        return NextResponse.json(
            {
                success: true,
                message: "User deleted successfully",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete user" },
            { status: 500 }
        );
    }
}
