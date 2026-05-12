import type {
  GamesResponse,
  Lobby,
  LobbyOperationResult,
  Message,
  PaginatedResponse,
  UserSession,
} from "../types/api";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

interface ApiEnvelope<T> {
  success: true;
  data: T;
  nextCursor?: string | null;
}

interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    code = "ApiError",
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function requestEnvelope<T>(
  path: string,
  options: RequestInit & { sessionToken?: string } = {}
): Promise<ApiEnvelope<T>> {
  const headers = new Headers(options.headers);

  if (!headers.has("content-type") && options.body) {
    headers.set("content-type", "application/json");
  }

  if (options.sessionToken) {
    headers.set("x-session-token", options.sessionToken);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = (await response.json()) as ApiEnvelope<T> | ApiErrorResponse;

  if (!response.ok || !("success" in payload)) {
    const error = payload as ApiErrorResponse;
    throw new ApiError(
      error.message || "Request failed",
      response.status,
      error.error || "ApiError",
      error.details
    );
  }

  return payload;
}

export async function getSupportedGames() {
  const response = await requestEnvelope<GamesResponse>("/api/games");
  return response.data;
}

export async function listPublicLobbies(filters: {
  game?: string;
  hasSlots?: boolean;
}) {
  const query = new URLSearchParams();

  if (filters.game) {
    query.set("game", filters.game);
  }

  if (filters.hasSlots) {
    query.set("hasSlots", "true");
  }

  const response = await requestEnvelope<Lobby[]>(
    `/api/lobbies${query.toString() ? `?${query.toString()}` : ""}`
  );

  return response.data;
}

export async function getLobby(code: string) {
  const response = await requestEnvelope<Lobby>(`/api/lobbies/${code}`);
  return response.data;
}

export async function getLobbyMessages(code: string) {
  const response = await requestEnvelope<Message[]>(`/api/lobbies/${code}/messages`);
  return response as PaginatedResponse<Message[]>;
}

export async function createGuestUser(username: string) {
  const response = await requestEnvelope<UserSession>("/api/users", {
    method: "POST",
    body: JSON.stringify({ username }),
  });

  return response.data;
}

export async function getCurrentUser(sessionToken: string) {
  const response = await requestEnvelope<UserSession>("/api/users/me", {
    sessionToken,
  });

  return response.data;
}

export async function createLobby(
  input: {
    title: string;
    game: string;
    visibility: "PUBLIC" | "PRIVATE";
    maxPlayers: number;
    rankFilter?: string | null;
    hostRank?: string | null;
  },
  sessionToken: string
) {
  const response = await requestEnvelope<Lobby>("/api/lobbies", {
    method: "POST",
    sessionToken,
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function joinLobby(
  code: string,
  rank: string | null,
  sessionToken: string
) {
  const response = await requestEnvelope<Lobby>(`/api/lobbies/${code}/join`, {
    method: "POST",
    sessionToken,
    body: JSON.stringify({ rank }),
  });

  return response.data;
}

export async function leaveLobby(code: string, sessionToken: string) {
  const response = await requestEnvelope<LobbyOperationResult>(
    `/api/lobbies/${code}/leave`,
    {
      method: "POST",
      sessionToken,
    }
  );

  return response.data;
}

export async function closeLobby(code: string, sessionToken: string) {
  const response = await requestEnvelope<LobbyOperationResult>(
    `/api/lobbies/${code}/close`,
    {
      method: "POST",
      sessionToken,
    }
  );

  return response.data;
}

export async function kickLobbyMember(
  code: string,
  userId: string,
  sessionToken: string
) {
  const response = await requestEnvelope<LobbyOperationResult>(
    `/api/lobbies/${code}/kick`,
    {
      method: "POST",
      sessionToken,
      body: JSON.stringify({ userId }),
    }
  );

  return response.data;
}
