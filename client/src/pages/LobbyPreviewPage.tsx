import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router";
import { SessionPanel } from "../components/SessionPanel";
import { StatusBanner } from "../components/StatusBanner";
import { useSession } from "../context/useSession";
import { useGames } from "../hooks/useGames";
import { ApiError, getLobby, getLobbyMessages, joinLobby } from "../services/api";
import type { Lobby, Message } from "../types/api";
import {
  formatGameId,
  formatRank,
  formatRelativeTime,
  formatVisibility,
} from "../utils/formatters";
import { getGamePresentation, getInitials } from "../utils/presentation";

export function LobbyPreviewPage() {
  const { code = "" } = useParams();
  const location = useLocation();
  const { session } = useSession();
  const { games } = useGames();
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    typeof (location.state as { notice?: unknown } | null)?.notice === "string"
      ? ((location.state as { notice?: string }).notice ?? null)
      : null
  );
  const [joinRank, setJoinRank] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const game = useMemo(
    () => games.find((entry) => entry.id === lobby?.game) ?? null,
    [games, lobby?.game]
  );
  const presentation = getGamePresentation(lobby?.game);

  const viewerMembership = useMemo(
    () =>
      lobby?.members.find((member) => member.userId === session?.id) ?? null,
    [lobby, session?.id]
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadLobby() {
      if (!code) {
        if (!isCancelled) {
          setError("Missing lobby code.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const [lobbyData, messageData] = await Promise.all([
          getLobby(code.toUpperCase()),
          getLobbyMessages(code.toUpperCase()),
        ]);

        if (!isCancelled) {
          setLobby(lobbyData);
          setMessages(messageData.data);
          setJoinRank((currentRank) => currentRank || lobbyData.rankFilter || "");
          setError(null);
        }
      } catch (loadError) {
        if (!isCancelled) {
          if (loadError instanceof ApiError) {
            setError(loadError.message);
          } else {
            setError("Could not load this lobby.");
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadLobby();

    return () => {
      isCancelled = true;
    };
  }, [code]);

  async function handleJoin() {
    if (!session || !lobby) {
      return;
    }

    try {
      setIsJoining(true);
      setJoinError(null);
      const joinedLobby = await joinLobby(
        lobby.code,
        joinRank || null,
        session.sessionToken
      );

      setLobby(joinedLobby);
      setNotice(`You joined ${joinedLobby.code}. Your slot is now locked in.`);
    } catch (joinAttemptError) {
      setJoinError(
        joinAttemptError instanceof Error
          ? joinAttemptError.message
          : "Could not join this lobby."
      );
    } finally {
      setIsJoining(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="hero-shell h-[360px] animate-pulse bg-white/4" />
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="glass-panel h-[320px] animate-pulse bg-white/4" />
          <div className="glass-panel h-[320px] animate-pulse bg-white/4" />
        </div>
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className="mx-auto max-w-3xl">
        <StatusBanner
          tone="error"
          title="Lobby unavailable"
          message={error ?? "This lobby could not be found."}
        />
      </div>
    );
  }

  const host = lobby.members.find((member) => member.role === "HOST") ?? null;
  const availableSeats = Math.max(lobby.maxPlayers - lobby.members.length, 0);
  const recentMessages = messages.slice(-6);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <section className="space-y-6">
        <article
          className={`hero-shell relative overflow-hidden p-6 sm:p-8 ${presentation.heroBackgroundClass}`}
        >
          <div className="absolute inset-x-[14%] top-14 h-[54%] rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_34%_28%,rgba(158,232,232,0.22),transparent_18%),radial-gradient(circle_at_80%_60%,rgba(255,181,159,0.18),transparent_24%),linear-gradient(160deg,rgba(7,16,20,0.94),rgba(12,18,24,0.84)_46%,rgba(28,17,14,0.92))]" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className={`status-chip ${presentation.accentBorderClass}`}>
                    {game?.name ?? formatGameId(lobby.game)}
                  </span>
                  <span className="status-chip">{formatVisibility(lobby.visibility)}</span>
                  <span className="status-chip">
                    {lobby.members.length}/{lobby.maxPlayers} players
                  </span>
                </div>
                <h1 className="font-display mt-5 max-w-3xl text-4xl leading-none text-white sm:text-5xl">
                  {lobby.title}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
                  {host ? `${host.user.username} is anchoring this room.` : "Host ready."}{" "}
                  {lobby.rankFilter
                    ? `Entry is tuned for ${formatRank(lobby.rankFilter)} and above.`
                    : "Entry is open-rank, but the roster still stays visible before you step in."}
                </p>
              </div>

              <div className="rounded-[26px] border border-white/12 bg-[rgba(20,19,18,0.8)] px-5 py-4 text-right backdrop-blur-xl">
                <p className="font-caps text-[10px] uppercase tracking-[0.3em] text-white/42">
                  Code
                </p>
                <p className="mt-2 text-xl font-semibold tracking-[0.32em] text-white">
                  {lobby.code}
                </p>
              </div>
            </div>

            {notice ? (
              <div className="mt-6">
                <StatusBanner tone="success" title="Ready" message={notice} />
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Minimum rank
                </p>
                <p className="mt-2 text-lg text-white">{formatRank(lobby.rankFilter)}</p>
              </div>
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Opened
                </p>
                <p className="mt-2 text-lg text-white">
                  {formatRelativeTime(lobby.createdAt)}
                </p>
              </div>
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Status
                </p>
                <p className="mt-2 text-lg text-white">
                  {lobby.isActive ? `${availableSeats} seats open` : "Lobby closed"}
                </p>
              </div>
            </div>
          </div>
        </article>

        <div className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
          <section className="glass-panel p-6">
            <p className="eyebrow">Current roster</p>
            <div className="mt-5 space-y-3">
              {lobby.members.map((member) => (
                <div
                  key={member.id}
                  className="glass-panel-soft flex flex-wrap items-center justify-between gap-4 px-4 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#2b2a28] font-caps text-[11px] uppercase tracking-[0.18em] text-white">
                      {getInitials(member.user.username)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {member.user.username}
                      </p>
                      <p className="text-sm text-white/60">
                        {member.rank ? formatRank(member.rank) : "Rank hidden"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {member.role === "HOST" ? (
                      <span className="status-chip border-[#ffb59f]/20 bg-[#802a0d]/16 text-[#fff6ee]">
                        Host
                      </span>
                    ) : null}
                    <span className="status-chip">
                      {formatRelativeTime(member.joinedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel p-6">
            <p className="eyebrow">Mission parameters</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Visibility
                </p>
                <p className="mt-2 text-lg text-white">
                  {formatVisibility(lobby.visibility)}
                </p>
              </div>
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Available seats
                </p>
                <p className="mt-2 text-lg text-white">{availableSeats}</p>
              </div>
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Host
                </p>
                <p className="mt-2 text-lg text-white">
                  {host?.user.username ?? "Unknown"}
                </p>
              </div>
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Game
                </p>
                <p className="mt-2 text-lg text-white">
                  {game?.name ?? formatGameId(lobby.game)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/8 bg-white/4 p-5">
              <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-[#9ee8e8]">
                Room brief
              </p>
              <p className="mt-3 text-sm leading-7 text-white/68">
                Preview first, then commit. This page keeps the member list, rank
                floor, and recent chat visible so nobody joins blind.
              </p>
            </div>
          </section>
        </div>

        <section className="glass-panel p-6">
          <p className="eyebrow">Recent transmissions</p>
          <div className="mt-5 space-y-3">
            {recentMessages.length === 0 ? (
              <div className="glass-panel-soft p-5">
                <p className="text-sm leading-6 text-white/62">
                  No chat history yet. The room is clean and waiting for the first
                  message.
                </p>
              </div>
            ) : (
              recentMessages.map((message) => (
                <div key={message.id} className="glass-panel-soft px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#2b2a28] font-caps text-[10px] uppercase tracking-[0.18em] text-white">
                        {getInitials(message.user.username)}
                      </div>
                      <p className="font-semibold text-white">{message.user.username}</p>
                    </div>
                    <p className="font-caps text-[10px] uppercase tracking-[0.22em] text-white/40">
                      {formatRelativeTime(message.createdAt)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/70">
                    {message.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <aside className="space-y-6">
        {session ? (
          <div className="glass-panel p-6">
            <p className="eyebrow">Your access</p>
            {viewerMembership ? (
              <StatusBanner
                tone="success"
                title="Already in"
                message={`You are already part of ${lobby.code}. The roster is holding your seat.`}
              />
            ) : (
              <>
                <h2 className="font-display mt-3 text-3xl text-white">
                  Join this lobby
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Pick your current rank for {game?.name ?? "this game"} and QueueUp
                  will validate it against the room&apos;s published floor before you
                  take the slot.
                </p>

                <label className="mt-5 block">
                  <span className="mb-2 block font-caps text-[11px] uppercase tracking-[0.24em] text-white/54">
                    Your rank
                  </span>
                  <select
                    className="input-shell"
                    onChange={(event) => setJoinRank(event.target.value)}
                    value={joinRank}
                  >
                    <option value="">Choose a rank</option>
                    {game?.ranks.map((rank) => (
                      <option key={rank} value={rank}>
                        {formatRank(rank)}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="button-primary mt-5 w-full"
                  disabled={isJoining || !lobby.isActive}
                  onClick={() => void handleJoin()}
                  type="button"
                >
                  {isJoining
                    ? "Joining lobby..."
                    : lobby.isActive
                      ? "Join lobby"
                      : "Lobby closed"}
                </button>

                {joinError ? (
                  <div className="mt-4">
                    <StatusBanner tone="error" title="Join blocked" message={joinError} />
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <SessionPanel
            title="Launch your callsign to take the slot"
            description="Browsing stays open, but joining the roster still needs an active callsign so the host can see exactly who entered."
          />
        )}

        <div className="glass-panel p-6">
          <p className="eyebrow">Tactical brief</p>
          <div className="mt-5 space-y-4">
            <div className="glass-panel-soft p-4">
              <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-[#ffb59f]">
                Invite signal
              </p>
              <p className="mt-2 text-sm leading-6 text-white/68">
                Code {lobby.code} is the direct handoff between host and squad.
              </p>
            </div>
            <div className="glass-panel-soft p-4">
              <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-[#9ee8e8]">
                Rank floor
              </p>
              <p className="mt-2 text-sm leading-6 text-white/68">
                {lobby.rankFilter
                  ? `${formatRank(lobby.rankFilter)} is enforced before the join completes.`
                  : "No minimum rank is enforced for this room."}
              </p>
            </div>
            <div className="glass-panel-soft p-4">
              <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-[#ffb59f]">
                Room state
              </p>
              <p className="mt-2 text-sm leading-6 text-white/68">
                {lobby.isActive
                  ? `${availableSeats} seats are still open right now.`
                  : "This lobby has already been closed by the host or room state."}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
