export type Rating = "G" | "PG" | "PG-13" | "R" | "NC-17";
export type Genre = "Action" | "Comedy" | "Drama" | "Horror" | "Romance" | "Sci-Fi" | "Documentary";

export interface Seat {
    row: string;
    number: number;
    isAvailable: boolean;
}

export interface Reservation {
    id: string;
    userId: string;
    screeningId: string;
    totalPrice: number;
    seats: Seat[];
    createdAt: Date;
}

export interface Movie {
    id: string;
    title: string;
    genre: Genre;
    duration: number;
    posterImage: string;
    description: string;
    releaseDate: Date;
    maturityRating: Rating;
}

export interface Auditorium {
    id: string;
    name: string;
    seats: Seat[];
}

export interface Screening {
    id: string;
    movieId: string;
    auditoriumId: string;
    startTime: Date;
    endTime: Date;
    price: number;
    takenSeats: Seat[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
    username?: string;
    displayUsername?: string;
    role?: string;
    banned: boolean;
    banReason?: string;
    banExpires?: Date;
}

export interface Session {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string;
    userAgent?: string;
    userId: string;
    impersonatedBy?: string;
}

export interface Account {
    id: string;
    accountId: string;
    providerId: string;
    userId: string;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
}

export interface VerificationToken {
    identifier: string;
    token: string;
    expiresAt: Date;
}