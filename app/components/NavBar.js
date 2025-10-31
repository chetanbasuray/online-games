"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GAMES } from "../data/games";

const baseLinkClasses =
  "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.35em] transition-colors shadow-sm";
const inactiveLinkClasses =
  "border-slate-200/80 bg-white/80 text-slate-600 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700";
const activeLinkClasses =
  "border-transparent bg-gradient-to-r from-blue-100 via-rose-100 to-amber-100 text-blue-700 shadow";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-gradient-to-r from-white/95 via-blue-50/70 to-rose-50/70 shadow-sm backdrop-blur">
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
                  <span className="rounded-full bg-gradient-to-r from-blue-100 to-blue-200 px-2 py-0.5 text-[0.55rem] font-semibold tracking-[0.25em] text-blue-800">
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
