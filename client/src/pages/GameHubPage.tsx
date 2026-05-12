import { Link } from "react-router";
import queueupIcon from "../assets/queueup-hero-icon.png";
import { StatusBanner } from "../components/StatusBanner";
import { useGames } from "../hooks/useGames";
import type { GameConfig } from "../types/api";
import { formatRank } from "../utils/formatters";
import { getGamePresentation } from "../utils/presentation";

function GameCard({ game }: { game: GameConfig }) {
  const presentation = getGamePresentation(game.id);
  const sampleRanks = [
    game.ranks[0],
    game.ranks[Math.floor(game.ranks.length / 2)],
    game.ranks[game.ranks.length - 1],
  ].filter(Boolean);

  return (
    <article className={`glass-panel scan-surface p-6 ${presentation.mediaBackgroundClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={`status-chip ${presentation.accentBorderClass}`}>
            {game.shortName}
          </span>
          <h2 className="font-display mt-5 text-4xl leading-tight text-white">
            {game.name}
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/12 bg-[#141312]/68 font-caps text-sm uppercase text-white">
          {game.icon}
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="glass-panel-soft p-4">
          <p className="font-caps text-[10px] uppercase text-white/42">
            Room size
          </p>
          <p className="mt-2 text-2xl text-white">{game.maxPlayers} players</p>
        </div>
        <div className="glass-panel-soft p-4">
          <p className="font-caps text-[10px] uppercase text-white/42">
            Rank tiers
          </p>
          <p className="mt-2 text-2xl text-white">{game.ranks.length}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {sampleRanks.map((rank) => (
          <span className="status-chip" key={rank}>
            {formatRank(rank)}
          </span>
        ))}
      </div>

      <div className="mt-8">
        <Link className="button-primary" to={`/browse?game=${game.id}`}>
          Browse rooms
        </Link>
      </div>
    </article>
  );
}

export function GameHubPage() {
  const { games, error } = useGames();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="eyebrow">Games</p>
          <h1 className="font-display mt-4 max-w-3xl text-5xl leading-none text-white sm:text-6xl">
            Choose the queue, then find the squad.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/64">
            QueueUp keeps launch games simple: each game has a player cap and a
            rank ladder the lobby filters can understand.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-primary" to="/browse">
              Find squad
            </Link>
            <Link className="button-secondary" to="/create">
              Create lobby
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0f0e0d] shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
          <div className="relative aspect-[16/10] min-h-[300px]">
            <img
              alt="QueueUp launch games artwork"
              className="h-full w-full object-cover object-center"
              src={queueupIcon}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141312] via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {error ? (
        <StatusBanner
          tone="info"
          title="Using local lineup"
          message="The API game list is unavailable, so local launch-game defaults are shown."
        />
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        {games.map((game) => (
          <GameCard game={game} key={game.id} />
        ))}
      </section>
    </div>
  );
}
