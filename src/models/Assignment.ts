import mongoose, { Schema, Document } from "mongoose";
import { StudentBatch } from "@/lib/batch";
import {
    PROGRAMMING_LANGUAGES,
    ProgrammingLanguage,
} from "@/lib/programming-language";

export interface IAssignment extends Document {
    title: string;
    description: string;
    language?: ProgrammingLanguage | null;
    totalProblems: number;
    totalMarks: number;
    batch?: StudentBatch | null;
    publishAt: Date;
    dueAt: Date;
    createdBy?: string;
    problemIds: string[];
    isSebRequired?: boolean;
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
        language: {
            type: String,
            enum: PROGRAMMING_LANGUAGES,
            default: null,
        },
        totalProblems: {
            type: Number,
            required: true,
        },
        totalMarks: {
            type: Number,
            required: true,
        },
        batch: {
            type: String,
            enum: ["A", "B"],
            default: null,
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
        isSebRequired: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export default mongoose.models.Assignment ||
    mongoose.model<IAssignment>("Assignment", AssignmentSchema);
