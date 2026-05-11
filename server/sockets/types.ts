import type { Server, Socket } from "socket.io";
import type { AppErrorDetails } from "../middleware/errorHandler.js";
import type { AuthenticatedRequest } from "../middleware/session.js";
import type { LobbyWithMembers } from "../services/lobbyService.js";
import type { MessageWithUser } from "../services/messageService.js";

export type AuthenticatedSocketUser = NonNullable<AuthenticatedRequest["user"]>;
export type LobbyMemberSnapshot = LobbyWithMembers["members"][number];

export interface SocketSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface SocketFailureResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: AppErrorDetails;
  };
}

export type SocketAck<T> = (
  response: SocketSuccessResponse<T> | SocketFailureResponse
) => void;

export interface ClientToServerEvents {
  "lobby:join": (
    payload: { lobbyCode: string },
    ack: SocketAck<{ lobby: LobbyWithMembers }>
  ) => void;
  "lobby:leave": (
    payload: { lobbyCode: string },
    ack: SocketAck<{ lobbyCode: string }>
  ) => void;
  "chat:message": (
    payload: { lobbyCode: string; content: string },
    ack: SocketAck<{ message: MessageWithUser }>
  ) => void;
}

export interface ServerToClientEvents {
  "lobby:member-joined": (payload: {
    lobbyCode: string;
    member: LobbyMemberSnapshot;
  }) => void;
  "lobby:member-left": (payload: {
    lobbyCode: string;
    userId: string;
    newHostId: string | null;
    lobbyClosed: boolean;
  }) => void;
  "lobby:updated": (payload: { lobby: LobbyWithMembers }) => void;
  "lobby:closed": (payload: { lobbyCode: string }) => void;
  "chat:new-message": (payload: { message: MessageWithUser }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  user: AuthenticatedSocketUser;
  activeLobbyCode: string | null;
}

export type QueueUpSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type QueueUpSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
