import { startTransition, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import queueupIcon from "../assets/queueup-hero-icon.png";
import { SessionPanel } from "../components/SessionPanel";
import { useGames } from "../hooks/useGames";

const steps = [
  {
    title: "Browse",
    body: "Scan active rooms by game, slots, and rank floor before you commit.",
  },
  {
    title: "Inspect",
    body: "Open the lobby first so the host, roster, and chat context are clear.",
  },
  {
    title: "Queue",
    body: "Join with a callsign and keep the room synced in real time.",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { games } = useGames();
  const [joinCode, setJoinCode] = useState("");

  function handleJoinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      return;
    }

    startTransition(() => {
      navigate(`/join?code=${encodeURIComponent(cleanCode)}`);
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-16">
      <section className="grid min-h-[calc(100vh-190px)] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="max-w-2xl">
          <p className="eyebrow">Real-time squadfinding</p>
          <h1 className="font-display mt-5 text-5xl leading-none text-white sm:text-6xl lg:text-7xl">
            Never queue
            <span className="block italic text-[#ffb59f]">alone again.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/68">
            Find an active lobby, inspect the roster, and join with the right rank
            context before the match energy drops.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-primary" to="/browse">
              Find squad
            </Link>
            <Link className="button-secondary" to="/create">
              Create lobby
            </Link>
          </div>

          <form
            className="mt-8 grid max-w-xl gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[1fr_auto]"
            onSubmit={handleJoinSubmit}
          >
            <label className="block">
              <span className="sr-only">Lobby code</span>
              <input
                className="input-shell uppercase"
                maxLength={6}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="Enter code"
                value={joinCode}
              />
            </label>
            <button className="button-secondary" type="submit">
              Open room
            </button>
          </form>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0f0e0d] shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <div className="relative aspect-[4/3] min-h-[360px]">
              <img
                alt="Three armored teammates in a cinematic QueueUp squad scene"
                className="h-full w-full object-cover object-center"
                src={queueupIcon}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141312] via-[#141312]/22 to-transparent" />
            </div>
          </div>

          <div className="absolute -bottom-6 left-4 right-4 rounded-[18px] border border-white/12 bg-[rgba(20,19,18,0.9)] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:left-8 sm:max-w-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="status-chip border-[#9ee8e8]/18 bg-[#0f3b3b]/24 text-[#d9fffe]">
                Live lobby
              </span>
              <span className="font-caps text-[11px] uppercase text-white/45">
                3/4 slots
              </span>
            </div>
            <h2 className="font-display mt-4 text-3xl leading-tight text-white">
              Ranked Push - Diamond+
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/64">
              Host posted the rank floor. One seat is open.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {steps.map((step) => (
          <article className="glass-panel-soft p-5" key={step.title}>
            <p className="font-caps text-[11px] uppercase text-[#ffb59f]">
              {step.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-white/68">{step.body}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SessionPanel
          title="Pick a callsign"
          description="No account wall. A callsign is enough to host, join, and appear in lobby chat."
        />

        <div className="glass-panel p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Launch games</p>
              <h2 className="font-display mt-3 text-3xl text-white">
                Start with the right queue.
              </h2>
            </div>
            <Link className="button-secondary" to="/games">
              View games
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {games.slice(0, 2).map((game) => (
              <Link
                className="glass-panel-soft scan-surface p-5 transition hover:border-[#ffb59f]/32"
                key={game.id}
                to={`/browse?game=${game.id}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-2xl text-white">{game.name}</p>
                  <span className="status-chip">{game.maxPlayers} max</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  {game.ranks.length} rank tiers available for lobby filters.
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
