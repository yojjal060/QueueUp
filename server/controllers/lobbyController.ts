import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/session.js";
import * as lobbyService from "../services/lobbyService.js";
import * as messageService from "../services/messageService.js";
import { GAMES, getSupportedGameIds } from "../constants/games.js";
import { AppError } from "../middleware/errorHandler.js";
import type { Game, LobbyVisibility } from "../generated/prisma/client.js";
import {
  closeLobbyRoom,
  emitLobbyClosed,
  emitLobbyMemberJoined,
  emitLobbyMemberLeft,
  emitLobbyUpdated,
  removeUserFromLobbyConnections,
} from "../sockets/index.js";

function getRouteParam(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`Missing or invalid route parameter: ${name}`, 400);
  }

  return value;
}

function getSingleQueryValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * POST /api/lobbies
 * Create a new lobby. Requires session.
 */
export async function createLobby(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { title, game, visibility, maxPlayers, rankFilter, hostRank } =
    req.body;

  if (!title || typeof title !== "string" || title.trim().length < 2) {
    throw new AppError("Lobby title is required (min 2 characters)", 400);
  }

  if (!game || !getSupportedGameIds().includes(game)) {
    throw new AppError(
      `Invalid game. Supported: ${getSupportedGameIds().join(", ")}`,
      400
    );
  }

  if (visibility && !["PUBLIC", "PRIVATE"].includes(visibility)) {
    throw new AppError("Visibility must be PUBLIC or PRIVATE", 400);
  }

  const lobby = await lobbyService.createLobby({
    userId: req.user!.id,
    title: title.trim(),
    game: game as Game,
    visibility: (visibility ?? "PUBLIC") as LobbyVisibility,
    maxPlayers: maxPlayers ? Number(maxPlayers) : undefined,
    rankFilter: rankFilter ?? null,
    hostRank: hostRank ?? null,
  });

  res.status(201).json({
    success: true,
    data: lobby,
  });
}

/**
 * GET /api/lobbies
 * List public lobbies with optional filters.
 */
export async function listLobbies(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const game = getSingleQueryValue(req.query.game);
  const hasSlots = getSingleQueryValue(req.query.hasSlots);

  const lobbies = await lobbyService.listPublicLobbies({
    game: game && getSupportedGameIds().includes(game)
      ? (game as Game)
      : undefined,
    hasSlots: hasSlots === "true",
  });

  res.json({
    success: true,
    data: lobbies,
  });
}

/**
 * GET /api/lobbies/:code
 * Get lobby details by code.
 */
export async function getLobby(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const code = getRouteParam(req.params.code, "code");
  const lobby = await lobbyService.getLobbyByCode(code);

  res.json({
    success: true,
    data: lobby,
  });
}

/**
 * POST /api/lobbies/:code/join
 * Join a lobby. Requires session.
 */
export async function joinLobby(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const code = getRouteParam(req.params.code, "code");
  const { rank } = req.body;

  const lobby = await lobbyService.joinLobby({
    userId: req.user!.id,
    code,
    rank: rank ?? null,
  });

  const member = lobby.members.find((entry) => entry.userId === req.user!.id);
  if (member) {
    emitLobbyMemberJoined(code, member);
    emitLobbyUpdated(code, lobby);
  }

  res.json({
    success: true,
    data: lobby,
  });
}

/**
 * POST /api/lobbies/:code/leave
 * Leave a lobby. Requires session.
 */
export async function leaveLobby(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const code = getRouteParam(req.params.code, "code");
  const result = await lobbyService.leaveLobby(req.user!.id, code);

  removeUserFromLobbyConnections(req.user!.id, code);
  emitLobbyMemberLeft(code, {
    userId: req.user!.id,
    newHostId: result.newHostId,
    lobbyClosed: result.lobbyClosed,
  });

  if (result.lobbyClosed) {
    emitLobbyClosed(code);
    closeLobbyRoom(code);
  } else {
    const updatedLobby = await lobbyService.getLobbyByCode(code);
    emitLobbyUpdated(code, updatedLobby);
  }

  res.json({
    success: true,
    data: result,
  });
}

/**
 * POST /api/lobbies/:code/close
 * Close a lobby (host only). Requires session.
 */
export async function closeLobby(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const code = getRouteParam(req.params.code, "code");
  const result = await lobbyService.closeLobby(req.user!.id, code);

  emitLobbyClosed(code);
  closeLobbyRoom(code);

  res.json({
    success: true,
    data: result,
  });
}

/**
 * GET /api/lobbies/:code/messages
 * Get chat messages for a lobby (paginated).
 */
export async function getMessages(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const code = getRouteParam(req.params.code, "code");
  const cursor = getSingleQueryValue(req.query.cursor);
  const limitValue = getSingleQueryValue(req.query.limit);

  // First verify the lobby exists
  const lobby = await lobbyService.getLobbyByCode(code);
  const limit = limitValue ? Number(limitValue) : undefined;
  const data = await messageService.listLobbyMessages(lobby.id, {
    cursor,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  res.json({
    success: true,
    data: data.messages,
    nextCursor: data.nextCursor,
  });
}

/**
 * GET /api/games
 * Get list of supported games with their rank tiers.
 */
export async function getGames(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  res.json({
    success: true,
    data: GAMES,
  });
}
