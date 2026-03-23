import { connectDB } from "@/lib/db";
import { inngest } from "./client";
import UserModel from "@/models/User";







export const syncUser = inngest.createFunction(
    { id: "sync-user", triggers: [{ event: "clerk/user.created" }] },
    async ({ event }) => {
        await connectDB();
        const { id, rollNo, name, email, role } = event.data;
        const user = {
            clerkId: id,
            email: email,
            name: name,
            rollNo: rollNo,
            role: role
        };
        await UserModel.create(user);
    },
);
export const deleteUserFromDB = inngest.createFunction(
    { id: "delete-user-from-db", triggers: [{ event: "clerk/user.deleted" }] },
    async ({ event }) => {
        await connectDB();
        const { id } = event.data;
        await UserModel.deleteOne({ clerkId: id });
    },
);



