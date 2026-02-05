"use client"

import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { signIn, signUp } from "@/actions/auth"
import { toast } from "sonner"
import { redirect } from "next/navigation"

interface LoginFormState {
    email: string
    password: string
    rememberMe: boolean
}

interface SignupFormState {
    email: string
    password: string
    confirmPassword: string
    firstName: string
    lastName: string
    username: string
    displayUsername: string
    profilePictureUrl: string
}

type FieldErrors = Partial<Record<keyof SignupFormState | keyof LoginFormState, string>>

const signupStages = [
    {
        title: "Account",
        fields: ["email", "password", "confirmPassword"] as const,
    },
    {
        title: "Profile",
        fields: ["firstName", "lastName"] as const,
    },
    {
        title: "Identity",
        fields: ["username", "displayUsername"] as const,
    },
    {
        title: "Avatar",
        fields: ["profilePictureUrl"] as const,
    },
]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidUrl(value: string) {
    try {
        const url = new URL(value)
        return url.protocol === "http:" || url.protocol === "https:"
    } catch {
        return false
    }
}

function getSignupFieldError(
    field: keyof SignupFormState,
    value: string,
    form: SignupFormState
) {
    if (!value.trim()) {
        return "This field is required."
    }

    if (field === "email" && !emailPattern.test(value)) {
        return "Enter a valid email address."
    }

    if (field === "password") {
        if (value.length < 8 || !/\d/.test(value)) {
            return "Password must be at least 8 characters and include a number."
        }
    }

    if (field === "confirmPassword" && value !== form.password) {
        return "Passwords do not match."
    }

    if (field === "profilePictureUrl" && !isValidUrl(value)) {
        return "Enter a valid URL starting with http or https."
    }

    return ""
}

const DEFAULT_AVATAR_URL = "https://upload.wikimedia.org/wikipedia/commons/0/03/Twitter_default_profile_400x400.png";

export default function LoginPage() {
    const [loginForm, setLoginForm] = React.useState<LoginFormState>({
        email: "",
        password: "",
        rememberMe: false,
    })
    const [loginErrors, setLoginErrors] = React.useState<FieldErrors>({})

    const [signupForm, setSignupForm] = React.useState<SignupFormState>({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        username: "",
        displayUsername: "",
        profilePictureUrl: DEFAULT_AVATAR_URL,
    })
    const [signupErrors, setSignupErrors] = React.useState<FieldErrors>({})
    const [signupStage, setSignupStage] = React.useState(0)
    const [showSummary, setShowSummary] = React.useState(false)

    const handleLoginChange = (field: keyof LoginFormState, value: string | boolean) => {
        setLoginForm((prev) => ({ ...prev, [field]: value }))
    }

    const validateLogin = () => {
        const nextErrors: FieldErrors = {}
        if (!loginForm.email.trim()) {
            nextErrors.email = "Email is required."
        } else if (!emailPattern.test(loginForm.email)) {
            nextErrors.email = "Enter a valid email address."
        }

        if (!loginForm.password.trim()) {
            nextErrors.password = "Password is required."
        }

        setLoginErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!validateLogin()) {
            return;
        }

        const response = await signIn(loginForm.email, loginForm.password, loginForm.rememberMe);

        if (response.error) {
            toast.error(response.error.message || "Login failed. Please check your credentials and try again.");
            return;
        }

        redirect("/dashboard");
    }

    function handleSignupChange(field: keyof SignupFormState, value: string) {
        setSignupForm((prev) => ({ ...prev, [field]: value }))
    }

    const validateSignupFields = (fields: readonly (keyof SignupFormState)[]) => {
        setSignupErrors((prev) => {
            const nextErrors = { ...prev }
            fields.forEach((field) => {
                const error = getSignupFieldError(field, signupForm[field], signupForm)
                if (error) {
                    nextErrors[field] = error
                } else {
                    delete nextErrors[field]
                }
            })
            return nextErrors
        })

        return fields.every(
            (field) => !getSignupFieldError(field, signupForm[field], signupForm)
        )
    }

    const handleSignupNext = () => {
        const stageFields = signupStages[signupStage].fields
        if (!validateSignupFields(stageFields)) {
            return
        }
        setSignupStage((prev) => Math.min(prev + 1, signupStages.length - 1))
    }

    const handleSignupBack = () => {
        setSignupStage((prev) => Math.max(prev - 1, 0))
    }

    const handleSignupSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const allFields = signupStages.flatMap((stage) => stage.fields)
        if (!validateSignupFields(allFields)) {
            return
        }
        setShowSummary(true)
    }

    const summaryItems = [
        { label: "Email", value: signupForm.email },
        { label: "First Name", value: signupForm.firstName },
        { label: "Last Name", value: signupForm.lastName },
        { label: "Username", value: signupForm.username },
        { label: "Display Username", value: signupForm.displayUsername },
        { label: "Profile Picture URL", value: signupForm.profilePictureUrl },
    ]

    return (
        <div className="min-h-screen bg-linear-to-br from-muted/40 via-background to-muted/30 px-4 py-12">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                <nav className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-sm">Movie Reservation</p>
                        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                    </div>
                </nav>

                <Tabs defaultValue="login" className="gap-4">
                    <TabsList className="w-full" variant="default">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <Card>
                            <CardHeader>
                                <CardTitle>Login to your account</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form className="grid gap-4" onSubmit={handleLoginSubmit}>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium" htmlFor="login-email">
                                            Email
                                        </label>
                                        <input
                                            id="login-email"
                                            type="email"
                                            value={loginForm.email}
                                            onChange={(event) => handleLoginChange("email", event.target.value)}
                                            className={cn(
                                                "border-input bg-background focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full rounded-md border px-3 py-2 text-sm",
                                                loginErrors.email && "border-destructive"
                                            )}
                                            placeholder="you@domain.com"
                                        />
                                        {loginErrors.email ? (
                                            <p className="text-destructive text-sm">{loginErrors.email}</p>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium" htmlFor="login-password">
                                            Password
                                        </label>
                                        <input
                                            id="login-password"
                                            type="password"
                                            value={loginForm.password}
                                            onChange={(event) =>
                                                handleLoginChange("password", event.target.value)
                                            }
                                            className={cn(
                                                "border-input bg-background focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full rounded-md border px-3 py-2 text-sm",
                                                loginErrors.password && "border-destructive"
                                            )}
                                            placeholder="Enter your password"
                                        />
                                        {loginErrors.password ? (
                                            <p className="text-destructive text-sm">{loginErrors.password}</p>
                                        ) : null}
                                    </div>

                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={loginForm.rememberMe}
                                            onChange={(event) =>
                                                handleLoginChange("rememberMe", event.target.checked)
                                            }
                                            className="border-input size-4 rounded border"
                                        />
                                        Remember me
                                    </label>

                                    <button
                                        type="submit"
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
                                    >
                                        Submit
                                    </button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="signup">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sign up for an account</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {showSummary ? (
                                    <div className="grid gap-4">
                                        <div>
                                            <p className="text-muted-foreground text-sm">
                                                Confirmation summary
                                            </p>
                                            <h2 className="text-lg font-semibold">Review your details</h2>
                                        </div>
                                        <div className="grid gap-3">
                                            {summaryItems.map((item) => (
                                                <div
                                                    key={item.label}
                                                    className="flex flex-col gap-1 rounded-lg border px-4 py-3 text-sm"
                                                >
                                                    <span className="text-muted-foreground">{item.label}</span>
                                                    <span className="font-medium">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between">
                                            <div className="justify-start">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSummary(false)}
                                                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
                                                >
                                                    Edit Information
                                                </button>
                                            </div>
                                            <div className="justify-end">
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            await signUp(
                                                                signupForm.email,
                                                                signupForm.password,
                                                                signupForm.firstName,
                                                                signupForm.lastName,
                                                                signupForm.username,
                                                                signupForm.displayUsername,
                                                                signupForm.profilePictureUrl
                                                            )
                                                            redirect("/dashboard")
                                                        } catch (error) {
                                                            toast.error("Signup failed. Please try again.")
                                                            console.error("Signup failed:", error)
                                                        }
                                                    }}
                                                    className="bg-white border-2 border-primary inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-primary *:text-primary-foreground hover:text-white"
                                                >
                                                    Confirm and Sign Up
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <form className="grid gap-4" onSubmit={handleSignupSubmit}>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Stage {signupStage + 1} of {signupStages.length}
                                            </span>
                                            <span className="font-medium">{signupStages[signupStage].title}</span>
                                        </div>

                                        {signupStage === 0 ? (
                                            <div className="grid gap-4">
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium" htmlFor="signup-email">
                                                        Email
                                                    </label>
                                                    <input
                                                        id="signup-email"
                                                        type="email"
                                                        value={signupForm.email}
                                                        onChange={(event) =>
                                                            handleSignupChange("email", event.target.value)
                                                        }
                                                        className={cn(
                                                            "border-input bg-background focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full rounded-md border px-3 py-2 text-sm",
                                                            signupErrors.email && "border-destructive"
                                                        )}
                                                        placeholder="you@domain.com"
                                                    />
                                                    {signupErrors.email ? (
                                                        <p className="text-destructive text-sm">{signupErrors.email}</p>
                                                    ) : null}
                                                </div>

                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium" htmlFor="signup-password">
                                                        Password
                                                    </label>
                                                    <input
                                                        id="signup-password"
                                                        type="password"
                                                        value={signupForm.password}
                                                        onChange={(event) =>
                                                            handleSignupChange("password", event.target.value)
                                                        }
                                                        className={cn(
                                                            "border-input bg-background focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full rounded-md border px-3 py-2 text-sm",
                                                            signupErrors.password && "border-destructive"
                                                        )}
                                                        placeholder="At least 8 characters"
                                                    />
                                                    {signupErrors.password ? (
                                                        <p className="text-destructive text-sm">{signupErrors.password}</p>
                                                    ) : null}
                                                </div>

                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium" htmlFor="signup-confirm">
                                                        Confirm Password
                                                    </label>
                                                    <input
                                                        id="signup-confirm"
                                                        type="password"
                                                        value={signupForm.confirmPassword}
                                                        onChange={(event) =>
                                                            handleSignupChange("confirmPassword", event.target.value)
                                                        }
                                                        className={cn(
                                                            "border-input bg-background focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full rounded-md border px-3 py-2 text-sm",
                                                            signupErrors.confirmPassword && "border-destructive"
                                                        )}
                                                        placeholder="Match your password"
                                                    />
                                                    {signupErrors.confirmPassword ? (
                                                        <p className="text-destructive text-sm">
                                                            {signupErrors.confirmPassword}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : null}

                                        {signupStage === 1 ? (
                                            <div className="grid gap-4">
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium" htmlFor="signup-first-name">
                                                        First Name
                                                    </label>
                                                    <input
                                                        id="signup-first-name"
                                                        type="text"
                                                        value={signupForm.firstName}
                                                        onChange={(event) =>
                                                            handleSignupChange("firstName", event.target.value)
                                                        }
                                                        className={cn(
                                                            "border-input bg-background focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full rounded-md border px-3 py-2 text-sm",
                                                            signupErrors.firstName && "border-destructive"
                                                        )}
                                                        placeholder="First name"
                                                    />
                                                    {signupErrors.firstName ? (
                                                        <p className="text-destructive text-sm">{signupErrors.firstName}</p>
                                                    ) : null}
                                                </div>

                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium" htmlFor="signup-last-name">
                                                        Last Name
                                                    </label>
                                                    <input
                                                        id="signup-last-name"
                                                        type="text"
                                                        value={signupForm.lastName}
                                                        onChange={(event) =>
                                                            handleSignupChange("lastName", event.target.value)
                                                        }
                                                        className={cn(
                                                            "border-input bg-background focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full rounded-md border px-3 py-2 text-sm",
                                                            signupErrors.lastName && "border-destructive"
                                                        )}
                                                        placeholder="Last name"
                                                    />
                                                    {signupErrors.lastName ? (
                                                        <p className="text-destructive text-sm">{signupErrors.lastName}</p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : null}

                                        {signupStage === 2 ? (
                                            <div className="grid gap-4">
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium" htmlFor="signup-username">
                                                        Username
                                                    </label>
                                                    <input
                                                        id="signup-username"
                                                        type="text"
                                                        value={signupForm.username}
                                                        onChange={(event) =>
                                                            handleSignupChange("username", event.target.value)
                                                        }
                                                        className={cn(
                                                            "border-input bg-background focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full rounded-md border px-3 py-2 text-sm",
                                                            signupErrors.username && "border-destructive"
                                                        )}
                                                        placeholder="Choose a username"
                                                    />
                                                    {signupErrors.username ? (
                                                        <p className="text-destructive text-sm">{signupErrors.username}</p>
                                                    ) : null}
                                                </div>

                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium" htmlFor="signup-display-username">
                                                        Display Username
                                                    </label>
                                                    <input
                                                        id="signup-display-username"
                                                        type="text"
                                                        value={signupForm.displayUsername}
                                                        onChange={(event) =>
                                                            handleSignupChange("displayUsername", event.target.value)
                                                        }
                                                        className={cn(
                                                            "border-input bg-background focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full rounded-md border px-3 py-2 text-sm",
                                                            signupErrors.displayUsername && "border-destructive"
                                                        )}
                                                        placeholder="Public name"
                                                    />
                                                    {signupErrors.displayUsername ? (
                                                        <p className="text-destructive text-sm">
                                                            {signupErrors.displayUsername}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : null}

                                        {signupStage === 3 ? (
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium" htmlFor="signup-avatar">
                                                    Profile Picture URL <span className="text-gray-500/50"> Optional</span>
                                                </label>
                                                <input
                                                    id="signup-avatar"
                                                    type="url"
                                                    value={signupForm.profilePictureUrl}
                                                    onChange={(event) =>
                                                        handleSignupChange("profilePictureUrl", event.target.value)
                                                    }
                                                    className={cn(
                                                        "border-input bg-background focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full rounded-md border px-3 py-2 text-sm",
                                                        signupErrors.profilePictureUrl && "border-destructive"
                                                    )}
                                                />
                                                {signupErrors.profilePictureUrl ? (
                                                    <p className="text-destructive text-sm">
                                                        {signupErrors.profilePictureUrl}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}

                                        <div className="flex items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={handleSignupBack}
                                                className={cn(
                                                    "border-input hover:bg-muted inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium",
                                                    signupStage === 0 && "pointer-events-none opacity-0"
                                                )}
                                            >
                                                Back
                                            </button>

                                            {signupStage < signupStages.length - 1 ? (
                                                <button
                                                    type="button"
                                                    onClick={handleSignupNext}
                                                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
                                                >
                                                    Next
                                                </button>
                                            ) : (
                                                <button
                                                    type="submit"
                                                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
                                                >
                                                    Submit
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
