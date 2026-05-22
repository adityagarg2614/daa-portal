import mongoose, { Schema, Document } from "mongoose";
import { StudentBatch } from "@/lib/batch";

export interface IUser extends Document {
    clerkId: string;
    name?: string;
    email?: string;
    rollNo?: string;
    role: "admin" | "student";
    batch?: StudentBatch | null;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
        },
        email: {
            type: String,
            unique: true,
        },
        rollNo: {
            type: String,
            default: null,
            // Removed unique constraint to allow multiple null values (for admins)
            // Only students should have roll numbers, and uniqueness is enforced at application level
        },
        role: {
            type: String,
            enum: ["admin", "student"],
            default: "student",
        },
        batch: {
            type: String,
            enum: ["A", "B"],
            default: null,
        },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
