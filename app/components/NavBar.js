"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GAMES } from "../data/games";

const baseLinkClasses =
  "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.35em] transition-colors";
const inactiveLinkClasses =
  "border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600";
const activeLinkClasses = "border-blue-500 bg-blue-50 text-blue-700";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="flex items-center gap-3"
          title="Online Games home"
        >
          <Image
            src="/online-games-logo.svg"
            alt="Online Games logo"
            width={40}
            height={40}
            priority
            className="h-10 w-10"
          />
          <span className="text-base font-semibold uppercase tracking-[0.3em] text-slate-700">
            Online Games
          </span>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className={`${baseLinkClasses} ${
              pathname === "/" ? activeLinkClasses : inactiveLinkClasses
            }`}
          >
            Home
          </Link>

          {GAMES.map((game) => {
            const isActive = pathname === game.path;
            const isDisabled = !game.isPlayable;

            const classes = [
              baseLinkClasses,
              isActive ? activeLinkClasses : inactiveLinkClasses,
              isDisabled ? "cursor-not-allowed opacity-60" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <Link
                key={game.path}
                href={isDisabled ? "#" : game.path}
                className={classes}
                aria-disabled={isDisabled}
                tabIndex={isDisabled ? -1 : undefined}
                onClick={isDisabled ? (event) => event.preventDefault() : undefined}
              >
                <span>{game.name}</span>
                {game.badge && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[0.55rem] font-semibold tracking-[0.25em] text-blue-700">
                    {game.badge}
                  </span>
                )}
                {isDisabled && "🚧"}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
