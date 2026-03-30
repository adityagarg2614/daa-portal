import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify admin role
        const adminUser = await User.findOne({ clerkId: userId });
        // commneted due to testing 
        // if (!adminUser || adminUser.role !== "admin") {
        //     return NextResponse.json(
        //         { success: false, message: "Forbidden - Admin access required" },
        //         { status: 403 }
        //     );
        // }

        await connectDB();

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";
        const sortBy = searchParams.get("sortBy") || "name";
        const order = searchParams.get("order") || "asc";
        const status = searchParams.get("status") || "all";

        // Build search filter
        const searchFilter: any = {};
        if (search) {
            searchFilter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { rollNo: { $regex: search, $options: "i" } },
            ];
        }

        // Build sort object
        const sortField: string = sortBy === "totalScore" || sortBy === "totalSubmissions" || sortBy === "averageScore" || sortBy === "lastActive"
            ? sortBy
            : sortBy === "name"
                ? "name"
                : "rollNo";

        // For MongoDB sort, we need to handle calculated fields differently
        const mongoSortField = ["name", "rollNo", "createdAt"].includes(sortField) ? sortField : "createdAt";
        const sortOrder = order === "desc" ? -1 : 1;

        // Get total count
        const totalStudents = await User.countDocuments({
            role: "student",
            ...searchFilter,
        });

        // Aggregate student stats
        const studentsAggregation = await User.aggregate([
            {
                $match: {
                    role: "student",
                    ...searchFilter,
                },
            },
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
                    totalScore: {
                        $sum: "$submissions.score",
                    },
                    averageScore: {
                        $cond: [
                            { $eq: [{ $size: "$submissions" }, 0] },
                            0,
                            { $divide: [{ $sum: "$submissions.score" }, { $size: "$submissions" }] },
                        ],
                    },
                    lastActive: {
                        $max: "$submissions.submittedAt",
                    },
                },
            },
            {
                $sort: {
                    [sortBy === "totalScore" ? "totalScore" :
                        sortBy === "totalSubmissions" ? "totalSubmissions" :
                            sortBy === "averageScore" ? "averageScore" :
                                sortBy === "lastActive" ? "lastActive" : mongoSortField]: sortOrder,
                },
            },
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    rollNo: 1,
                    clerkId: 1,
                    totalSubmissions: 1,
                    totalScore: 1,
                    averageScore: { $round: ["$averageScore", 2] },
                    lastActive: 1,
                    status: {
                        $cond: [
                            {
                                $or: [
                                    { $eq: ["$lastActive", null] },
                                    { $lt: ["$lastActive", thirtyDaysAgo] }
                                ]
                            },
                            "inactive",
                            "active",
                        ],
                    },
                },
            },
        ]);

        const totalPages = Math.ceil(totalStudents / limit);

        return NextResponse.json({
            success: true,
            data: {
                students: studentsAggregation,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalStudents,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch students data" },
            { status: 500 }
        );
    }
}
