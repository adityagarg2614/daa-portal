import mongoose, { Schema, Document } from "mongoose";

export interface IAssignment extends Document {
    title: string;
    description: string;
    totalProblems: number;
    totalMarks: number;
    publishAt: Date;
    dueAt: Date;
    createdBy?: string;
    problemIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

const AssignmentSchema: Schema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        totalProblems: {
            type: Number,
            required: true,
        },
        totalMarks: {
            type: Number,
            required: true,
        },
        publishAt: {
            type: Date,
            required: true,
        },
        dueAt: {
            type: Date,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        problemIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Problem",
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.models.Assignment ||
    mongoose.model<IAssignment>("Assignment", AssignmentSchema);