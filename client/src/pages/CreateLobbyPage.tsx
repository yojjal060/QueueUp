import { startTransition, useMemo, useState, type FormEvent } from "react";
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
  const previewTitle = title.trim() || "Ranked squad room";
  const formDisabled = !session || !selectedGame || isLoading;

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

  return (
    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.05fr)_420px]">
      <section>
        <header className="max-w-3xl">
          <p className="eyebrow">Create lobby</p>
          <h1 className="font-display mt-4 text-5xl leading-none text-white sm:text-6xl">
            Set the room rules once.
          </h1>
          <p className="mt-4 text-base leading-7 text-white/64">
            Keep the form short: title, game, capacity, and the rank context
            teammates need before they join.
          </p>
        </header>

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

        <form className="glass-panel mt-8 space-y-6 p-5 sm:p-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block font-caps text-[11px] uppercase text-white/54">
              Lobby title
            </span>
            <input
              className="input-shell"
              disabled={formDisabled}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Late-night ranked push"
              required
              value={title}
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-caps text-[11px] uppercase text-white/54">
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
              <span className="mb-2 block font-caps text-[11px] uppercase text-white/54">
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

          <div className="grid gap-5 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block font-caps text-[11px] uppercase text-white/54">
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
            </label>

            <label className="block md:col-span-1">
              <span className="mb-2 block font-caps text-[11px] uppercase text-white/54">
                Your rank
              </span>
              <select
                className="input-shell"
                disabled={formDisabled}
                onChange={(event) => setHostRank(event.target.value)}
                value={hostRank}
              >
                <option value="">Hidden</option>
                {selectedGame?.ranks.map((rank) => (
                  <option key={rank} value={rank}>
                    {formatRank(rank)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-1">
              <span className="mb-2 block font-caps text-[11px] uppercase text-white/54">
                Rank floor
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

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="button-primary"
              disabled={formDisabled || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating..." : "Launch lobby"}
            </button>
            <Link className="button-secondary" to="/browse">
              Browse first
            </Link>
          </div>
        </form>
      </section>

      <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
        <article
          className={`hero-shell min-h-[360px] overflow-hidden p-6 ${presentation.heroBackgroundClass}`}
        >
          <div className="flex h-full min-h-[310px] flex-col justify-between">
            <div className="flex flex-wrap gap-2">
              <span className={`status-chip ${presentation.accentBorderClass}`}>
                {selectedGame?.shortName ?? "QueueUp"}
              </span>
              <span className="status-chip">
                {visibility === "PUBLIC" ? "Public" : "Private"}
              </span>
            </div>

            <div>
              <p className="eyebrow text-[#9ee8e8]">Preview</p>
              <h2 className="font-display mt-3 text-4xl leading-tight text-white">
                {previewTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/66">
                {rankFilter ? `${formatRank(rankFilter)} and above.` : "Open rank."}{" "}
                {maxPlayers} seats max.
              </p>
            </div>
          </div>
        </article>

        <SessionPanel
          compact
          title="Use your callsign"
          description="Your callsign becomes the host identity shown in the lobby."
        />
      </aside>
    </div>
  );
}
