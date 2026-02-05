import { getSession } from "@/actions/getSession";
import Elysia from "elysia";

class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

export const adminMiddleware = new Elysia({ name: "admin" })
    .error({ AuthError })
    .onError(({ code, set }) => {
        if (code === "AuthError") {
            set.status = 403;
            return { error: "Forbidden" }
        }
    })
    .derive({ as: "scoped" }, async () => {
        const session = await getSession();

        if (!session) {
            throw new AuthError("User is not authenticated");
        }

        if (session.user.role !== 'admin') {
            throw new AuthError("User is not an admin");
        }

        return { session };
    });