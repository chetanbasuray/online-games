"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GAMES } from "../data/games";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-3 border-b border-white/10 bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-blue-900/60 px-6 py-4 backdrop-blur-xl shadow-lg shadow-purple-900/20">
      <Link
        href="/"
        className={`aurora-pill px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white transition ${
          pathname === "/" ? "bg-white/20" : ""
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
            className={`aurora-pill px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white transition ${
              isActive ? "bg-white/20" : ""
            } ${game.comingSoon ? "cursor-not-allowed opacity-60" : ""}`}
            title={game.comingSoon ? "Coming Soon" : game.name}
          >
            {game.name} {game.comingSoon && "🚧"}
          </Link>
        );
      })}
    </nav>
  );
}
