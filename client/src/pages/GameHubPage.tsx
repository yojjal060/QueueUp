import { Link } from "react-router";
import queueupIcon from "../assets/queueup-hero-icon.png";
import { StatusBanner } from "../components/StatusBanner";
import { useGames } from "../hooks/useGames";
import type { GameConfig } from "../types/api";
import { formatRank } from "../utils/formatters";
import { getGamePresentation } from "../utils/presentation";

interface GameSpotlight {
  headline: string;
  description: string;
  mood: string;
  squadNeed: string;
  activity: string;
  community: string;
}

const spotlights: Record<string, GameSpotlight> = {
  PUBG_MOBILE: {
    headline: "Tactical drops with clean rank gates.",
    description:
      "Build four-player rooms for Erangel pushes, late-night scrims, and code-first friend stacks without burying the join requirement.",
    mood: "Measured",
    squadNeed: "IGL or support fragger",
    activity: "Ranked classic",
    community: "Squads are usually looking for comms, role discipline, and a rank floor before the first drop.",
  },
  MARVEL_RIVALS: {
    headline: "Hero comps, six-player synergy, instant squad reads.",
    description:
      "Coordinate 6v6 hero roles, publish the rank target, and let players inspect the roster before they commit to the next match.",
    mood: "Electric",
    squadNeed: "Support or flex",
    activity: "Competitive queue",
    community: "Most rooms are hunting for role balance, fast voice checks, and a clear climb target.",
  },
};

const fallbackSpotlight: GameSpotlight = {
  headline: "A launch game ready for squadfinding.",
  description:
    "QueueUp keeps the game, player cap, rank floor, and entry route visible before anyone takes a slot.",
  mood: "Live",
  squadNeed: "Flexible teammate",
  activity: "Public lobbies",
  community: "Players can browse first, inspect the room, then join with the right rank context.",
};

const featuredSquads = [
  {
    gameId: "MARVEL_RIVALS",
    title: "Phoenix Protocol",
    rank: "DIAMOND_I",
    members: "5/6",
    role: "DPS",
  },
  {
    gameId: "PUBG_MOBILE",
    title: "Erangel Vanguard",
    rank: "ACE",
    members: "3/4",
    role: "IGL",
  },
  {
    gameId: "MARVEL_RIVALS",
    title: "Void Runners",
    rank: "GOLD_III",
    members: "4/6",
    role: "Support",
  },
];

function getSpotlight(gameId: string) {
  return spotlights[gameId] ?? fallbackSpotlight;
}

function GameCard({ game }: { game: GameConfig }) {
  const presentation = getGamePresentation(game.id);
  const spotlight = getSpotlight(game.id);
  const midpointRank = game.ranks[Math.max(Math.floor(game.ranks.length * 0.55), 0)];
  const highRank = game.ranks[Math.max(game.ranks.length - 2, 0)];

  return (
    <article
      className={`glass-panel scan-surface overflow-hidden p-5 ${presentation.mediaBackgroundClass}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={`status-chip ${presentation.accentBorderClass}`}>
            {game.shortName}
          </span>
          <h2 className="font-display mt-5 text-4xl leading-none text-white">
            {game.name}
          </h2>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-white/12 bg-[#141312]/68 font-caps text-sm uppercase tracking-[0.22em] text-white shadow-[0_12px_34px_rgba(0,0,0,0.32)]">
          {game.icon}
        </div>
      </div>

      <p className="mt-5 max-w-2xl text-sm leading-7 text-white/68">
        {spotlight.description}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="glass-panel-soft p-4">
          <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
            Players
          </p>
          <p className="mt-2 text-2xl text-white">{game.maxPlayers}</p>
        </div>
        <div className="glass-panel-soft p-4">
          <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
            Rank span
          </p>
          <p className="mt-2 text-lg text-white">{game.ranks.length} tiers</p>
        </div>
        <div className="glass-panel-soft p-4">
          <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
            Hot floor
          </p>
          <p className="mt-2 text-lg text-white">{formatRank(midpointRank)}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="status-chip border-[#9ee8e8]/18 bg-[#0f3b3b]/22 text-[#d9fffe]">
            {spotlight.activity}
          </span>
          <span className="status-chip">Peak: {formatRank(highRank)}</span>
        </div>
        <Link className="button-primary" to={`/browse?game=${game.id}`}>
          Browse rooms
        </Link>
      </div>
    </article>
  );
}

export function GameHubPage() {
  const { games, error } = useGames();
  const heroGame =
    games.find((game) => game.id === "MARVEL_RIVALS") ?? games[0] ?? null;
  const heroPresentation = getGamePresentation(heroGame?.id);
  const heroSpotlight = heroGame ? getSpotlight(heroGame.id) : fallbackSpotlight;

  return (
    <div className="space-y-6">
      <section
        className={`hero-shell relative min-h-[480px] overflow-hidden p-6 sm:p-8 ${heroPresentation.heroBackgroundClass}`}
      >
        <div className="relative z-10 flex min-h-[420px] flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow">Launch game hubs</p>
            <h1 className="font-display mt-4 text-5xl leading-[0.95] tracking-[-0.05em] text-white sm:text-6xl">
              Pick the game before you pick the squad.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">
              The design system&apos;s game-hub idea is now part of the real app:
              supported games, rank ladders, player caps, and direct browse paths
              all live here.
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

          <div className="w-full max-w-[390px] rounded-[24px] border border-white/12 bg-[rgba(20,19,18,0.78)] p-5 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <img
                alt=""
                className="h-16 w-16 rounded-[18px] border border-white/10 object-cover"
                src={queueupIcon}
              />
              <div>
                <span className={`status-chip ${heroPresentation.accentBorderClass}`}>
                  {heroGame?.shortName ?? "QueueUp"}
                </span>
                <h2 className="font-display mt-4 text-3xl leading-none text-white">
                  {heroGame?.name ?? "QueueUp"}
                </h2>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/66">
              {heroSpotlight.headline} {heroSpotlight.community}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Mood
                </p>
                <p className="mt-2 text-lg text-white">{heroSpotlight.mood}</p>
              </div>
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Need
                </p>
                <p className="mt-2 text-lg text-white">{heroSpotlight.squadNeed}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <StatusBanner
          tone="info"
          title="Using local lineup"
          message="The API game list is unavailable, so the client is showing the launch-game defaults from the design epic."
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        {games.map((game) => (
          <GameCard game={game} key={game.id} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="glass-panel p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Featured squad patterns</p>
              <h2 className="font-display mt-3 text-4xl text-white">
                The useful part of the hub, trimmed to v1.
              </h2>
            </div>
            <Link className="button-secondary" to="/browse">
              View all
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {featuredSquads.map((squad) => {
              const presentation = getGamePresentation(squad.gameId);

              return (
                <Link
                  className="glass-panel-soft scan-surface flex flex-col gap-4 px-4 py-4 transition sm:flex-row sm:items-center sm:justify-between"
                  key={`${squad.gameId}-${squad.title}`}
                  to={`/browse?game=${squad.gameId}`}
                >
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`status-chip ${presentation.accentBorderClass}`}>
                        {presentation.shortLabel}
                      </span>
                      <span className="status-chip">[LFM] {squad.role}</span>
                    </div>
                    <h3 className="font-display mt-3 text-2xl text-white">
                      {squad.title}
                    </h3>
                    <p className="mt-1 text-sm text-white/58">
                      Rank floor {formatRank(squad.rank)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                      Members
                    </p>
                    <p className="mt-1 text-xl text-white">{squad.members}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="glass-panel p-6">
          <p className="eyebrow">Rank ladder preview</p>
          <h2 className="font-display mt-3 text-4xl text-white">
            Filters stay readable before the join.
          </h2>
          <div className="mt-6 space-y-4">
            {games.map((game) => {
              const sampledRanks = [
                game.ranks[0],
                game.ranks[Math.floor(game.ranks.length / 2)],
                game.ranks[game.ranks.length - 1],
              ].filter(Boolean);

              return (
                <div className="glass-panel-soft p-4" key={game.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-[#ffb59f]">
                      {game.name}
                    </p>
                    <span className="text-sm text-white/50">
                      {game.ranks.length} tiers
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sampledRanks.map((rank) => (
                      <span className="status-chip" key={rank}>
                        {formatRank(rank)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </section>
    </div>
  );
}
