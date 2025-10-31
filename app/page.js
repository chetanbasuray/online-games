import Link from "next/link";

import { GAMES } from "./data/games";
import SupportWidget from "./components/SupportWidget";
import { hasPlayableGame } from "./utils/gameAvailability";

export default function HomePage() {
  const showSupportWidget = hasPlayableGame();

  return (
    <div className="min-h-screen px-4 py-10 text-slate-900">
      {showSupportWidget && <SupportWidget />}

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12">
        <div className="w-full max-w-3xl space-y-4 text-center">
          <span className="inline-flex rounded-full border border-slate-200/80 bg-gradient-to-r from-blue-100/80 via-white to-rose-100/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm">
            Play instantly, no installs
          </span>
          <h1 className="bg-gradient-to-r from-slate-900 via-blue-700 to-rose-700 bg-clip-text text-4xl font-semibold text-transparent sm:text-5xl">
            Classic games with the familiar look you love
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">
            Settle into timeless puzzles and arcade staples presented in a clean, comfortable layout. Every game now feels like the versions you know best.
          </p>
        </div>

        <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => {
            const isDisabled = !game.isPlayable;
            const cardClasses = [
              "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-sky-50 to-rose-50 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition",
              isDisabled
                ? "cursor-not-allowed opacity-70"
                : "hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_24px_55px_rgba(15,23,42,0.12)]",
            ]
              .filter(Boolean)
              .join(" ");

            const cardContent = (
              <>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-900">{game.name}</h2>
                      {game.badge && (
                        <span className="rounded-full bg-gradient-to-r from-blue-100 to-blue-200 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-blue-800 shadow-sm">
                          {game.badge}
                        </span>
                      )}
                    </div>
                    {!isDisabled && (
                      <span className="inline-flex rounded-full border border-transparent bg-gradient-to-r from-blue-100 via-sky-100 to-emerald-100 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-blue-800 shadow-sm transition group-hover:brightness-110">
                        Play
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    {game.description ?? "Sharpen your mind with a quick play session."}
                  </p>
                </div>
                {isDisabled && (
                  <span className="mt-6 inline-flex rounded-full border border-transparent bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-amber-700 shadow-sm">
                    Coming Soon
                  </span>
                )}
              </>
            );

            if (isDisabled) {
              return (
                <div
                  key={game.path}
                  className={cardClasses}
                  aria-disabled="true"
                  role="group"
                >
                  {cardContent}
                </div>
              );
            }

            return (
              <Link key={game.path} href={game.path} className={cardClasses}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
