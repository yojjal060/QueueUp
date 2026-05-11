import "dotenv/config";
import { createServer } from "http";
import { fileURLToPath } from "url";
import app from "./app.js";
import {
  createSocketServer,
  registerSocketHandlers,
} from "./sockets/index.js";

const DEFAULT_PORT = Number(process.env.PORT ?? 3001);

export function createQueueUpServer() {
  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);

  registerSocketHandlers(io);

  return { httpServer, io };
}

export async function startServer(port: number = DEFAULT_PORT) {
  const { httpServer, io } = createQueueUpServer();

  await new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      console.log(`
QueueUp Server Running
REST API:  http://localhost:${port}/api
Socket.io: ws://localhost:${port}
      `);
      resolve();
    });
  });

  return { httpServer, io };
}

const isEntryPoint = process.argv[1] === fileURLToPath(import.meta.url);

if (isEntryPoint) {
  void startServer();
}
