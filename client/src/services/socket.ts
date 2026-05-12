import { io, type Socket } from "socket.io-client";
import type { Lobby, LobbyMember, Message } from "../types/api";

const SOCKET_BASE_URL = (
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:3001"
).replace(/\/$/, "");

export interface SocketErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface SocketSuccessResponse<T> {
  ok: true;
  data: T;
}

interface SocketFailureResponse {
  ok: false;
  error: SocketErrorPayload;
}

export type SocketAck<T> = (
  response: SocketSuccessResponse<T> | SocketFailureResponse
) => void;

export interface ServerToClientEvents {
  "lobby:member-joined": (payload: {
    lobbyCode: string;
    member: LobbyMember;
  }) => void;
  "lobby:member-left": (payload: {
    lobbyCode: string;
    userId: string;
    newHostId: string | null;
    lobbyClosed: boolean;
  }) => void;
  "lobby:updated": (payload: { lobby: Lobby }) => void;
  "lobby:closed": (payload: { lobbyCode: string }) => void;
  "lobby:kicked": (payload: {
    lobbyCode: string;
    kickedUserId: string;
    kickedByUserId: string;
    kickedByUsername: string;
  }) => void;
  "chat:new-message": (payload: { message: Message }) => void;
}

export interface ClientToServerEvents {
  "lobby:join": (
    payload: { lobbyCode: string },
    ack: SocketAck<{ lobby: Lobby }>
  ) => void;
  "lobby:leave": (
    payload: { lobbyCode: string },
    ack: SocketAck<{ lobbyCode: string }>
  ) => void;
  "chat:message": (
    payload: { lobbyCode: string; content: string },
    ack: SocketAck<{ message: Message }>
  ) => void;
}

export type QueueUpClientSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export function createLobbySocket(sessionToken: string) {
  return io(SOCKET_BASE_URL, {
    autoConnect: false,
    auth: { sessionToken },
  }) as QueueUpClientSocket;
}
