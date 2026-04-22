import mongoose, { Schema, Document } from "mongoose";

export interface IExamAttempt extends Document {
    studentId: mongoose.Schema.Types.ObjectId;
    assignmentId: mongoose.Schema.Types.ObjectId;
    status: "pending" | "started" | "submitted" | "expired";
    startedAt?: Date;
    submittedAt?: Date;
    expiresAt?: Date;
    sebVerified: boolean;
    sebPlatform?: "windows" | "macos" | "other";
    ipAddress?: string;
    userAgent?: string;
    autoSubmitted: boolean;
    finalScore?: number;
    createdAt: Date;
    updatedAt: Date;
}

const ExamAttemptSchema: Schema = new Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "started", "submitted", "expired"],
            default: "pending",
        },
        startedAt: {
            type: Date,
        },
        submittedAt: {
            type: Date,
        },
        expiresAt: {
            type: Date,
        },
        sebVerified: {
            type: Boolean,
            default: false,
        },
        sebPlatform: {
            type: String,
            enum: ["windows", "macos", "other"],
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        autoSubmitted: {
            type: Boolean,
            default: false,
        },
        finalScore: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Unique index to ensure a student has only one attempt per assignment
ExamAttemptSchema.index({ studentId: 1, assignmentId: 1 }, { unique: true });

export default mongoose.models.ExamAttempt ||
    mongoose.model<IExamAttempt>("ExamAttempt", ExamAttemptSchema);
