import { connectDB } from "@/lib/db";
import { inngest } from "./client";
import UserModel from "@/models/User";







export const syncUser = inngest.createFunction(
    { id: "sync-user", triggers: [{ event: "clerk/user.updated" }, { event: "clerk/user.created" }] },
    async ({ event }) => {
        await connectDB();
        const { id, email_addresses, public_metadata } = event.data;

        // Only sync if onboarding is complete
        if (!public_metadata?.onboardingComplete) {
            console.log(`[syncUser] User ${id} onboarding not complete, skipping sync.`);
            return;
        }

        const email = email_addresses?.[0]?.email_address;
        const { name, rollNo, role } = public_metadata;

        const userData = {
            clerkId: id,
            email: email,
            name: name,
            rollNo: rollNo,
            role: role || "student"
        };

        console.log(`[syncUser] Syncing user ${id} (${email}) to MongoDB...`);
        
        // Use findOneAndUpdate to handle both create and update
        await UserModel.findOneAndUpdate(
            { clerkId: id },
            userData,
            { upsert: true, new: true }
        );
    },
);

export const deleteUserFromDB = inngest.createFunction(
    { id: "delete-user-from-db", triggers: [{ event: "clerk/user.deleted" }] },
    async ({ event }) => {
        await connectDB();
        const { id } = event.data;
        if (!id) return;
        
        console.log(`[deleteUserFromDB] Deleting user ${id} from MongoDB...`);
        await UserModel.deleteOne({ clerkId: id });
    },
);



