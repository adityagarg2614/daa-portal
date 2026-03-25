import mongoose, { Schema, Document } from "mongoose";

interface IExample {
    input: string;
    output: string;
    explanation?: string;
}

interface ITestCase {
    input: string;
    output: string;
    isHidden: boolean;
}

export interface IProblem extends Document {
    title: string;
    slug: string;
    description: string;
    constraints: string[];
    difficulty: "Easy" | "Medium" | "Hard";
    tags: string[];
    marks: number;
    examples: IExample[];
    testCases: ITestCase[];
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ExampleSchema = new Schema<IExample>(
    {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String },
    },
    { _id: false }
);

const TestCaseSchema = new Schema<ITestCase>(
    {
        input: { type: String, required: true },
        output: { type: String, required: true },
        isHidden: { type: Boolean, default: true },
    },
    { _id: false }
);

const ProblemSchema = new Schema<IProblem>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        constraints: {
            type: [String],
            default: [],
        },
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Easy",
        },
        tags: {
            type: [String],
            default: [],
        },
        marks: {
            type: Number,
            required: true,
            default: 10,
        },
        examples: {
            type: [ExampleSchema],
            default: [],
        },
        testCases: {
            type: [TestCaseSchema],
            default: [],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
    },
    { timestamps: true }
);

export default mongoose.models.Problem ||
    mongoose.model<IProblem>("Problem", ProblemSchema);