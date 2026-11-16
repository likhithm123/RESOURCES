// Vercel serverless entry: every /api/* request is handled by the Hono app.
import { handle } from "hono/vercel";
import { app } from "../server/app.js";

export const config = { runtime: "nodejs", maxDuration: 30 };
const h = handle(app);
export const GET = h, POST = h, PUT = h, DELETE = h, PATCH = h, OPTIONS = h;
