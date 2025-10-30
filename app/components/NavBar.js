"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GAMES } from "../data/games";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="cosmic-toolbar sticky top-0 z-30 flex flex-col items-center gap-4 px-6 py-4 text-white shadow-lg shadow-sky-900/30 md:flex-row md:justify-between">
      <Link
        href="/"
        className="group flex items-center gap-3 rounded-full border border-sky-500/40 bg-slate-950/40 px-4 py-2 transition hover:border-sky-300/70 hover:bg-slate-950/70"
        title="Online Games home"
      >
        <Image
          src="/online-games-logo.svg"
          alt="Online Games logo"
          width={40}
          height={40}
          priority
          className="h-10 w-10 drop-shadow-[0_0_8px_rgba(56,189,248,0.45)]"
        />
        <span className="text-base font-bold uppercase tracking-[0.35em] text-sky-100 transition group-hover:text-white">
          Online Games
        </span>
      </Link>

      <div className="flex flex-wrap items-center justify-center gap-3">
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
      </div>
    </nav>
  );
}
