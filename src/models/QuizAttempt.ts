import mongoose, { Document, Schema } from "mongoose";

export interface IQuizAnswer {
    questionId: string;
    answer: string;
    isCorrect: boolean;
    awardedMarks: number;
}

export interface IQuizAttempt extends Document {
    studentId: mongoose.Schema.Types.ObjectId;
    quizId: mongoose.Schema.Types.ObjectId;
    status: "pending" | "started" | "submitted" | "expired";
    answers: IQuizAnswer[];
    score: number;
    startedAt?: Date;
    submittedAt?: Date;
    expiresAt?: Date;
    sebVerified: boolean;
    sebPlatform?: "windows" | "macos" | "other";
    ipAddress?: string;
    userAgent?: string;
    autoSubmitted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const QuizAnswerSchema = new Schema<IQuizAnswer>(
    {
        questionId: {
            type: String,
            required: true,
            trim: true,
        },
        answer: {
            type: String,
            required: true,
            trim: true,
        },
        isCorrect: {
            type: Boolean,
            default: false,
        },
        awardedMarks: {
            type: Number,
            default: 0,
        },
    },
    { _id: false }
);

const QuizAttemptSchema = new Schema<IQuizAttempt>(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "started", "submitted", "expired"],
            default: "pending",
        },
        answers: {
            type: [QuizAnswerSchema],
            default: [],
        },
        score: {
            type: Number,
            default: 0,
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
    },
    { timestamps: true }
);

QuizAttemptSchema.index({ studentId: 1, quizId: 1 }, { unique: true });

export default mongoose.models.QuizAttempt ||
    mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);
