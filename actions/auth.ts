"use server";

import { auth } from "@/lib/auth";

export async function signUp(email: string, password: string, firstName: string, lastName: string, username: string, displayUsername: string, profilePictureUrl: string) {
    return auth.api.signUpEmail({
        body: {
            name: `${firstName} ${lastName}`,
            email,
            password,
            image: profilePictureUrl,
            username,
            displayUsername
        }
    })
};

export async function signIn(email: string, password: string, rememberMe: boolean) {
    return auth.api.signInEmail({
        body: {
            email,
            password,
            rememberMe
        }
    })
};

export async function signOut() {
    return auth.api.signOut();
}