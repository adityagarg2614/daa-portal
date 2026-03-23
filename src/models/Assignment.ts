import mongoose, { Schema, Document, trusted } from 'mongoose';


export interface IAssignment extends Document {
    title: string;
    description: string;
    totalProblems: number;
    totalMarks: number;
    publishAt: Date;
    dueAt: Date;
    status: string;
    marks?: string;
}

const AssignmentSchema: Schema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
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
    status: {
        type: String,
        required: true,
    },
    marks: {
        type: String,
        required: false,
    },
});

export default mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);