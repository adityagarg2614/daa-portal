import mongoose, { Schema, Document } from "mongoose";

export interface ITestResult {
    testCaseIndex: number;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    error?: string;
}

export interface ISubmission extends Document {
    assignmentId: string;
    problemId: string;
    userId: string;
    code: string;
    language: string;
    status: "Attempted" | "Submitted" | "Evaluated";
    score?: number;
    submittedAt?: Date;
    testResults?: ITestResult[];
    executionTime?: number;
    memoryUsed?: number;
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
        testResults: {
            type: [
                {
                    testCaseIndex: { type: Number, required: true },
                    passed: { type: Boolean, required: true },
                    input: { type: String, required: true },
                    expectedOutput: { type: String, required: true },
                    actualOutput: { type: String, required: true },
                    error: { type: String },
                },
            ],
            default: [],
        },
        executionTime: {
            type: Number,
            required: false,
            default: 0,
        },
        memoryUsed: {
            type: Number,
            required: false,
            default: 0,
        },
    },
    { timestamps: true }
);

export default mongoose.models.Submission ||
    mongoose.model<ISubmission>("Submission", SubmissionSchema);