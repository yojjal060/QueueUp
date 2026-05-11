import express from "express";
import cors from "cors";
import { sessionMiddleware } from "./middleware/session.js";
import { errorHandler } from "./middleware/errorHandler.js";
import userRoutes from "./routes/userRoutes.js";
import lobbyRoutes from "./routes/lobbyRoutes.js";

const app = express();

// ─── Global Middleware ───────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Attach user from session token on every request
app.use(sessionMiddleware);

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use("/api/users", userRoutes);
app.use("/api/lobbies", lobbyRoutes);

// Games route is nested under lobby controller but exposed at /api/games
import { getGames } from "./controllers/lobbyController.js";
import { asyncHandler } from "./utils/asyncHandler.js";
app.get("/api/games", asyncHandler(getGames));

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "NotFound", message: "Route not found" });
});

// ─── Error Handler (must be last) ────────────────────────────────────────────

app.use(errorHandler);

export default app;
