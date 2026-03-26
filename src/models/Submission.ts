import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
    assignmentId: string;
    problemId: string;
    userId: string;
    code: string;
    language: string;
    status: "Attempted" | "Submitted" | "Evaluated";
    score?: number;
    submittedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SubmissionSchema: Schema = new Schema(
    {
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            required: true,
        },
        problemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        code: {
            type: String,
            required: true,
        },
        language: {
            type: String,
            required: true,
            default: "cpp",
        },
        status: {
            type: String,
            enum: ["Attempted", "Submitted", "Evaluated"],
            default: "Submitted",
        },
        score: {
            type: Number,
            required: false,
            default: 0,
        },
        submittedAt: {
            type: Date,
            required: false,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export default mongoose.models.Submission ||
    mongoose.model<ISubmission>("Submission", SubmissionSchema);