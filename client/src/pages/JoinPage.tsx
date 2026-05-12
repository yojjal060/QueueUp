import { startTransition, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { SessionPanel } from "../components/SessionPanel";
import { useGames } from "../hooks/useGames";
import { getGamePresentation } from "../utils/presentation";

export function JoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { games } = useGames();
  const [code, setCode] = useState(searchParams.get("code")?.toUpperCase() ?? "");
  const highlightedGames = games.slice(0, 3);
  const leadPresentation = getGamePresentation(highlightedGames[0]?.id);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return;
    }

    startTransition(() => {
      navigate(`/lobby/${cleanCode}`);
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <section className="glass-panel p-6 sm:p-8">
          <p className="eyebrow">Private ingress</p>
          <h1 className="font-display mt-3 max-w-3xl text-5xl leading-[0.95] tracking-[-0.05em] text-white">
            Enter the code. Read the room. Then take the slot.
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-white/66">
            Hosts can share a six-character lobby code for friend stacks, late-night
            ranked pushes, and invite-only squads. We&apos;ll take you straight to the
            preview dossier so you can inspect the roster before you commit.
          </p>

          <form className="mt-8 flex flex-col gap-4 sm:flex-row" onSubmit={handleSubmit}>
            <input
              className="input-shell flex-1 uppercase tracking-[0.3em]"
              maxLength={6}
              onChange={(event) => setCode(event.target.value)}
              placeholder="MRVL01"
              value={code}
            />
            <button className="button-primary sm:min-w-48" type="submit">
              Open Preview
            </button>
          </form>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Inspect the full roster and host before joining.",
              "See the minimum rank gate before you burn the invite.",
              "Move into the live room once the squad fit looks right.",
            ].map((step, index) => (
              <div className="glass-panel-soft p-5" key={step}>
                <p className="font-caps text-[11px] uppercase tracking-[0.28em] text-[#ffb59f]">
                  0{index + 1}
                </p>
                <p className="mt-3 text-sm leading-6 text-white/72">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="status-chip border-[#ffb59f]/20 bg-[#802a0d]/16 text-[#fff6ee]">
              Private invites supported
            </span>
            <span className="status-chip border-[#9ee8e8]/18 bg-[#0f3b3b]/22 text-[#d9fffe]">
              Rank filter preview
            </span>
            <Link className="button-secondary" to="/browse">
              Explore public lobbies
            </Link>
          </div>
        </section>

        <div className="space-y-6">
          <article
            className={`hero-shell relative min-h-[340px] overflow-hidden p-6 ${leadPresentation.heroBackgroundClass}`}
          >
            <div className="absolute inset-x-[12%] top-12 h-[48%] rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_32%_28%,rgba(158,232,232,0.22),transparent_18%),radial-gradient(circle_at_78%_58%,rgba(255,181,159,0.18),transparent_24%),linear-gradient(160deg,rgba(7,16,20,0.94),rgba(14,12,12,0.82)_44%,rgba(31,18,14,0.92))]" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <p className="eyebrow text-[#9ee8e8]">Supported theaters</p>
                <h2 className="font-display mt-3 text-4xl leading-none text-white">
                  Any code opens the same clean dossier flow.
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {highlightedGames.map((game) => (
                  <div className="glass-panel-soft p-4" key={game.id}>
                    <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-[#ffb59f]">
                      {game.shortName}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/68">
                      Up to {game.maxPlayers} players with the room code acting as
                      the direct handoff.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <SessionPanel
            compact
            title="Optional now, useful before you join"
            description="You can inspect any room first. Creating a callsign now just makes the final join handoff faster once the squad looks right."
          />
        </div>
      </div>
    </div>
  );
}
