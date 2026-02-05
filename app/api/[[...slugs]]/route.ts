import { Session, User, Movie, Screening, Seat, Reservation } from '@/types';
import { Elysia } from 'elysia'
import { authMiddleware } from '@/middleware/auth';
import { adminMiddleware } from '@/middleware/admin';
import { db } from '@/lib/drizzle';
import {
    movie as movieTable,
    screening as screeningTable,
    reservation as reservationTable,
    user as userTable
} from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import z from "zod";

const user = new Elysia({ prefix: '/user' })
    .use(authMiddleware)
    .get('/', async ({ session }) => {
        // At this point, authMiddleware has already verified the session
        return { user: session.user };
    }, {
        response: z.object({
            user: z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string().email().nullable(),
            })
        })
    });

const movie = new Elysia({ prefix: '/movie' })
    .get("/", async () => {
        // Fetch all movies from the database
        const allMovies = await db.select().from(movieTable);

        // Transform and return the movies
        return {
            movies: allMovies.map(m => ({
                ...m,
                genre: String(m.genre),
                rating: Number(m.rating),
                duration: Number(m.duration),
            }))
        };
    }, {
        response: z.object({
            movies: z.array(z.object({
                id: z.string(),
                title: z.string(),
                duration: z.number(),
                posterImage: z.string(),
                genre: z.string(),
                rating: z.number(),
                description: z.string(),
                releaseDate: z.date(),
                maturityRating: z.string(),
            }))
        })
    })
    .get("/:id", async ({ params, set }) => {
        // Fetch a single movie by ID from the database
        const movieId = params.id;
        const movie = await db.select().from(movieTable).where(eq(movieTable.id, movieId)).then(res => res[0]);

        // If movie not found, return 404
        if (!movie) {
            set.status = 404;
            return { error: "Movie not found" };
        }

        // Transform and return the movie
        return {
            ...movie,
            genre: String(movie.genre),
            rating: Number(movie.rating),
            duration: Number(movie.duration),
        };
    }, {
        params: z.object({
            id: z.string(),
        }),
        response: z.union([
            z.object({
                id: z.string(),
                title: z.string(),
                duration: z.number(),
                posterImage: z.string(),
                genre: z.string(),
                rating: z.number(),
                description: z.string(),
                releaseDate: z.date(),
                maturityRating: z.string(),
            }),
            z.object({
                error: z.string(),
            })
        ])
    });

const screening = new Elysia({ prefix: '/screening' })
    .get("/", async () => {
        // Fetch all screenings from the database
        const allScreenings = await db.select().from(screeningTable);

        return {
            screenings: allScreenings.map(screening => ({
                ...screening,
                price: Number(screening.price),
            }))
        };
    }, {
        response: z.object({
            screenings: z.array(z.object({
                id: z.string(),
                movieId: z.string(),
                auditoriumId: z.string(),
                startTime: z.date(),
                endTime: z.date(),
                price: z.number(),
                takenSeats: z.array(z.any()),
            }))
        })
    })
    .get("/:id", async ({ params, set }) => {
        // Fetch a single screening by ID from the database
        const screeningId = params.id;
        const screening = await db.select().from(screeningTable).where(eq(screeningTable.id, screeningId)).then(res => res[0]);

        // If screening not found, return 404
        if (!screening) {
            set.status = 404;
            return { error: "Screening not found" };
        }

        // Return the screening
        return {
            ...screening,
            price: Number(screening.price),
        };
    }, {
        params: z.object({
            id: z.string(),
        }),
        response: z.union([
            z.object({
                id: z.string(),
                movieId: z.string(),
                auditoriumId: z.string(),
                startTime: z.date(),
                endTime: z.date(),
                price: z.number(),
                takenSeats: z.array(z.any()),
            }),
            z.object({
                error: z.string(),
            })
        ])
    })
    .use(authMiddleware)
    .post("/:id/reserve", async ({ params, body, session, set }) => {
        // Fetch the screeningID from params and seats from body.
        const screeningId = params.id;
        const seats = body.seats;
        // Fetches the screening from the database.
        const screening = await db.select().from(screeningTable).where(eq(screeningTable.id, screeningId)).then(res => res[0]);

        // If screening not found, return 404
        if (!screening) {
            set.status = 404;
            return { error: "Screening not found" };
        }

        // Check if seats are already taken
        const takenSeats = screening.takenSeats || [];
        for (const seat of seats) {
            if (takenSeats.find((s: Seat) => Number(s.row) === seat.row && Number(s.number) === seat.number)) {
                set.status = 400;
                return { error: `Seat row ${seat.row} number ${seat.number} is already taken` };
            }
        }

        // Reserve the seats by adding them to the takenSeats array
        // Note: we map the seats to include isAvailable
        const updatedTakenSeats = [...takenSeats, ...seats.map(seat => ({
            row: String(seat.row),
            number: seat.number,
            isAvailable: false,
        }))];
        await db.update(screeningTable)
            .set({ takenSeats: updatedTakenSeats as Seat[] })
            .where(eq(screeningTable.id, screeningId));


        // Create a new reservation
        const reservation: Reservation = {
            id: crypto.randomUUID(),
            userId: session.user.id,
            screeningId: screeningId,
            seats: seats.map(seat => ({
                row: String(seat.row),
                number: seat.number,
                isAvailable: false,
            })),
            totalPrice: Number(screening.price),
            createdAt: new Date(),
        };

        // Insert reservation into the database (convert totalPrice back to string for decimal field)
        await db.insert(reservationTable).values({
            ...reservation,
            totalPrice: screening.price, // Keep as string for decimal field
        });

        return { message: "Reservation successful", reservationId: reservation.id };
    }, {
        params: z.object({
            id: z.string(),
        }),
        body: z.object({
            seats: z.array(z.object({
                row: z.number(),
                number: z.number(),
            })),
        }),
        response: z.union([
            z.object({
                message: z.string(),
                reservationId: z.string(),
            }),
            z.object({
                error: z.string(),
            })
        ])
    })
    .delete("/:id/cancel", async ({ params, session, set }) => {
        // Fetch the screeningID from params.
        const screeningId = params.id;

        // Fetch the reservation for this user and screening
        const reservation = await db.select().from(reservationTable)
            .where(and(
                eq(reservationTable.screeningId, screeningId),
                eq(reservationTable.userId, session.user.id)
            ))
            .then(res => res[0]);

        // If reservation not found, return 404
        if (!reservation) {
            set.status = 404;
            return { error: "Reservation not found" };
        }

        // Delete the reservation
        await db.delete(reservationTable)
            .where(eq(reservationTable.id, reservation.id));

        // Free up the seats in the screening
        const screening = await db.select().from(screeningTable)
            .where(eq(screeningTable.id, screeningId))
            .then(res => res[0]);

        if (screening) {
            const updatedTakenSeats = screening.takenSeats.filter((seat: Seat) =>
                !reservation.seats.find((rSeat: Seat) => Number(rSeat.row) === Number(seat.row) && Number(rSeat.number) === Number(seat.number))
            );

            await db.update(screeningTable)
                .set({ takenSeats: updatedTakenSeats as Seat[] })
                .where(eq(screeningTable.id, screeningId));
        }

        return { message: "Reservation cancelled successfully" };
    }, {
        params: z.object({
            id: z.string(),
        }),
        response: z.union([
            z.object({
                message: z.string(),
            }),
            z.object({
                error: z.string(),
            })
        ])
    });

const admin = new Elysia({ prefix: '/admin' })
    .use(authMiddleware)
    .use(adminMiddleware)
    // User Management
    .get('/users', async () => {
        const users = await db.select().from(userTable);
        return { users };
    }, {
        response: z.object({
            users: z.array(z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string().email().nullable(),
                role: z.string().nullable(),
            }))
        })
    })
    .put('/user/:id/promote', async ({ params, body, set }) => {
        const userId = params.id;
        const { role } = body;

        await db.update(userTable)
            .set({ role })
            .where(eq(userTable.id, userId));

        return { message: 'User promoted successfully' };
    }, {
        params: z.object({
            id: z.string(),
        }),
        body: z.object({
            role: z.string(),
        }),
        response: z.object({
            message: z.string(),
        })
    })
    .put('/user/:id/ban', async ({ params, body, set }) => {
        const userId = params.id;
        const { reason, expires } = body;

        const updateData: Partial<User> = {
            banned: true,
            banReason: reason,
            banExpires: expires ? new Date(expires) : undefined,
        };

        await db.update(userTable)
            .set(updateData)
            .where(eq(userTable.id, userId));

        return { message: 'User banned successfully' };
    }, {
        params: z.object({
            id: z.string(),
        }),
        body: z.object({
            reason: z.string().optional(),
            expires: z.string().optional(), // ISO date string
        }),
        response: z.object({
            message: z.string(),
        })
    })
    // Movie Management
    .get('/movies', async () => {
        const movies = await db.select().from(movieTable);
        return { movies };
    }, {
        response: z.object({
            movies: z.array(z.object({
                id: z.string(),
                title: z.string(),
                duration: z.number(),
                posterImage: z.string(),
                genre: z.string(),
                rating: z.number(),
                description: z.string(),
                releaseDate: z.date(),
                maturityRating: z.string(),
            }))
        })
    })
    .post('/movie', async ({ body, set }) => {
        const newMovie: Movie = {
            id: crypto.randomUUID(),
            title: body.title,
            duration: body.duration,
            posterImage: body.posterImage,
            genre: body.genre as any,
            rating: body.rating,
            description: body.description,
            releaseDate: new Date(body.releaseDate),
            maturityRating: body.maturityRating as any,
        };

        await db.insert(movieTable).values(newMovie);
        return { message: 'Movie added successfully', movieId: newMovie.id };

    }, {
        body: z.object({
            title: z.string(),
            duration: z.number(),
            posterImage: z.string(),
            genre: z.string(),
            rating: z.number(),
            description: z.string(),
            releaseDate: z.string(), // ISO date string
            maturityRating: z.string(),
        }),
        response: z.object({
            message: z.string(),
            movieId: z.string(),
        })
    })
    .delete('/movie/:id', async ({ params, set }) => {
        const movieId = params.id;

        await db.delete(movieTable)
            .where(eq(movieTable.id, movieId));

        return { message: 'Movie deleted successfully' };
    }, {
        params: z.object({
            id: z.string(),
        }),
        response: z.object({
            message: z.string(),
        })
    })
    // Screening Management
    .get('/screenings', async () => {
        const screenings = await db.select().from(screeningTable);
        return {
            screenings: screenings.map(screening => ({
                ...screening,
                price: Number(screening.price),
            }))
        };
    }, {
        response: z.object({
            screenings: z.array(z.object({
                id: z.string(),
                movieId: z.string(),
                auditoriumId: z.string(),
                startTime: z.date(),
                endTime: z.date(),
                price: z.number(),
                takenSeats: z.array(z.any()),
            }))
        })
    })
    .post('/screening', async ({ body, set }) => {
        const newScreening: Screening = {
            id: crypto.randomUUID(),
            movieId: body.movieId,
            auditoriumId: body.auditoriumId,
            startTime: new Date(body.startTime),
            endTime: new Date(body.endTime),
            price: body.price,
            takenSeats: [],
        };

        await db.insert(screeningTable).values({
            ...newScreening,
            price: body.price.toString(), // Convert to string for decimal field
        });
        return { message: 'Screening added successfully', screeningId: newScreening.id };

    }, {
        body: z.object({
            movieId: z.string(),
            auditoriumId: z.string(),
            startTime: z.string(), // ISO date string
            endTime: z.string(),   // ISO date string
            price: z.number(),
        }),
        response: z.object({
            message: z.string(),
            screeningId: z.string(),
        })
    })
    .delete('/screening/:id', async ({ params, set }) => {
        const screeningId = params.id;

        await db.delete(screeningTable)
            .where(eq(screeningTable.id, screeningId));

        return { message: 'Screening deleted successfully' };
    }, {
        params: z.object({
            id: z.string(),
        }),
        response: z.object({
            message: z.string(),
        })
    });

const app = new Elysia({ prefix: '/api' })
    .get('/status', () => ({ status: 'ok' }))
    .use(user);

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const DELETE = app.fetch;

export type app = typeof app;