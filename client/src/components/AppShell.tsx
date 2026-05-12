import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import queueupIcon from "../assets/queueup-hero-icon.png";
import { useSession } from "../context/useSession";

const navigationLinks = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Lobbies" },
  { to: "/games", label: "Games" },
  { to: "/create", label: "Create" },
  { to: "/join", label: "Join" },
];

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isHydrating, clearSession } = useSession();
  const isHome = location.pathname === "/";

  return (
    <div className="relative min-h-screen overflow-x-hidden text-[#fff6ee]">
      <div className="relative mx-auto max-w-[1320px] px-4 pb-10 pt-4 sm:px-6 lg:px-10">
        <header className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-[1180px] -translate-x-1/2 rounded-[18px] border border-white/8 bg-[rgba(20,19,18,0.9)] px-4 py-3 shadow-[0_14px_42px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:w-[calc(100%-3rem)] sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <NavLink
              className="flex shrink-0 items-center gap-3 font-display text-2xl font-bold italic text-[#ffb59f]"
              to="/"
            >
              <img
                alt=""
                className="h-9 w-9 rounded-[10px] border border-white/10 object-cover shadow-[0_0_22px_rgba(255,181,159,0.16)]"
                src={queueupIcon}
              />
              <span>QueueUp</span>
            </NavLink>

            <nav className="hidden items-center gap-1 md:flex">
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

            <div className="flex shrink-0 items-center gap-2">
              {isHydrating ? (
                <span className="status-chip">restoring</span>
              ) : session ? (
                <>
                  <div className="hidden items-center gap-3 rounded-[14px] border border-white/8 bg-white/4 px-3 py-2 sm:flex">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#ffb59f]/24 bg-[#2b2a28] font-caps text-[11px] uppercase text-[#ffb59f]">
                      {session.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-caps text-[10px] uppercase text-white/42">
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
                  Callsign
                </button>
              )}
            </div>
          </div>
        </header>

        <div className={isHome ? "pt-24 xl:pt-28" : "pt-28 xl:pt-32"}>
          <main>
            <Outlet />
          </main>

          <footer className="mt-16 border-t border-white/8 pt-8 text-sm text-white/46">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="font-display text-2xl font-bold italic text-[#ffb59f]">
                QueueUp
              </p>
              <div className="flex flex-wrap gap-5 font-caps text-[11px] uppercase text-white/42">
                <span>Privacy</span>
                <span>Terms</span>
                <span>Status</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
