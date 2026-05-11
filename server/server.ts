import "dotenv/config";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app.js";

const PORT = process.env.PORT ?? 3001;

// ─── Create HTTP Server ──────────────────────────────────────────────────────

const httpServer = createServer(app);

// ─── Socket.io Setup (placeholder for Epic 2) ───────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Export io for use in other modules (Epic 2)
export { io };

// ─── Start Server ────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║       🎮  QueueUp Server Running  🎮      ║
  ║──────────────────────────────────────────║
  ║  REST API:  http://localhost:${PORT}/api     ║
  ║  Socket.io: ws://localhost:${PORT}           ║
  ╚══════════════════════════════════════════╝
  `);
});
