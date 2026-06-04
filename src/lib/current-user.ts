import { auth, currentUser } from "@clerk/nextjs/server";
import User, { type IUser } from "@/models/User";
import { connectDB } from "./db";

type ResolveCurrentUserOptions = {
    role?: IUser["role"];
};

type ResolvedCurrentUser = {
    clerkId: string | null;
    primaryEmail: string | null;
    user: IUser | null;
};

export async function resolveCurrentUser(
    options: ResolveCurrentUserOptions = {}
): Promise<ResolvedCurrentUser> {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        return {
            clerkId: null,
            primaryEmail: null,
            user: null,
        };
    }

    await connectDB();

    const directQuery = options.role ? { clerkId, role: options.role } : { clerkId };
    let user = await User.findOne(directQuery);

    if (user) {
        return {
            clerkId,
            primaryEmail: user.email ?? null,
            user,
        };
    }

    const clerkUser = await currentUser();
    const primaryEmail =
        clerkUser?.emailAddresses.find(
            (email) => email.id === clerkUser.primaryEmailAddressId
        )?.emailAddress?.toLowerCase() ?? null;

    if (!primaryEmail) {
        return {
            clerkId,
            primaryEmail: null,
            user: null,
        };
    }

    const fallbackQuery = options.role
        ? {
              role: options.role,
              $or: [
                  { email: primaryEmail },
                  { clerkId: `pending_${primaryEmail}` },
              ],
          }
        : {
              $or: [
                  { email: primaryEmail },
                  { clerkId: `pending_${primaryEmail}` },
              ],
          };

    user = await User.findOne(fallbackQuery);

    if (user && user.clerkId !== clerkId) {
        user.clerkId = clerkId;
        user.email = primaryEmail;
        await user.save();
    }

    return {
        clerkId,
        primaryEmail,
        user,
    };
}
