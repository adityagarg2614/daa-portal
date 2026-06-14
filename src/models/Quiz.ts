import mongoose, { Document, Schema } from "mongoose";
import { StudentBatch } from "@/lib/batch";

export type QuizQuestionType = "mcq" | "one_word";

export interface IQuizOption {
    id: string;
    text: string;
}

export interface IQuizQuestion {
    _id?: mongoose.Types.ObjectId;
    type: QuizQuestionType;
    prompt: string;
    options?: IQuizOption[];
    correctAnswer: string;
    marks: number;
    explanation?: string;
}

export interface IQuiz extends Document {
    title: string;
    description: string;
    batch?: StudentBatch | null;
    publishAt: Date;
    dueAt: Date;
    createdBy?: string;
    questions: IQuizQuestion[];
    totalQuestions: number;
    totalMarks: number;
    isSebRequired?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const QuizOptionSchema = new Schema<IQuizOption>(
    {
        id: {
            type: String,
            required: true,
            trim: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { _id: false }
);

const QuizQuestionSchema = new Schema<IQuizQuestion>(
    {
        type: {
            type: String,
            enum: ["mcq", "one_word"],
            required: true,
        },
        prompt: {
            type: String,
            required: true,
            trim: true,
        },
        options: {
            type: [QuizOptionSchema],
            default: undefined,
        },
        correctAnswer: {
            type: String,
            required: true,
            trim: true,
        },
        marks: {
            type: Number,
            required: true,
            min: 1,
        },
        explanation: {
            type: String,
            trim: true,
        },
    },
    { _id: true }
);

const QuizSchema = new Schema<IQuiz>(
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
        questions: {
            type: [QuizQuestionSchema],
            default: [],
        },
        totalQuestions: {
            type: Number,
            required: true,
        },
        totalMarks: {
            type: Number,
            required: true,
        },
        isSebRequired: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export default mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);
