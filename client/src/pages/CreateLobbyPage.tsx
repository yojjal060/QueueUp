import {
  startTransition,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router";
import { SessionPanel } from "../components/SessionPanel";
import { StatusBanner } from "../components/StatusBanner";
import { useSession } from "../context/useSession";
import { useGames } from "../hooks/useGames";
import { createLobby } from "../services/api";
import { formatRank } from "../utils/formatters";
import { getGamePresentation } from "../utils/presentation";

export function CreateLobbyPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { games, isLoading, error } = useGames();
  const [title, setTitle] = useState("");
  const [game, setGame] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [rankFilter, setRankFilter] = useState("");
  const [hostRank, setHostRank] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolvedGameId = game || games[0]?.id || "";
  const selectedGame = useMemo(
    () => games.find((entry) => entry.id === resolvedGameId) ?? null,
    [games, resolvedGameId]
  );
  const presentation = getGamePresentation(selectedGame?.id);
  const previewTitle = title.trim() || "Night push protocol";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !selectedGame) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const createdLobby = await createLobby(
        {
          title: title.trim(),
          game: selectedGame.id,
          visibility,
          maxPlayers,
          rankFilter: rankFilter || null,
          hostRank: hostRank || null,
        },
        session.sessionToken
      );

      startTransition(() => {
        navigate(`/lobby/${createdLobby.code}`, {
          state: {
            notice: `Lobby ${createdLobby.code} is live and ready for invites.`,
          },
        });
      });
    } catch (createError) {
      setSubmitError(
        createError instanceof Error
          ? createError.message
          : "Could not create the lobby."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const formDisabled = !session || !selectedGame || isLoading;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <section className="glass-panel p-6 sm:p-7">
        <p className="eyebrow">New squad operation</p>
        <h1 className="font-display mt-3 max-w-3xl text-5xl leading-[0.95] tracking-[-0.05em] text-white">
          Draft the room before the first teammate arrives.
        </h1>
        <p className="mt-3 max-w-3xl text-white/67">
          Public rooms stay discoverable, private rooms stay invite-first, and the
          rank gate stays visible from the first second. Shape the lobby once, then
          hand your squad a clean entry point.
        </p>

        {error ? (
          <div className="mt-6">
            <StatusBanner tone="error" title="Games unavailable" message={error} />
          </div>
        ) : null}

        {submitError ? (
          <div className="mt-6">
            <StatusBanner tone="error" title="Create failed" message={submitError} />
          </div>
        ) : null}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block font-caps text-[11px] uppercase tracking-[0.24em] text-white/54">
              Lobby title
            </span>
            <input
              className="input-shell"
              disabled={formDisabled}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Late-night Erangel push"
              required
              value={title}
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-caps text-[11px] uppercase tracking-[0.24em] text-white/54">
                Game
              </span>
              <select
                className="input-shell"
                disabled={formDisabled}
                onChange={(event) => {
                  const nextGame =
                    games.find((entry) => entry.id === event.target.value) ?? null;
                  setGame(event.target.value);
                  setRankFilter("");
                  setHostRank("");
                  if (nextGame) {
                    setMaxPlayers(nextGame.maxPlayers);
                  }
                }}
                value={resolvedGameId}
              >
                {games.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-caps text-[11px] uppercase tracking-[0.24em] text-white/54">
                Visibility
              </span>
              <select
                className="input-shell"
                disabled={formDisabled}
                onChange={(event) =>
                  setVisibility(event.target.value as "PUBLIC" | "PRIVATE")
                }
                value={visibility}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-caps text-[11px] uppercase tracking-[0.24em] text-white/54">
                Host rank
              </span>
              <select
                className="input-shell"
                disabled={formDisabled}
                onChange={(event) => setHostRank(event.target.value)}
                value={hostRank}
              >
                <option value="">Prefer not to say</option>
                {selectedGame?.ranks.map((rank) => (
                  <option key={rank} value={rank}>
                    {formatRank(rank)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-caps text-[11px] uppercase tracking-[0.24em] text-white/54">
                Minimum rank filter
              </span>
              <select
                className="input-shell"
                disabled={formDisabled}
                onChange={(event) => setRankFilter(event.target.value)}
                value={rankFilter}
              >
                <option value="">No minimum</option>
                {selectedGame?.ranks.map((rank) => (
                  <option key={rank} value={rank}>
                    {formatRank(rank)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block font-caps text-[11px] uppercase tracking-[0.24em] text-white/54">
              Max players
            </span>
            <input
              className="input-shell"
              disabled={formDisabled}
              max={selectedGame?.maxPlayers ?? 10}
              min={2}
              onChange={(event) => setMaxPlayers(Number(event.target.value))}
              type="number"
              value={maxPlayers}
            />
            <p className="mt-2 text-sm text-white/55">
              Recommended ceiling for {selectedGame?.name ?? "the selected game"}:{" "}
              {selectedGame?.maxPlayers ?? 4}
            </p>
          </label>

          <div className="flex flex-wrap gap-3">
            <button className="button-primary" disabled={formDisabled || isSubmitting} type="submit">
              {isSubmitting ? "Creating lobby..." : "Launch lobby"}
            </button>
            <Link className="button-secondary" to="/browse">
              Review live squads
            </Link>
          </div>
        </form>
      </section>

      <div className="space-y-6">
        <article
          className={`hero-shell relative min-h-[420px] overflow-hidden p-6 sm:p-7 ${presentation.heroBackgroundClass}`}
        >
          <div className="absolute inset-x-[12%] top-16 h-[52%] rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_34%_30%,rgba(158,232,232,0.24),transparent_16%),radial-gradient(circle_at_80%_58%,rgba(255,181,159,0.2),transparent_22%),linear-gradient(160deg,rgba(7,16,20,0.94),rgba(11,18,24,0.84)_46%,rgba(28,17,14,0.92))]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex flex-wrap gap-2">
              <span className={`status-chip ${presentation.accentBorderClass}`}>
                {selectedGame?.shortName ?? "QueueUp"}
              </span>
              <span className="status-chip">
                {visibility === "PUBLIC" ? "Public room" : "Private route"}
              </span>
            </div>

            <div>
              <p className="eyebrow text-[#9ee8e8]">Live preview</p>
              <h2 className="font-display mt-3 text-4xl leading-none text-white">
                {previewTitle}
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/68">
                Hosted by{" "}
                <span className="text-white">
                  {session?.username ?? "your future callsign"}
                </span>
                . {rankFilter ? `${formatRank(rankFilter)} and above.` : "Open rank entry."}{" "}
                Room code gets minted the moment you publish.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Seats
                </p>
                <p className="mt-2 text-2xl text-white">1/{maxPlayers}</p>
              </div>
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Host rank
                </p>
                <p className="mt-2 text-2xl text-white">{formatRank(hostRank)}</p>
              </div>
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Code
                </p>
                <p className="mt-2 text-lg tracking-[0.22em] text-white">AUTO</p>
              </div>
            </div>
          </div>
        </article>

        <SessionPanel
          compact
          title="Activate your callsign"
          description="Your callsign becomes the host identity for the room. Create or restore it here before you publish."
        />

        <aside className="glass-panel p-6">
          <p className="eyebrow">Host notes</p>
          <div className="mt-5 space-y-4">
            <div className="glass-panel-soft p-4">
              <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-[#ffb59f]">
                Public discovery
              </p>
              <p className="mt-2 text-sm leading-6 text-white/68">
                Public rooms show up in the browse feed with member counts and rank
                expectations intact.
              </p>
            </div>
            <div className="glass-panel-soft p-4">
              <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-[#9ee8e8]">
                Invite-first route
              </p>
              <p className="mt-2 text-sm leading-6 text-white/68">
                Private rooms stay cleaner for friend stacks and tournament prep by
                moving through a shared code.
              </p>
            </div>
            <div className="glass-panel-soft p-4">
              <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-[#ffb59f]">
                Hard rank gate
              </p>
              <p className="mt-2 text-sm leading-6 text-white/68">
                The rank filter is enforced by the backend, so the lobby brief stays
                honest after it goes live.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
