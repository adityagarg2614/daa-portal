import mongoose, { Schema, Document } from "mongoose";

export interface IEmailLog extends Document {
    to: string;
    subject: string;
    type: "welcome" | "password_reset" | "notification";
    status: "sent" | "failed" | "pending";
    template: string;
    sentAt?: Date;
    error?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
    {
        to: {
            type: String,
            required: true,
            trim: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["welcome", "password_reset", "notification"],
            required: true,
        },
        status: {
            type: String,
            enum: ["sent", "failed", "pending"],
            default: "pending",
        },
        template: {
            type: String,
            required: true,
        },
        sentAt: {
            type: Date,
        },
        error: {
            type: String,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

// Index for faster queries
EmailLogSchema.index({ to: 1, createdAt: -1 });
EmailLogSchema.index({ type: 1, status: 1 });

export default mongoose.models.EmailLog ||
    mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);
