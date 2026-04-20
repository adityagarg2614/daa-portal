import { verifyAdmin } from "@/lib/auth";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

// GET - Fetch all users with pagination and filtering
export async function GET(request: Request) {
    try {
        const { authorized, response, userId, dbUser } = await verifyAdmin();

        if (!authorized) return response;

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || "all";
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const order = searchParams.get("order") || "desc";

        // Build filter
        const filter: any = {};
        if (role !== "all") {
            filter.role = role;
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { rollNo: { $regex: search, $options: "i" } },
            ];
        }

        // Get total count
        const totalUsers = await User.countDocuments(filter);

        // Build sort object
        const sortField = ["name", "email", "role", "createdAt"].includes(sortBy) ? sortBy : "createdAt";
        const sortOrder = order === "desc" ? -1 : 1;

        // Fetch users
        const users = await User.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .select("-__v");

        const totalPages = Math.ceil(totalUsers / limit);

        return NextResponse.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalUsers,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

// POST - Create a new user
export async function POST(request: Request) {
    try {
        const { authorized, response, userId, dbUser } = await verifyAdmin();

        if (!authorized) return response;

        const body = await request.json();
        const { email, name, role, rollNo, password } = body;

        // Validation
        if (!email || !name || !role) {
            return NextResponse.json(
                { success: false, message: "Email, name, and role are required" },
                { status: 400 }
            );
        }

        if (!["admin", "student"].includes(role)) {
            return NextResponse.json(
                { success: false, message: "Invalid role. Must be 'admin' or 'student'" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, message: "Invalid email format" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "User with this email already exists" },
                { status: 409 }
            );
        }

        // For students, check rollNo uniqueness
        if (role === "student" && rollNo) {
            const existingRollNo = await User.findOne({ rollNo, role: "student" });
            if (existingRollNo) {
                return NextResponse.json(
                    { success: false, message: "Roll number already exists" },
                    { status: 409 }
                );
            }
        }

        // Generate password if not provided
        const userPassword = password || Math.random().toString(36).slice(-8) + "A1!";

        // Create user in Clerk
        try {
            const clerkClientInstance = await clerkClient();
            const clerkUser = await clerkClientInstance.users.createUser({
                emailAddress: [email.toLowerCase()],
                password: userPassword,
                firstName: name.split(" ")[0],
                lastName: name.split(" ").slice(1).join(" ") || undefined,
                publicMetadata: {
                    role: role,
                    onboardingComplete: true,
                    ...(role === "student" && rollNo ? { rollNo } : {}),
                },
            });

            // Create user in MongoDB
            const newUser = await User.create({
                clerkId: clerkUser.id,
                email: email.toLowerCase(),
                name,
                role,
                rollNo: role === "student" ? rollNo : null,
            });

            return NextResponse.json(
                {
                    success: true,
                    message: "User created successfully",
                    data: {
                        user: newUser,
                        password: userPassword,
                    },
                },
                { status: 201 }
            );
        } catch (clerkError: any) {
            // Log the full error for debugging
            console.error("Clerk user creation failed:", JSON.stringify(clerkError, null, 2));

            // Extract error message from Clerk error structure
            let errorMessage = "Failed to create user in authentication provider";
            let isEmailTaken = false;

            if (clerkError?.errors && Array.isArray(clerkError.errors)) {
                errorMessage = clerkError.errors.map((e: any) => e.message || e.longMessage).filter(Boolean).join(", ");
                isEmailTaken = clerkError.errors.some((e: any) => e.code === "form_identifier_exists" || e.message?.includes("already exists"));
            } else if (clerkError?.message) {
                errorMessage = clerkError.message;
                isEmailTaken = clerkError.message.includes("already exists");
            }

            // [NEW] If email exists in Clerk but not in DB, we can try to sync them
            if (isEmailTaken) {
                try {
                    const client = await clerkClient();
                    const clerkUsers = await client.users.getUserList({ emailAddress: [email.toLowerCase()] });
                    
                    if (clerkUsers.data.length > 0) {
                        const clerkUser = clerkUsers.data[0];
                        
                        // Check if they exist in DB (should be negative since we checked earlier, but just in case)
                        let dbUser = await User.findOne({ email: email.toLowerCase() });
                        
                        if (!dbUser) {
                            // [NEW] Generate a new password since we are "creating" them in our system
                            const syncPassword = password || Math.random().toString(36).slice(-10) + "!";
                            
                            // Create in MongoDB
                            dbUser = await User.create({
                                clerkId: clerkUser.id,
                                email: email.toLowerCase(),
                                name: name || clerkUser.firstName || "Synced User",
                                role: role,
                                rollNo: role === "student" ? rollNo : null,
                            });

                            // Update Clerk user (including password if we generated/provided one)
                            await client.users.updateUser(clerkUser.id, {
                                password: syncPassword,
                                publicMetadata: {
                                    ...clerkUser.publicMetadata,
                                    role: role,
                                    onboardingComplete: true,
                                }
                            });

                            return NextResponse.json(
                                {
                                    success: true,
                                    message: "User was already in authentication system. Local record has been created and password updated.",
                                    data: {
                                        user: dbUser,
                                        password: syncPassword,
                                        isSynced: true
                                    },
                                },
                                { status: 201 }
                            );
                        }
                    }
                } catch (syncError) {
                    console.error("Failed to sync existing Clerk user:", syncError);
                }
            }

            return NextResponse.json(
                { success: false, message: errorMessage },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create user" },
            { status: 500 }
        );
    }
}
