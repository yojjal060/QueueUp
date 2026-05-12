import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="glass-panel p-8 text-center">
        <p className="eyebrow">404</p>
        <h1 className="font-display mt-4 text-5xl text-white">Lost the lobby trail</h1>
        <p className="mt-4 text-white/68">
          The page you asked for does not exist in this build. The browse feed is
          still a good place to recover momentum.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="button-primary" to="/browse">
            Browse lobbies
          </Link>
          <Link className="button-secondary" to="/">
            Back home
          </Link>
        </div>
      </section>
    </div>
  );
}
