import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { LobbyCard } from "../components/LobbyCard";
import { StatusBanner } from "../components/StatusBanner";
import { useGames } from "../hooks/useGames";
import { listPublicLobbies } from "../services/api";
import type { Lobby } from "../types/api";
import { formatRank } from "../utils/formatters";

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

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow">Available lobbies</p>
          <h1 className="font-display mt-4 text-5xl leading-none text-white sm:text-6xl">
            Find your next squad.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/64">
            Filter quickly, open a room, and decide from the roster instead of
            reading through a wall of cards.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="button-secondary"
            onClick={() => {
              setIsLoading(true);
              setReloadKey((value) => value + 1);
            }}
            type="button"
          >
            Refresh
          </button>
          <Link className="button-primary" to="/create">
            Create lobby
          </Link>
        </div>
      </header>

      <section className="glass-panel p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr_1fr_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 block font-caps text-[11px] uppercase text-white/52">
              Search
            </span>
            <input
              className="input-shell"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title or code"
              value={search}
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-caps text-[11px] uppercase text-white/52">
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
              <option value="ALL">All games</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-caps text-[11px] uppercase text-white/52">
              Rank floor
            </span>
            <select
              className="input-shell"
              disabled={!selectedGameConfig}
              onChange={(event) => setSelectedRank(event.target.value)}
              value={selectedRank}
            >
              <option value="ALL">Any rank</option>
              {selectedGameConfig?.ranks.map((rank) => (
                <option key={rank} value={rank}>
                  {formatRank(rank)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex h-[52px] items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.03] px-4 text-sm text-white/75">
            <input
              checked={hasSlotsOnly}
              className="h-4 w-4 accent-cyan-300"
              onChange={(event) => {
                setIsLoading(true);
                setHasSlotsOnly(event.target.checked);
              }}
              type="checkbox"
            />
            Open slots
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
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="glass-panel h-[280px] animate-pulse bg-white/4" />
          ))}
        </section>
      ) : visibleLobbies.length === 0 ? (
        <section className="glass-panel p-8 text-center sm:p-10">
          <p className="eyebrow">No matches</p>
          <h2 className="font-display mt-4 text-4xl text-white">
            No lobby fits these filters.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/64">
            Try a wider rank filter or create the room you wanted to find.
          </p>
          <div className="mt-6">
            <Link className="button-primary" to="/create">
              Create lobby
            </Link>
          </div>
        </section>
      ) : (
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-caps text-[11px] uppercase text-white/44">
              {visibleLobbies.length} rooms found
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleLobbies.map((lobby) => {
              const game = games.find((entry) => entry.id === lobby.game);
              return <LobbyCard key={lobby.id} game={game} lobby={lobby} />;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
