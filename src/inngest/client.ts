import { Inngest } from "inngest";

export const inngest = new Inngest({
    id: "algo-grade",
    isDev: process.env.NODE_ENV === "development",
});