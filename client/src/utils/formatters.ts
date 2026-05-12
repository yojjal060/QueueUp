export function formatRank(rank: string | null | undefined) {
  if (!rank) {
    return "Open rank";
  }

  return rank
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .replace(/\bIii\b/g, "III")
    .replace(/\bIi\b/g, "II");
}

export function formatVisibility(visibility: "PUBLIC" | "PRIVATE") {
  return visibility === "PUBLIC" ? "Public" : "Private";
}

export function formatGameId(gameId: string) {
  return gameId
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatRelativeTime(isoDate: string) {
  const timestamp = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMinutes = Math.max(Math.round((now - timestamp) / 60_000), 0);

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}
