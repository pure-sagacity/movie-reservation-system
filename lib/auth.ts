// Better Auth
import { betterAuth } from "better-auth";
import { username, admin } from "better-auth/plugins";

// Database
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/drizzle"; // your drizzle instance
import { nextCookies } from "better-auth/next-js";
import { account, session, user, verification } from "./schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: {
            user,
            session,
            account,
            verification
        }
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },

    plugins: [
        username(),
        admin(),
        nextCookies()
    ]
});