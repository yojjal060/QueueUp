/**
 * Game configuration and rank tier definitions.
 * This is the single source of truth for supported games and their rank systems.
 * Stored in application code (not Prisma enums) so we can add games/ranks without migrations.
 */

export interface GameConfig {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  maxPlayers: number;
  ranks: string[];
}

export const GAMES: Record<string, GameConfig> = {
  PUBG_MOBILE: {
    id: "PUBG_MOBILE",
    name: "PUBG Mobile",
    shortName: "PUBG",
    icon: "🎯",
    maxPlayers: 4,
    ranks: [
      "BRONZE",
      "SILVER",
      "GOLD",
      "PLATINUM",
      "DIAMOND",
      "CROWN",
      "ACE",
      "ACE_MASTER",
      "ACE_DOMINATOR",
      "CONQUEROR",
    ],
  },
  MARVEL_RIVALS: {
    id: "MARVEL_RIVALS",
    name: "Marvel Rivals",
    shortName: "Marvel",
    icon: "🦸",
    maxPlayers: 6,
    ranks: [
      "BRONZE_III",
      "BRONZE_II",
      "BRONZE_I",
      "SILVER_III",
      "SILVER_II",
      "SILVER_I",
      "GOLD_III",
      "GOLD_II",
      "GOLD_I",
      "PLATINUM_III",
      "PLATINUM_II",
      "PLATINUM_I",
      "DIAMOND_III",
      "DIAMOND_II",
      "DIAMOND_I",
      "GRANDMASTER_III",
      "GRANDMASTER_II",
      "GRANDMASTER_I",
      "CELESTIAL_III",
      "CELESTIAL_II",
      "CELESTIAL_I",
      "ETERNITY",
      "ONE_ABOVE_ALL",
    ],
  },
};

/**
 * Returns the numerical index of a rank within its game's tier list.
 * Higher index = higher rank. Returns -1 if rank is not found.
 */
export function getRankIndex(gameId: string, rank: string): number {
  const game = GAMES[gameId];
  if (!game) return -1;
  return game.ranks.indexOf(rank);
}

/**
 * Checks if a player's rank meets the minimum rank filter for a lobby.
 * Returns true if no rank filter is set, or if the player's rank is >= the filter.
 */
export function meetsRankFilter(
  gameId: string,
  playerRank: string | null | undefined,
  lobbyRankFilter: string | null | undefined
): boolean {
  if (!lobbyRankFilter) return true; // No filter = anyone can join
  if (!playerRank) return false; // Filter set but player has no rank = blocked

  const playerIndex = getRankIndex(gameId, playerRank);
  const filterIndex = getRankIndex(gameId, lobbyRankFilter);

  if (playerIndex === -1 || filterIndex === -1) return true; // Unknown ranks = allow
  return playerIndex >= filterIndex;
}

/**
 * Get a human-readable label for a rank string.
 */
export function formatRank(rank: string): string {
  return rank
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bIii\b/g, "III")
    .replace(/\bIi\b/g, "II");
}

/**
 * Get list of all supported game IDs.
 */
export function getSupportedGameIds(): string[] {
  return Object.keys(GAMES);
}
