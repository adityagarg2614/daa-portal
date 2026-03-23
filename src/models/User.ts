import mongoose, { Schema, Document, trusted } from 'mongoose';



export interface User extends Document {
    clerkId: string;
    name: string;
    email: string;
    rollNo: string;
    role: string;

}

const UserSchema: Schema<User> = new Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    rollNo: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ["student", "admin"],
        default: "student",
    }
},
    { timestamps: true }
)

const UserModel = (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>("User", UserSchema)

export default UserModel
