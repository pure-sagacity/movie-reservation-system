// Better Auth
import { betterAuth } from "better-auth";
import { username, admin } from "better-auth/plugins";

// Database
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/drizzle"; // your drizzle instance

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },

    plugins: [
        username(),
        admin()
    ]
});