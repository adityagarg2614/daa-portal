import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
    assignmentId: string;
    userId: string;
    submission: string;
    status: "Not Attempted" | "Attempted" | "Submitted" | "Evaluated";
    score?: string;
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
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        submission: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["Not Attempted", "Attempted", "Submitted", "Evaluated"],
            default: "Attempted",
        },
        score: {
            type: String,
            required: false,
        },
        submittedAt: {
            type: Date,
            required: false,
        },
    },
    { timestamps: true }
);

export default mongoose.models.Submission ||
    mongoose.model<ISubmission>("Submission", SubmissionSchema);