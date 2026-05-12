import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { LobbyCard } from "../components/LobbyCard";
import { StatusBanner } from "../components/StatusBanner";
import { useGames } from "../hooks/useGames";
import { listPublicLobbies } from "../services/api";
import type { Lobby } from "../types/api";
import { formatRank, formatRelativeTime } from "../utils/formatters";
import { getGamePresentation, getInitials } from "../utils/presentation";

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { games, isLoading: gamesLoading, error: gamesError } = useGames();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState(
    searchParams.get("game")?.toUpperCase() || "ALL"
  );
  const [selectedRank, setSelectedRank] = useState("ALL");
  const [hasSlotsOnly, setHasSlotsOnly] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let isCancelled = false;

    async function loadLobbies() {
      try {
        const data = await listPublicLobbies({
          game: selectedGame === "ALL" ? undefined : selectedGame,
          hasSlots: hasSlotsOnly,
        });

        if (!isCancelled) {
          setLobbies(data);
          setError(null);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load public lobbies."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadLobbies();

    return () => {
      isCancelled = true;
    };
  }, [hasSlotsOnly, reloadKey, selectedGame]);

  const selectedGameConfig =
    selectedGame === "ALL"
      ? null
      : games.find((game) => game.id === selectedGame) ?? null;

  const visibleLobbies = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return lobbies.filter((lobby) => {
      const matchesSearch =
        !normalizedSearch ||
        lobby.title.toLowerCase().includes(normalizedSearch) ||
        lobby.code.toLowerCase().includes(normalizedSearch);

      const matchesRank =
        selectedRank === "ALL" || lobby.rankFilter === selectedRank;

      return matchesSearch && matchesRank;
    });
  }, [deferredSearch, lobbies, selectedRank]);

  const featuredLobby = visibleLobbies[0] ?? null;
  const spotlightLobbies = visibleLobbies.slice(1, 3);
  const remainingLobbies = visibleLobbies.slice(featuredLobby ? 1 + spotlightLobbies.length : 0);

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Available operations</p>
            <h1 className="font-display mt-3 max-w-3xl text-5xl leading-[0.95] tracking-[-0.05em] text-white">
              Find Your Next Squad
            </h1>
            <p className="mt-3 max-w-3xl text-white/66">
              Public lobbies stay visible, slot counts stay live, and rank gates
              stay upfront. This is the scouting surface for finding the right room
              before the energy of the session drops.
            </p>
          </div>

          <button
            className="button-secondary"
            onClick={() => {
              setIsLoading(true);
              setReloadKey((value) => value + 1);
            }}
            type="button"
          >
            Refresh Feed
          </button>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr_auto]">
          <label className="block">
            <span className="mb-2 block font-caps text-[11px] uppercase tracking-[0.24em] text-white/52">
              Search by title or code
            </span>
            <input
              className="input-shell"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Erangel, ranked, PUBG01"
              value={search}
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-caps text-[11px] uppercase tracking-[0.24em] text-white/52">
              Game
            </span>
            <select
              className="input-shell"
              onChange={(event) => {
                setIsLoading(true);
                const nextGame = event.target.value;
                setSelectedGame(nextGame);
                setSelectedRank("ALL");
                setSearchParams(nextGame === "ALL" ? {} : { game: nextGame });
              }}
              value={selectedGame}
            >
              <option value="ALL">All launch games</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-caps text-[11px] uppercase tracking-[0.24em] text-white/52">
              Minimum rank
            </span>
            <select
              className="input-shell"
              disabled={!selectedGameConfig}
              onChange={(event) => setSelectedRank(event.target.value)}
              value={selectedRank}
            >
              <option value="ALL">Any requirement</option>
              {selectedGameConfig?.ranks.map((rank) => (
                <option key={rank} value={rank}>
                  {formatRank(rank)}
                </option>
              ))}
            </select>
          </label>

          <label className="glass-panel-soft flex items-center gap-3 px-4 py-3 text-sm text-white/75">
            <input
              checked={hasSlotsOnly}
              className="h-4 w-4 accent-cyan-300"
              onChange={(event) => {
                setIsLoading(true);
                setHasSlotsOnly(event.target.checked);
              }}
              type="checkbox"
            />
            Open slots only
          </label>
        </div>
      </section>

      {gamesError ? (
        <StatusBanner tone="error" title="Games unavailable" message={gamesError} />
      ) : null}

      {error ? (
        <StatusBanner tone="error" title="Browse unavailable" message={error} />
      ) : null}

      {gamesLoading || isLoading ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="hero-shell h-[440px] animate-pulse bg-white/4" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="glass-panel h-[212px] animate-pulse bg-white/4" />
            ))}
          </div>
        </div>
      ) : visibleLobbies.length === 0 ? (
        <div className="glass-panel p-8 text-center sm:p-10">
          <p className="eyebrow">No matches</p>
          <h2 className="font-display mt-4 text-4xl text-white">
            Nothing fits this filter stack yet.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/65">
            Widen the game or rank guardrails, or open the room you wish already
            existed.
          </p>
          <div className="mt-6">
            <Link className="button-primary" to="/create">
              Launch a Lobby
            </Link>
          </div>
        </div>
      ) : (
        <>
          {featuredLobby ? (
            <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
              <article
                className={`hero-shell scan-surface relative min-h-[460px] overflow-hidden p-6 sm:p-8 ${
                  getGamePresentation(featuredLobby.game).heroBackgroundClass
                }`}
              >
                <div className="absolute inset-x-[12%] top-12 h-[62%] rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_34%_30%,rgba(158,232,232,0.28),transparent_16%),radial-gradient(circle_at_76%_58%,rgba(255,181,159,0.22),transparent_22%),linear-gradient(155deg,rgba(8,17,21,0.94),rgba(12,18,24,0.88)_42%,rgba(30,18,14,0.92))] opacity-90 shadow-[0_28px_90px_rgba(0,0,0,0.42)]" />
                <div className="absolute inset-x-[22%] top-20 h-[48%] rounded-[26px] border border-white/8 bg-[linear-gradient(160deg,rgba(9,18,22,0.64),rgba(23,18,16,0.28))]" />

                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`status-chip ${
                          getGamePresentation(featuredLobby.game).accentBorderClass
                        }`}
                      >
                        {getGamePresentation(featuredLobby.game).shortLabel}
                      </span>
                      {featuredLobby.rankFilter ? (
                        <span className="status-chip">
                          Rank: {formatRank(featuredLobby.rankFilter)}
                        </span>
                      ) : (
                        <span className="status-chip">Open rank</span>
                      )}
                    </div>
                    <span className="status-chip">
                      {featuredLobby.members.length}/{featuredLobby.maxPlayers} slots
                    </span>
                  </div>

                  <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                      <p className="eyebrow text-[#9ee8e8]">Featured operation</p>
                      <h2 className="font-display mt-3 text-4xl leading-none text-white sm:text-5xl">
                        {featuredLobby.title}
                      </h2>
                      <p className="mt-4 max-w-xl text-base leading-7 text-white/68">
                        Host{" "}
                        <span className="text-white">
                          {featuredLobby.members.find((member) => member.role === "HOST")?.user.username ??
                            "Unknown"}
                        </span>{" "}
                        is holding the room open. Jump in while the roster still has
                        space and the lobby brief is fresh.
                      </p>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <span className="status-chip border-[#ffb59f]/20 bg-[#802a0d]/16 text-[#fff6ee]">
                          {featuredLobby.visibility === "PUBLIC"
                            ? "Public discovery"
                            : "Private code"}
                        </span>
                        <span className="status-chip">
                          Opened {formatRelativeTime(featuredLobby.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/12 bg-[rgba(20,19,18,0.78)] p-5 backdrop-blur-xl">
                      <div className="flex -space-x-3">
                        {featuredLobby.members.slice(0, 3).map((member) => (
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#141312] bg-[#2b2a28] font-caps text-[11px] uppercase tracking-[0.18em] text-white"
                            key={member.id}
                          >
                            {getInitials(member.user.username)}
                          </div>
                        ))}
                        {featuredLobby.members.length > 3 ? (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/22 bg-transparent font-caps text-[11px] uppercase tracking-[0.18em] text-white/62">
                            +{featuredLobby.members.length - 3}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-6">
                        <div>
                          <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                            Code
                          </p>
                          <p className="mt-1 text-lg font-semibold tracking-[0.26em] text-white">
                            {featuredLobby.code}
                          </p>
                        </div>
                        <Link className="button-primary" to={`/lobby/${featuredLobby.code}`}>
                          Join Lobby
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <div className="space-y-4">
                {spotlightLobbies.map((lobby) => {
                  const presentation = getGamePresentation(lobby.game);

                  return (
                    <article className="glass-panel scan-surface p-5" key={lobby.id}>
                      <div
                        className={`rounded-[24px] border border-white/8 p-5 ${presentation.mediaBackgroundClass}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className={`status-chip ${presentation.accentBorderClass}`}>
                            {presentation.shortLabel}
                          </span>
                          <span className="font-caps text-[11px] uppercase tracking-[0.22em] text-white/42">
                            {lobby.members.length}/{lobby.maxPlayers}
                          </span>
                        </div>
                        <h3 className="font-display mt-10 text-3xl leading-none text-white">
                          {lobby.title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-white/66">
                          {lobby.rankFilter
                            ? `Guarded by a ${formatRank(lobby.rankFilter)} floor.`
                            : "Open-rank room with quick entry for the right squad."}
                        </p>
                        <div className="mt-6 flex items-center justify-between gap-3">
                          <div className="flex gap-1">
                            {Array.from({ length: lobby.maxPlayers }).map((_, index) => (
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  index < lobby.members.length
                                    ? "bg-[#ffb59f]"
                                    : "bg-white/18"
                                }`}
                                key={`${lobby.id}-${index}`}
                              />
                            ))}
                          </div>
                          <Link
                            className="font-caps text-[12px] uppercase tracking-[0.24em] text-[#ffb59f]"
                            to={`/lobby/${lobby.code}`}
                          >
                            Inspect
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {spotlightLobbies.length === 0 ? (
                  <div className="glass-panel-soft p-6">
                    <p className="eyebrow">Quiet feed</p>
                    <p className="mt-3 text-sm leading-6 text-white/66">
                      This filter stack is narrow right now, but the featured room is
                      still live and ready to inspect.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {remainingLobbies.length > 0 ? (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {remainingLobbies.map((lobby) => {
                const game = games.find((entry) => entry.id === lobby.game);
                return <LobbyCard key={lobby.id} game={game} lobby={lobby} />;
              })}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
