import { startTransition, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import queueupIcon from "../assets/queueup-hero-icon.png";
import { SessionPanel } from "../components/SessionPanel";

export function JoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code")?.toUpperCase() ?? "");

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
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <section className="glass-panel p-6 sm:p-8">
        <p className="eyebrow">Join by code</p>
        <h1 className="font-display mt-4 max-w-2xl text-5xl leading-none text-white sm:text-6xl">
          Open the room before you take the slot.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-white/66">
          Paste a six-character lobby code to inspect the host, roster, rank floor,
          and chat context.
        </p>

        <form className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
          <input
            className="input-shell uppercase"
            maxLength={6}
            onChange={(event) => setCode(event.target.value)}
            placeholder="MRVL01"
            value={code}
          />
          <button className="button-primary sm:min-w-44" type="submit">
            Open room
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="button-secondary" to="/browse">
            Browse public rooms
          </Link>
          <Link className="button-secondary" to="/create">
            Create lobby
          </Link>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0f0e0d] shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
          <div className="relative aspect-[4/3] min-h-[320px]">
            <img
              alt="QueueUp squad artwork"
              className="h-full w-full object-cover object-center"
              src={queueupIcon}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141312] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-[18px] border border-white/12 bg-[rgba(20,19,18,0.84)] p-4 backdrop-blur-xl">
              <p className="font-caps text-[11px] uppercase text-[#ffb59f]">
                Room preview
              </p>
              <p className="mt-2 text-sm leading-6 text-white/68">
                Join stays one click away after you verify the squad fit.
              </p>
            </div>
          </div>
        </div>

        <SessionPanel
          compact
          title="Need a callsign?"
          description="Create one once, then use it for every room you inspect or join."
        />
      </aside>
    </div>
  );
}
