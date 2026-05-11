import { prisma } from "../libs/prisma.js";
import { generateLobbyCode } from "../utils/generateCode.js";
import { meetsRankFilter, GAMES } from "../constants/games.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  Game,
  LobbyVisibility,
  Prisma,
} from "../generated/prisma/client.js";

// ─── Shared includes for consistent lobby responses ──────────────────────────

const lobbyWithMembers = {
  members: {
    include: {
      user: {
        select: { id: true, username: true, avatar: true },
      },
    },
    orderBy: { joinedAt: "asc" as const },
  },
} satisfies Prisma.LobbyInclude;

export type LobbyWithMembers = Prisma.LobbyGetPayload<{
  include: typeof lobbyWithMembers;
}>;

export async function getActiveLobbyMembershipForUser(userId: string) {
  const membership = await prisma.lobbyMember.findFirst({
    where: {
      userId,
      lobby: { isActive: true },
    },
    select: {
      lobbyId: true,
      role: true,
      lobby: {
        select: {
          code: true,
          title: true,
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  return {
    lobbyId: membership.lobbyId,
    role: membership.role,
    lobbyCode: membership.lobby.code,
    lobbyTitle: membership.lobby.title,
  };
}

async function ensureNoOtherActiveLobby(userId: string, targetCode?: string) {
  const activeMembership = await getActiveLobbyMembershipForUser(userId);

  if (!activeMembership) {
    return;
  }

  if (targetCode && activeMembership.lobbyCode === targetCode) {
    return;
  }

  throw new AppError("You are already in an active lobby", 409, {
    code: "ActiveLobbyConflict",
    details: {
      activeLobbyCode: activeMembership.lobbyCode,
      activeLobbyTitle: activeMembership.lobbyTitle,
    },
  });
}

// ─── Create Lobby ────────────────────────────────────────────────────────────

export interface CreateLobbyInput {
  userId: string;
  title: string;
  game: Game;
  visibility: LobbyVisibility;
  maxPlayers?: number;
  rankFilter?: string | null;
  hostRank?: string | null;
}

export async function createLobby(input: CreateLobbyInput) {
  const { userId, title, game, visibility, maxPlayers, rankFilter, hostRank } =
    input;

  await ensureNoOtherActiveLobby(userId);

  // Validate game
  if (!GAMES[game]) {
    throw new AppError(`Unsupported game: ${game}`, 400);
  }

  // Validate maxPlayers
  const max = maxPlayers ?? GAMES[game]!.maxPlayers;
  if (max < 2 || max > 10) {
    throw new AppError("Max players must be between 2 and 10", 400);
  }

  // Validate rank filter if provided
  if (rankFilter && !GAMES[game]!.ranks.includes(rankFilter)) {
    throw new AppError(`Invalid rank filter "${rankFilter}" for ${game}`, 400);
  }

  const code = generateLobbyCode();

  return prisma.$transaction(async (tx) => {
    const lobby = await tx.lobby.create({
      data: {
        code,
        title,
        game,
        visibility,
        maxPlayers: max,
        rankFilter: rankFilter ?? null,
      },
    });

    await tx.lobbyMember.create({
      data: {
        userId,
        lobbyId: lobby.id,
        role: "HOST",
        rank: hostRank ?? null,
      },
    });

    // Return lobby with members included
    return tx.lobby.findUnique({
      where: { id: lobby.id },
      include: lobbyWithMembers,
    });
  });
}

// ─── Join Lobby ──────────────────────────────────────────────────────────────

export interface JoinLobbyInput {
  userId: string;
  code: string;
  rank?: string | null;
}

export async function joinLobby(input: JoinLobbyInput) {
  const { userId, code, rank } = input;

  const lobby = await prisma.lobby.findUnique({
    where: { code },
    include: { members: true },
  });

  if (!lobby || !lobby.isActive) {
    throw new AppError("Lobby not found or is no longer active", 404);
  }

  // Check if already a member
  const existing = lobby.members.find((m) => m.userId === userId);
  if (existing) {
    throw new AppError("You are already in this lobby", 409);
  }

  await ensureNoOtherActiveLobby(userId, code);

  // Check if lobby is full
  if (lobby.members.length >= lobby.maxPlayers) {
    throw new AppError("Lobby is full", 400);
  }

  // Check rank filter (hard block)
  if (!meetsRankFilter(lobby.game, rank, lobby.rankFilter)) {
    throw new AppError(
      `Your rank does not meet the minimum requirement for this lobby`,
      403
    );
  }

  await prisma.lobbyMember.create({
    data: {
      userId,
      lobbyId: lobby.id,
      role: "MEMBER",
      rank: rank ?? null,
    },
  });

  // Return updated lobby with members
  return prisma.lobby.findUnique({
    where: { id: lobby.id },
    include: lobbyWithMembers,
  });
}

// ─── Leave Lobby ─────────────────────────────────────────────────────────────

export async function leaveLobby(userId: string, code: string) {
  const lobby = await prisma.lobby.findUnique({
    where: { code },
    include: { members: { orderBy: { joinedAt: "asc" } } },
  });

  if (!lobby) {
    throw new AppError("Lobby not found", 404);
  }

  const member = lobby.members.find((m) => m.userId === userId);
  if (!member) {
    throw new AppError("You are not in this lobby", 400);
  }

  // Remove the member
  await prisma.lobbyMember.delete({
    where: { id: member.id },
  });

  const isHost = member.role === "HOST";
  const remainingMembers = lobby.members.filter((m) => m.userId !== userId);

  // If host left and there are remaining members, transfer ownership
  let newHostId: string | null = null;
  if (isHost && remainingMembers.length > 0) {
    const nextHost = remainingMembers[0]!;
    await prisma.lobbyMember.update({
      where: { id: nextHost.id },
      data: { role: "HOST" },
    });
    newHostId = nextHost.userId;
  }

  // If no members left, close the lobby
  if (remainingMembers.length === 0) {
    await prisma.lobby.update({
      where: { id: lobby.id },
      data: { isActive: false },
    });
  }

  return { lobbyId: lobby.id, newHostId, lobbyClosed: remainingMembers.length === 0 };
}

// ─── List Public Lobbies ─────────────────────────────────────────────────────

export interface ListLobbiesFilter {
  game?: Game;
  hasSlots?: boolean;
}

export async function listPublicLobbies(filter: ListLobbiesFilter = {}) {
  const lobbies = await prisma.lobby.findMany({
    where: {
      visibility: "PUBLIC",
      isActive: true,
      ...(filter.game ? { game: filter.game } : {}),
    },
    include: {
      ...lobbyWithMembers,
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by available slots if requested
  if (filter.hasSlots) {
    return lobbies.filter((l) => l._count.members < l.maxPlayers);
  }

  return lobbies;
}

// ─── Get Lobby By Code ───────────────────────────────────────────────────────

export async function getLobbyByCode(code: string) {
  const lobby = await prisma.lobby.findUnique({
    where: { code },
    include: lobbyWithMembers,
  });

  if (!lobby) {
    throw new AppError("Lobby not found", 404);
  }

  return lobby;
}

export async function getLobbyMemberByCode(code: string, userId: string) {
  return prisma.lobbyMember.findFirst({
    where: {
      userId,
      lobby: { code },
    },
    include: {
      lobby: true,
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
          sessionToken: true,
        },
      },
    },
  });
}

// ─── Close Lobby (Host Only) ─────────────────────────────────────────────────

export async function closeLobby(userId: string, code: string) {
  const lobby = await prisma.lobby.findUnique({
    where: { code },
    include: { members: true },
  });

  if (!lobby) {
    throw new AppError("Lobby not found", 404);
  }

  const hostMember = lobby.members.find(
    (m) => m.userId === userId && m.role === "HOST"
  );

  if (!hostMember) {
    throw new AppError("Only the host can close the lobby", 403);
  }

  await prisma.lobby.update({
    where: { id: lobby.id },
    data: { isActive: false },
  });

  return { lobbyId: lobby.id };
}

// ─── Transfer Host ───────────────────────────────────────────────────────────

export async function transferHost(
  currentHostId: string,
  code: string,
  newHostUserId: string
) {
  const lobby = await prisma.lobby.findUnique({
    where: { code },
    include: { members: true },
  });

  if (!lobby) {
    throw new AppError("Lobby not found", 404);
  }

  const currentHost = lobby.members.find(
    (m) => m.userId === currentHostId && m.role === "HOST"
  );
  if (!currentHost) {
    throw new AppError("Only the current host can transfer ownership", 403);
  }

  const newHost = lobby.members.find((m) => m.userId === newHostUserId);
  if (!newHost) {
    throw new AppError("Target user is not a member of this lobby", 400);
  }

  await prisma.$transaction([
    prisma.lobbyMember.update({
      where: { id: currentHost.id },
      data: { role: "MEMBER" },
    }),
    prisma.lobbyMember.update({
      where: { id: newHost.id },
      data: { role: "HOST" },
    }),
  ]);

  return prisma.lobby.findUnique({
    where: { id: lobby.id },
    include: lobbyWithMembers,
  });
}
