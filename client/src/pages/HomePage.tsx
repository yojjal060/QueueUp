import { startTransition, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import queueupIcon from "../assets/queueup-hero-icon.png";
import { SessionPanel } from "../components/SessionPanel";
import { useGames } from "../hooks/useGames";
import { getGamePresentation } from "../utils/presentation";

const protocolHighlights = [
  "Rank-aware rooms keep late joins aligned with the squad's actual target bracket.",
  "Private codes stay clean for friend stacks, while public rooms stay discoverable.",
  "Guest callsigns keep the flow light so the squad forms before the mood disappears.",
];

const deploymentSteps = [
  "Scout open lobbies across the live feed.",
  "Inspect the roster before you commit your slot.",
  "Spin up your own room when the right squad does not exist yet.",
];

export function HomePage() {
  const navigate = useNavigate();
  const { games } = useGames();
  const [joinCode, setJoinCode] = useState("");
  const featuredGame = games[0];
  const secondaryGame = games[1] ?? featuredGame;
  const featuredPresentation = getGamePresentation(featuredGame?.id);
  const launchLineup = games.slice(0, 3);

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
    <div className="space-y-8">
      <section className="grid gap-8 xl:grid-cols-[0.94fr_1.06fr] xl:items-center">
        <div className="space-y-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <img
                alt=""
                className="h-12 w-12 rounded-[14px] border border-white/10 object-cover shadow-[0_0_24px_rgba(255,181,159,0.16)]"
                src={queueupIcon}
              />
              <p className="eyebrow">Premium squadfinding protocol</p>
            </div>
            <h1 className="font-display max-w-4xl text-5xl leading-[0.95] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              Never Queue
              <span className="mt-2 block italic text-[#ffb59f]">
                Alone Again.
              </span>
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/68">
              QueueUp is built for solo players and half-filled stacks who want a
              faster handoff from "need one more" to "launch the room now." Browse
              live lobbies, share clean invite codes, and keep rank expectations
              visible before anyone commits a slot.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="button-primary" to="/browse">
              Find Squad
            </Link>
            <Link className="button-secondary" to="/create">
              Create Lobby
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {protocolHighlights.map((highlight) => (
              <div key={highlight} className="glass-panel-soft p-5">
                <p className="text-sm leading-6 text-white/72">{highlight}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`hero-shell relative min-h-[560px] p-6 sm:p-8 ${featuredPresentation.heroBackgroundClass}`}
        >
          <img
            alt=""
            className="pointer-events-none absolute left-1/2 top-14 z-[1] hidden h-44 w-44 -translate-x-1/2 rounded-[34px] border border-white/10 object-cover opacity-[0.35] shadow-[0_26px_90px_rgba(0,0,0,0.4)] sm:block"
            src={queueupIcon}
          />
          <div className="absolute inset-x-[15%] top-16 h-[72%] rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_56%_24%,rgba(158,232,232,0.34),transparent_16%),radial-gradient(circle_at_78%_56%,rgba(255,104,48,0.22),transparent_22%),linear-gradient(155deg,rgba(6,13,16,0.95),rgba(11,20,26,0.86)_40%,rgba(32,18,13,0.92))] shadow-[0_30px_90px_rgba(0,0,0,0.45)]" />
          <div className="absolute inset-x-[24%] top-28 h-[54%] rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_58%_32%,rgba(158,232,232,0.22),transparent_18%),radial-gradient(circle_at_72%_54%,rgba(255,181,159,0.16),transparent_18%),linear-gradient(145deg,rgba(14,22,28,0.92),rgba(16,13,12,0.82)_58%,rgba(31,18,15,0.92))]" />

          <div className="absolute right-6 top-10 max-w-[228px] rounded-[22px] border border-white/14 bg-[rgba(29,27,26,0.88)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <p className="font-caps text-[11px] uppercase tracking-[0.28em] text-[#ffb59f]">
              [LFM] Support
            </p>
            <p className="mt-3 text-lg font-semibold text-white">
              Need one more for tonight&apos;s ranked push.
            </p>
            <p className="mt-2 text-sm leading-6 text-white/62">
              Shared code. Fast comms. Rank expectations already posted.
            </p>
          </div>

          <div className="absolute bottom-8 left-0 w-full px-4 sm:px-6">
            <div className="mx-auto max-w-[320px] rounded-[26px] border border-white/14 bg-[rgba(33,31,30,0.92)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:mx-0">
              <div className="flex items-center justify-between gap-3">
                <span className="status-chip border-[#9ee8e8]/18 bg-[#0f3b3b]/24 text-[#d9fffe]">
                  Live Lobby
                </span>
                <span className="font-caps text-[11px] uppercase tracking-[0.22em] text-white/42">
                  3/4 Slots
                </span>
              </div>
              <h2 className="font-display mt-5 text-3xl leading-none text-white">
                Ranked Push -
                <span className="mt-1 block">Diamond+</span>
              </h2>
              <div className="mt-5 flex items-center gap-2">
                {["GP", "NX", "SV"].map((member) => (
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#141312] bg-[#2b2a28] font-caps text-[11px] uppercase tracking-[0.18em] text-white"
                    key={member}
                  >
                    {member}
                  </div>
                ))}
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-white/25 bg-transparent font-caps text-[11px] uppercase tracking-[0.18em] text-white/62">
                  +1
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-9 right-6 hidden max-w-[220px] rounded-[24px] border border-white/10 bg-[rgba(20,19,18,0.74)] p-5 backdrop-blur-xl sm:block">
            <p className="eyebrow text-[#9ee8e8]">
              {secondaryGame?.name ?? "Protocol feed"}
            </p>
            <p className="mt-3 text-sm leading-6 text-white/66">
              Shared briefs, visible ranks, and just enough structure to keep the
              room moving.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="glass-panel p-6 sm:p-7">
          <p className="eyebrow">Join by code</p>
          <h2 className="font-display mt-3 max-w-2xl text-4xl leading-tight text-white">
            Private squad handoff. No browse feed required.
          </h2>
          <p className="mt-3 max-w-xl text-white/66">
            If your host already has the room ready, drop the six-character code
            here and jump straight into the live room before you take a seat.
          </p>

          <form className="mt-8 flex flex-col gap-4 sm:flex-row" onSubmit={handleJoinSubmit}>
            <input
              className="input-shell flex-1 uppercase tracking-[0.3em]"
              maxLength={6}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="PUBG01"
              value={joinCode}
            />
            <button className="button-primary sm:min-w-48" type="submit">
              Open Lobby
            </button>
          </form>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {deploymentSteps.map((step, index) => (
              <div key={step} className="glass-panel-soft p-5">
                <p className="font-caps text-[11px] uppercase tracking-[0.28em] text-[#ffb59f]">
                  0{index + 1}
                </p>
                <p className="mt-3 text-sm leading-6 text-white/72">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <SessionPanel
          title="Launch your callsign before the squad does"
          description="QueueUp keeps identity lightweight. Create a callsign once, then use it to host, inspect, and join lobbies without a heavy sign-in ritual."
        />
      </section>

      <section className="glass-panel p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Launch lineup</p>
            <h2 className="font-display mt-3 text-4xl text-white">
              Built for live operations, not dead-end queues.
            </h2>
          </div>
          <button className="button-secondary" onClick={() => navigate("/browse")} type="button">
            Browse Live Lobbies
          </button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-panel-soft p-6">
            <p className="eyebrow">What ships now</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
                <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-[#9ee8e8]">
                  Live browse
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Public lobby scouting with slot awareness and rank filtering.
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
                <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-[#ffb59f]">
                  Squad codes
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Direct code entry for invite-first rooms and private stacks.
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
                <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-[#9ee8e8]">
                  Host controls
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Create a room, declare the rank floor, and shape the roster from
                  minute one.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {launchLineup.map((game) => {
              const presentation = getGamePresentation(game.id);

              return (
                <article
                  className={`glass-panel scan-surface overflow-hidden p-5 ${presentation.mediaBackgroundClass}`}
                  key={game.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`status-chip ${presentation.accentBorderClass}`}>
                      {presentation.shortLabel}
                    </span>
                    <span className="text-2xl">{game.icon}</span>
                  </div>
                  <h3 className="font-display mt-14 text-3xl leading-none text-white">
                    {game.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/68">
                    Up to {game.maxPlayers} players per room with{" "}
                    {game.ranks.length} supported rank checkpoints at launch.
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
