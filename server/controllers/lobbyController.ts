import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/session.js";
import * as lobbyService from "../services/lobbyService.js";
import { GAMES, getSupportedGameIds } from "../constants/games.js";
import { AppError } from "../middleware/errorHandler.js";
import type { Game, LobbyVisibility } from "../generated/prisma/client.js";

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
  const { game, hasSlots } = req.query;

  const lobbies = await lobbyService.listPublicLobbies({
    game: game && getSupportedGameIds().includes(game as string)
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
  const { code } = req.params;
  const lobby = await lobbyService.getLobbyByCode(code!);

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
  const { code } = req.params;
  const { rank } = req.body;

  const lobby = await lobbyService.joinLobby({
    userId: req.user!.id,
    code: code!,
    rank: rank ?? null,
  });

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
  const { code } = req.params;
  const result = await lobbyService.leaveLobby(req.user!.id, code!);

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
  const { code } = req.params;
  const result = await lobbyService.closeLobby(req.user!.id, code!);

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
  const { code } = req.params;
  const { cursor, limit } = req.query;

  // First verify the lobby exists
  const lobby = await lobbyService.getLobbyByCode(code!);

  // Import prisma directly for the messages query
  const { prisma } = await import("../libs/prisma.js");

  const take = Math.min(Number(limit) || 50, 100);

  const messages = await prisma.message.findMany({
    where: { lobbyId: lobby.id },
    include: {
      user: {
        select: { id: true, username: true, avatar: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor as string },
        }
      : {}),
  });

  res.json({
    success: true,
    data: messages.reverse(), // Return in chronological order
    nextCursor: messages.length === take ? messages[0]?.id : null,
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
