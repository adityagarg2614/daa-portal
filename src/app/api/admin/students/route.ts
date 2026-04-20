import { verifyAdmin } from "@/lib/auth";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { authorized, response, userId, dbUser } = await verifyAdmin();

        if (!authorized) return response;

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";
        const sortBy = searchParams.get("sortBy") || "name";
        const order = searchParams.get("order") || "asc";

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
        const sortField: string = sortBy === "totalScore" || sortBy === "totalSubmissions" || sortBy === "averageScore"
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
                },
            },
            {
                $sort: {
                    [sortBy === "totalScore" ? "totalScore" :
                        sortBy === "totalSubmissions" ? "totalSubmissions" :
                            sortBy === "averageScore" ? "averageScore" : mongoSortField]: sortOrder,
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
