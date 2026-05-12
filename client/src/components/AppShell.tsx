import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import queueupIcon from "../assets/queueup-hero-icon.png";
import { useSession } from "../context/useSession";
import { useGames } from "../hooks/useGames";

const navigationLinks = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Lobbies" },
  { to: "/games", label: "Games" },
  { to: "/create", label: "Create" },
  { to: "/join", label: "Join" },
];

const sideLinks = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Squads" },
  { to: "/games", label: "Games" },
  { to: "/create", label: "New Squad" },
  { to: "/join", label: "Join by Code" },
];

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { games } = useGames();
  const { session, isHydrating, clearSession } = useSession();
  const isHome = location.pathname === "/";
  const showSideRail = !isHome;

  return (
    <div className="relative min-h-screen overflow-x-hidden text-[#fff6ee]">
      <div className="relative mx-auto max-w-[1560px] px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <header className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 rounded-full border border-white/8 bg-[rgba(20,19,18,0.82)] px-6 py-4 shadow-[0_14px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:w-[calc(100%-3rem)]">
          <div className="flex items-center justify-between gap-4">
            <NavLink
              className="flex items-center gap-3 font-display text-3xl font-bold italic tracking-tight text-[#ffb59f]"
              to="/"
            >
              <img
                alt=""
                className="h-9 w-9 rounded-[12px] border border-white/10 object-cover shadow-[0_0_22px_rgba(255,181,159,0.16)]"
                src={queueupIcon}
              />
              <span>QueueUp</span>
            </NavLink>

            <nav className="hidden items-center gap-2 md:flex">
              {navigationLinks.map((link) => (
                <NavLink
                  end={link.to === "/"}
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `nav-pill ${isActive ? "nav-pill-active" : ""}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {isHydrating ? (
                <span className="status-chip">restoring</span>
              ) : session ? (
                <>
                  <div className="hidden items-center gap-3 rounded-full border border-white/8 bg-white/4 px-4 py-2 sm:flex">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ffb59f]/24 bg-[#2b2a28] font-caps text-[11px] uppercase tracking-[0.18em] text-[#ffb59f]">
                      {session.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-caps text-[10px] uppercase tracking-[0.26em] text-white/42">
                        Callsign
                      </p>
                      <p className="text-sm font-medium text-white">{session.username}</p>
                    </div>
                  </div>
                  <button className="button-ghost hidden sm:inline-flex" onClick={clearSession} type="button">
                    Reset
                  </button>
                </>
              ) : (
                <button className="button-primary" onClick={() => navigate("/")} type="button">
                  Launch protocol
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="pt-24 xl:pt-28">
          {showSideRail ? (
            <aside className="fixed left-4 top-28 hidden w-[250px] rounded-[30px] border border-white/8 bg-[rgba(29,27,26,0.88)] px-4 py-5 shadow-[0_24px_64px_rgba(0,0,0,0.38)] backdrop-blur-xl xl:block">
              <div className="glass-panel-soft px-4 py-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.28em] text-[#ffb59f]">
                  Commander
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[#ffb59f]/24 bg-[#2b2a28] font-caps text-sm uppercase tracking-[0.2em] text-[#fff6ee]">
                    {session?.username.slice(0, 2).toUpperCase() ?? "QP"}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {session?.username ?? "Protocol offline"}
                    </p>
                    <p className="text-sm text-white/52">
                      {session ? "Callsign ready" : "Create one from Home"}
                    </p>
                  </div>
                </div>
              </div>

              <button className="button-primary mt-5 w-full" onClick={() => navigate("/create")} type="button">
                New Squad
              </button>

              <nav className="mt-6 space-y-1">
                {sideLinks.map((link) => (
                  <NavLink
                    end={link.to === "/"}
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `side-link ${isActive ? "side-link-active" : ""}`
                    }
                  >
                    <span className="h-2 w-2 rounded-full bg-current opacity-75" />
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="mt-8 border-t border-white/8 pt-6">
                <p className="font-caps text-[10px] uppercase tracking-[0.3em] text-white/38">
                  Games Filter
                </p>
                <div className="mt-4 space-y-3">
                  {games.slice(0, 3).map((game, index) => (
                    <div key={game.id} className="flex items-center gap-3 text-sm text-white/70">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          index === 0 ? "bg-[#ffb59f]" : "bg-white/25"
                        }`}
                      />
                      <span>{game.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}

          <main className={`${showSideRail ? "xl:pl-[286px]" : ""}`}>
            <Outlet />
          </main>

          <footer className={`mt-14 border-t border-white/8 pt-8 text-sm text-white/52 ${showSideRail ? "xl:pl-[286px]" : ""}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="font-caps text-[11px] uppercase tracking-[0.28em] text-white/36">
                QueueUp Protocol
              </p>
              <div className="flex flex-wrap gap-6 text-[12px] uppercase tracking-[0.22em] text-white/42">
                <span>Terms</span>
                <span>Privacy</span>
                <span>Status</span>
                <span>Documentation</span>
              </div>
              <p className="font-caps text-[11px] uppercase tracking-[0.24em] text-white/36">
                2026 QueueUp Protocol. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
