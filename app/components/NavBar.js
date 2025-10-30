"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GAMES } from "../data/games";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="cosmic-toolbar sticky top-0 z-30 flex flex-wrap items-center justify-center gap-3 px-6 py-4">
      <Link
        href="/"
        className={`cosmic-pill px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white transition ${
          pathname === "/" ? "cosmic-pill--active" : ""
        }`}
      >
        Home
      </Link>

      {GAMES.map((game) => {
        const isActive = pathname === game.path;
        return (
          <Link
            key={game.path}
            href={game.comingSoon ? "#" : game.path}
            className={`cosmic-pill flex items-center gap-2 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white transition ${
              isActive ? "cosmic-pill--active" : ""
            } ${game.comingSoon ? "cursor-not-allowed opacity-60" : ""}`}
            title={game.comingSoon ? "Coming Soon" : game.name}
          >
            <span>{game.name}</span>
            {game.badge && (
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.3em] text-sky-100">
                {game.badge}
              </span>
            )}
            {game.comingSoon && "🚧"}
          </Link>
        );
      })}
    </nav>
  );
}
