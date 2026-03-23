import mongoose, { Schema, Document, trusted } from 'mongoose';


export interface ISubmission extends Document {
    assignmentId: string;
    userId: string;
    submission: string;
    status: string;
    score: string;
    submittedAt: Date;
    dueAt: Date;
}

const SubmissionSchema: Schema = new Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    submission: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Not Attempted", "Attempted", "Submitted", "Evaluated"],
        default: "Not Attempted",
    },
    score: {
        type: String,
        required: false,
    },
    submittedAt: {
        type: Date,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);