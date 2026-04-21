import mongoose, { Schema, Document } from "mongoose";

export interface IAttendanceRecord {
    userId: mongoose.Types.ObjectId;
    present: boolean;
}

export interface IAttendance extends Document {
    type: "class" | "assignment";
    title: string;
    date: Date;
    assignmentId?: mongoose.Types.ObjectId;
    records: IAttendanceRecord[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema(
    {
        type: {
            type: String,
            enum: ["class", "assignment"],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: Date,
            required: true,
        },
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            required: false,
        },
        records: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                present: {
                    type: Boolean,
                    required: true,
                    default: false,
                },
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Index for efficient queries by date and type
AttendanceSchema.index({ date: -1, type: 1 });
// Index for assignment-specific attendance
AttendanceSchema.index({ assignmentId: 1 }, { sparse: true });

export default mongoose.models.Attendance ||
    mongoose.model<IAttendance>("Attendance", AttendanceSchema);
