import { app } from "@/app/api/[[...slugs]]/route";
import { treaty } from "@elysiajs/eden";

export const client = treaty<app>("http://localhost:3000").api;