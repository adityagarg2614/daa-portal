import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    clerkId: string;
    name?: string;
    email?: string;
    rollNo?: string;
    role: "admin" | "student";
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
        },
        rollNo: {
            type: String,
        },
        role: {
            type: String,
            enum: ["admin", "student"],
            default: "student",
        },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);