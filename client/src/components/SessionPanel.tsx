import { useState, type FormEvent } from "react";
import { useSession } from "../context/useSession";
import { StatusBanner } from "./StatusBanner";

interface SessionPanelProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export function SessionPanel({
  title = "Launch your callsign",
  description = "QueueUp keeps identity light. Pick a clean callsign so you can host and join without a heavy account flow.",
  compact = false,
}: SessionPanelProps) {
  const { session, isHydrating, isCreating, error, createSession, clearSession } =
    useSession();
  const [username, setUsername] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      return;
    }

    try {
      await createSession(cleanUsername);
      setUsername("");
    } catch {
      // surfaced via context
    }
  }

  if (isHydrating) {
    return (
      <div className="glass-panel p-5">
        <p className="eyebrow">Protocol</p>
        <p className="mt-3 text-sm text-white/64">Restoring your active callsign...</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="glass-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Command Link</p>
            <h3 className="font-display mt-3 text-3xl text-white">
              {session.username}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/64">
              Your callsign is active. You can open public squads, publish your own
              room, and step into invite codes when needed.
            </p>
          </div>
          <span className="status-chip border-[#9ee8e8]/20 bg-[#0f3b3b]/22 text-[#d9fffe]">
            live
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="button-ghost" onClick={clearSession} type="button">
            Reset callsign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-panel ${compact ? "p-5" : "p-6"}`}>
      <p className="eyebrow">Callsign Protocol</p>
      <h3 className="font-display mt-3 text-3xl text-white">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-white/66">{description}</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block font-caps text-[11px] uppercase tracking-[0.24em] text-white/54">
            Callsign
          </span>
          <input
            className="input-shell"
            maxLength={20}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Ghost_Protocol"
            value={username}
          />
        </label>

        <button className="button-primary w-full sm:w-auto" disabled={isCreating} type="submit">
          {isCreating ? "Launching..." : "Launch protocol"}
        </button>
      </form>

      {error ? (
        <div className="mt-4">
          <StatusBanner tone="error" title="Protocol blocked" message={error} />
        </div>
      ) : null}
    </div>
  );
}
