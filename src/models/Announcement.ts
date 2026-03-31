import mongoose, { Schema, Document } from "mongoose";

export interface IAnnouncement extends Document {
    title: string;
    content: string;
    type: "general" | "assignment" | "event" | "urgent";
    priority: "low" | "medium" | "high";
    isActive: boolean;
    publishAt: Date;
    expiresAt?: Date;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AnnouncementSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: [5, "Title must be at least 5 characters"],
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: [10, "Content must be at least 10 characters"],
            maxlength: [1000, "Content cannot exceed 1000 characters"],
        },
        type: {
            type: String,
            enum: ["general", "assignment", "event", "urgent"],
            required: true,
            default: "general",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            required: true,
            default: "medium",
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        publishAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Index for efficient active announcements query
AnnouncementSchema.index({ isActive: 1, publishAt: -1 });
AnnouncementSchema.index({ expiresAt: 1 });

export default mongoose.models.Announcement ||
    mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
