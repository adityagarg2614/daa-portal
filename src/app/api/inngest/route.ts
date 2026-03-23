import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { deleteUserFromDB, syncUser } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        syncUser,
        deleteUserFromDB,
    ],
});