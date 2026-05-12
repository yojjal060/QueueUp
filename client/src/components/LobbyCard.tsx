import { Link } from "react-router";
import type { GameConfig, Lobby } from "../types/api";
import { formatRank, formatRelativeTime } from "../utils/formatters";
import { getGamePresentation, getInitials } from "../utils/presentation";

interface LobbyCardProps {
  lobby: Lobby;
  game?: GameConfig;
}

export function LobbyCard({ lobby, game }: LobbyCardProps) {
  const presentation = getGamePresentation(lobby.game);
  const gameLabel = game?.name ?? presentation.label;
  const memberCount = lobby._count?.members ?? lobby.members.length;
  const host = lobby.members.find((member) => member.role === "HOST");
  const visibleMembers = lobby.members.slice(0, 3);

  return (
    <article className="glass-panel scan-surface overflow-hidden p-4 sm:p-5">
      <div
        className={`overflow-hidden rounded-[26px] border border-white/8 p-5 ${presentation.mediaBackgroundClass}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className={`status-chip ${presentation.accentBorderClass}`}>
              {presentation.shortLabel}
            </span>
            {lobby.rankFilter ? (
              <span className="status-chip">Rank: {formatRank(lobby.rankFilter)}</span>
            ) : (
              <span className="status-chip">Open rank</span>
            )}
          </div>

          <span className="status-chip">
            {memberCount}/{lobby.maxPlayers}
          </span>
        </div>

        <div className="mt-16">
          <p className={`eyebrow ${presentation.accentClass}`}>Available operation</p>
          <h3 className="font-display mt-3 text-3xl leading-none text-white">
            {lobby.title}
          </h3>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/68">
            {host ? `${host.user.username} is running this ${gameLabel} room.` : "Host ready."}{" "}
            {lobby.visibility === "PRIVATE"
              ? "Invite-only route with a direct code handoff."
              : "Open discovery with live capacity and rank-aware entry."}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex -space-x-3">
              {visibleMembers.map((member) => (
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#141312] bg-[#2b2a28] font-caps text-[11px] uppercase tracking-[0.18em] text-white"
                  key={member.id}
                >
                  {getInitials(member.user.username)}
                </div>
              ))}
              {memberCount > visibleMembers.length ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-white/25 bg-transparent font-caps text-[11px] uppercase tracking-[0.18em] text-white/65">
                  +{memberCount - visibleMembers.length}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/56">
              <span>Code {lobby.code}</span>
              <span>Opened {formatRelativeTime(lobby.createdAt)}</span>
            </div>
          </div>

          <Link className="button-secondary" to={`/lobby/${lobby.code}`}>
            Inspect Lobby
          </Link>
        </div>
      </div>
    </article>
  );
}
