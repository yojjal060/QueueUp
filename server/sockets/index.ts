import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { AppError, toSocketErrorPayload } from "../middleware/errorHandler.js";
import * as lobbyService from "../services/lobbyService.js";
import * as messageService from "../services/messageService.js";
import * as userService from "../services/userService.js";
import { corsOrigin } from "../utils/cors.js";
import type {
  LobbyMemberSnapshot,
  QueueUpSocket,
  QueueUpSocketServer,
  SocketAck,
} from "./types.js";

const DISCONNECT_GRACE_MS = Number(
  process.env.SOCKET_DISCONNECT_GRACE_MS ?? 30_000
);

let io: QueueUpSocketServer | null = null;

const disconnectTimers = new Map<string, NodeJS.Timeout>();
const activePresence = new Map<string, Set<string>>();
const socketPresence = new Map<string, string>();

function getLobbyRoom(lobbyCode: string) {
  return `lobby:${lobbyCode}`;
}

function getPresenceKey(userId: string, lobbyCode: string) {
  return `${userId}:${lobbyCode}`;
}

function parseLobbyCode(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError("Lobby code is required", 400, {
      code: "InvalidLobbyCode",
    });
  }

  return value.trim().toUpperCase();
}

function parseMessageContent(value: unknown) {
  if (typeof value !== "string") {
    throw new AppError("Message content is required", 400, {
      code: "InvalidMessageContent",
    });
  }

  const content = value.trim();
  if (!content) {
    throw new AppError("Message content cannot be empty", 400, {
      code: "InvalidMessageContent",
    });
  }

  if (content.length > 500) {
    throw new AppError("Message content must be 500 characters or less", 400, {
      code: "InvalidMessageContent",
    });
  }

  return content;
}

function cancelDisconnectTimer(userId: string, lobbyCode: string) {
  const presenceKey = getPresenceKey(userId, lobbyCode);
  const timer = disconnectTimers.get(presenceKey);

  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(presenceKey);
  }
}

function clearSocketTracking(socket: QueueUpSocket, lobbyCode?: string) {
  const activeLobbyCode = lobbyCode ?? socket.data.activeLobbyCode;
  if (!activeLobbyCode) {
    socketPresence.delete(socket.id);
    socket.data.activeLobbyCode = null;
    return;
  }

  const presenceKey = getPresenceKey(socket.data.user.id, activeLobbyCode);
  const sockets = activePresence.get(presenceKey);

  if (sockets) {
    sockets.delete(socket.id);
    if (sockets.size === 0) {
      activePresence.delete(presenceKey);
    }
  }

  socketPresence.delete(socket.id);

  if (socket.data.activeLobbyCode === activeLobbyCode) {
    socket.data.activeLobbyCode = null;
  }
}

function trackSocketInLobby(socket: QueueUpSocket, lobbyCode: string) {
  if (socket.data.activeLobbyCode && socket.data.activeLobbyCode !== lobbyCode) {
    clearSocketTracking(socket, socket.data.activeLobbyCode);
  }

  const presenceKey = getPresenceKey(socket.data.user.id, lobbyCode);
  const sockets = activePresence.get(presenceKey) ?? new Set<string>();
  sockets.add(socket.id);
  activePresence.set(presenceKey, sockets);
  socketPresence.set(socket.id, presenceKey);
  socket.data.activeLobbyCode = lobbyCode;
  cancelDisconnectTimer(socket.data.user.id, lobbyCode);
}

function scheduleDisconnectCleanup(userId: string, lobbyCode: string) {
  const presenceKey = getPresenceKey(userId, lobbyCode);

  cancelDisconnectTimer(userId, lobbyCode);

  const timer = setTimeout(async () => {
    disconnectTimers.delete(presenceKey);

    if (activePresence.has(presenceKey)) {
      return;
    }

    try {
      const membership = await lobbyService.getLobbyMemberByCode(lobbyCode, userId);
      if (!membership || !membership.lobby.isActive) {
        return;
      }

      const result = await lobbyService.leaveLobby(userId, lobbyCode);

      removeUserFromLobbyConnections(userId, lobbyCode);
      emitLobbyMemberLeft(lobbyCode, {
        userId,
        newHostId: result.newHostId,
        lobbyClosed: result.lobbyClosed,
      });

      if (result.lobbyClosed) {
        emitLobbyClosed(lobbyCode);
        closeLobbyRoom(lobbyCode);
        return;
      }

      const updatedLobby = await lobbyService.getLobbyByCode(lobbyCode);
      emitLobbyUpdated(lobbyCode, updatedLobby);
    } catch (error) {
      const socketError = toSocketErrorPayload(error);

      if (socketError.code !== "AppError" && socketError.code !== "NotFound") {
        console.error(
          `[Socket] Disconnect cleanup failed for ${userId}:${lobbyCode} - ${socketError.code}: ${socketError.message}`
        );
      }
    }
  }, DISCONNECT_GRACE_MS);

  disconnectTimers.set(presenceKey, timer);
}

async function withSocketAck<T>(
  ack: SocketAck<T>,
  handler: () => Promise<T>
): Promise<void> {
  try {
    const data = await handler();
    ack({ ok: true, data });
  } catch (error) {
    ack({
      ok: false,
      error: toSocketErrorPayload(error),
    });
  }
}

async function handleLobbyJoin(socket: QueueUpSocket, lobbyCodeInput: unknown) {
  const lobbyCode = parseLobbyCode(lobbyCodeInput);
  const lobby = await lobbyService.getLobbyByCode(lobbyCode);

  if (!lobby.isActive) {
    throw new AppError("Lobby not found or is no longer active", 404, {
      code: "LobbyNotActive",
    });
  }

  const membership = lobby.members.find(
    (member) => member.userId === socket.data.user.id
  );

  if (!membership) {
    throw new AppError(
      "Join the lobby over REST before subscribing to real-time updates",
      403,
      { code: "LobbyMembershipRequired" }
    );
  }

  if (
    socket.data.activeLobbyCode &&
    socket.data.activeLobbyCode !== lobbyCode
  ) {
    const previousLobbyCode = socket.data.activeLobbyCode;
    await socket.leave(getLobbyRoom(previousLobbyCode));
    clearSocketTracking(socket, previousLobbyCode);
  }

  await socket.join(getLobbyRoom(lobbyCode));
  trackSocketInLobby(socket, lobbyCode);

  return { lobby };
}

async function handleLobbyLeave(socket: QueueUpSocket, lobbyCodeInput: unknown) {
  const lobbyCode = parseLobbyCode(lobbyCodeInput);

  if (socket.data.activeLobbyCode !== lobbyCode) {
    return { lobbyCode };
  }

  await socket.leave(getLobbyRoom(lobbyCode));
  clearSocketTracking(socket, lobbyCode);

  return { lobbyCode };
}

async function handleChatMessage(
  socket: QueueUpSocket,
  lobbyCodeInput: unknown,
  contentInput: unknown
) {
  const lobbyCode = parseLobbyCode(lobbyCodeInput);
  const content = parseMessageContent(contentInput);

  if (socket.data.activeLobbyCode !== lobbyCode) {
    throw new AppError("Join the lobby room before sending messages", 403, {
      code: "LobbyRoomJoinRequired",
    });
  }

  const membership = await lobbyService.getLobbyMemberByCode(
    lobbyCode,
    socket.data.user.id
  );

  if (!membership || !membership.lobby.isActive) {
    throw new AppError("You are not an active member of this lobby", 403, {
      code: "LobbyMembershipRequired",
    });
  }

  const message = await messageService.createLobbyMessage(
    membership.lobbyId,
    socket.data.user.id,
    content
  );

  emitChatMessage(lobbyCode, message);
  return { message };
}

function handleDisconnect(socket: QueueUpSocket) {
  const presenceKey = socketPresence.get(socket.id);
  if (!presenceKey) {
    socket.data.activeLobbyCode = null;
    return;
  }

  const [userId, lobbyCode] = presenceKey.split(":");
  clearSocketTracking(socket, lobbyCode);

  if (userId && lobbyCode) {
    const remainingSockets = activePresence.get(presenceKey);
    if (!remainingSockets || remainingSockets.size === 0) {
      scheduleDisconnectCleanup(userId, lobbyCode);
    }
  }
}

function buildSocketServer(httpServer: HttpServer) {
  return new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
  }) as QueueUpSocketServer;
}

export function createSocketServer(httpServer: HttpServer) {
  return buildSocketServer(httpServer);
}

export function registerSocketHandlers(socketServer: QueueUpSocketServer) {
  io = socketServer;

  socketServer.use(async (socket, next) => {
    try {
      const sessionToken =
        typeof socket.handshake.auth.sessionToken === "string"
          ? socket.handshake.auth.sessionToken
          : undefined;

      if (!sessionToken) {
        return next(new Error("Unauthorized: missing session token"));
      }

      const user = await userService.getUserBySession(sessionToken);
      if (!user) {
        return next(new Error("Unauthorized: invalid session token"));
      }

      socket.data.user = user;
      socket.data.activeLobbyCode = null;
      next();
    } catch (error) {
      next(
        error instanceof Error
          ? error
          : new Error("Unauthorized: failed to resolve session")
      );
    }
  });

  socketServer.on("connection", (socket) => {
    socket.on("lobby:join", (payload, ack) => {
      void withSocketAck(ack, () => handleLobbyJoin(socket, payload?.lobbyCode));
    });

    socket.on("lobby:leave", (payload, ack) => {
      void withSocketAck(ack, () => handleLobbyLeave(socket, payload?.lobbyCode));
    });

    socket.on("chat:message", (payload, ack) => {
      void withSocketAck(ack, () =>
        handleChatMessage(socket, payload?.lobbyCode, payload?.content)
      );
    });

    socket.on("disconnect", () => {
      handleDisconnect(socket);
    });
  });
}

export function emitLobbyMemberJoined(
  lobbyCode: string,
  member: LobbyMemberSnapshot
) {
  io?.to(getLobbyRoom(lobbyCode)).emit("lobby:member-joined", {
    lobbyCode,
    member,
  });
}

export function emitLobbyMemberLeft(
  lobbyCode: string,
  payload: {
    userId: string;
    newHostId: string | null;
    lobbyClosed: boolean;
  }
) {
  io?.to(getLobbyRoom(lobbyCode)).emit("lobby:member-left", {
    lobbyCode,
    ...payload,
  });
}

export function emitLobbyUpdated(
  lobbyCode: string,
  lobby: lobbyService.LobbyWithMembers
) {
  io?.to(getLobbyRoom(lobbyCode)).emit("lobby:updated", { lobby });
}

export function emitLobbyClosed(lobbyCode: string) {
  io?.to(getLobbyRoom(lobbyCode)).emit("lobby:closed", { lobbyCode });
}

export function emitLobbyKicked(
  userId: string,
  lobbyCode: string,
  payload: {
    kickedByUserId: string;
    kickedByUsername: string;
  }
) {
  const presenceKey = getPresenceKey(userId, lobbyCode);
  const socketIds = Array.from(activePresence.get(presenceKey) ?? []);

  for (const socketId of socketIds) {
    io?.to(socketId).emit("lobby:kicked", {
      lobbyCode,
      kickedUserId: userId,
      kickedByUserId: payload.kickedByUserId,
      kickedByUsername: payload.kickedByUsername,
    });
  }
}

export function emitChatMessage(
  lobbyCode: string,
  message: messageService.MessageWithUser
) {
  io?.to(getLobbyRoom(lobbyCode)).emit("chat:new-message", { message });
}

export function removeUserFromLobbyConnections(userId: string, lobbyCode: string) {
  cancelDisconnectTimer(userId, lobbyCode);

  const presenceKey = getPresenceKey(userId, lobbyCode);
  const socketIds = Array.from(activePresence.get(presenceKey) ?? []);

  for (const socketId of socketIds) {
    const socket = io?.sockets.sockets.get(socketId);

    if (socket) {
      void socket.leave(getLobbyRoom(lobbyCode));
      clearSocketTracking(socket, lobbyCode);
    } else {
      socketPresence.delete(socketId);
    }
  }

  activePresence.delete(presenceKey);
}

export function closeLobbyRoom(lobbyCode: string) {
  if (!io) {
    return;
  }

  for (const presenceKey of Array.from(disconnectTimers.keys())) {
    if (presenceKey.endsWith(`:${lobbyCode}`)) {
      const timer = disconnectTimers.get(presenceKey);
      if (timer) {
        clearTimeout(timer);
      }
      disconnectTimers.delete(presenceKey);
    }
  }

  for (const [presenceKey, socketIds] of Array.from(activePresence.entries())) {
    if (!presenceKey.endsWith(`:${lobbyCode}`)) {
      continue;
    }

    for (const socketId of socketIds) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        void socket.leave(getLobbyRoom(lobbyCode));
        clearSocketTracking(socket, lobbyCode);
      } else {
        socketPresence.delete(socketId);
      }
    }

    activePresence.delete(presenceKey);
  }

  void io.in(getLobbyRoom(lobbyCode)).socketsLeave(getLobbyRoom(lobbyCode));
}
