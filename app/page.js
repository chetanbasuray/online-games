import Link from "next/link";

import { GAMES } from "./data/games";
import SupportWidget from "./components/SupportWidget";
import { hasPlayableGame } from "./utils/gameAvailability";

export default function HomePage() {
  const showSupportWidget = hasPlayableGame();

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      {showSupportWidget && <SupportWidget />}

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12">
        <div className="w-full max-w-3xl space-y-4 text-center">
          <span className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600">
            Play instantly, no installs
          </span>
          <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
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
              "group flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition",
              isDisabled
                ? "cursor-not-allowed opacity-60"
                : "hover:border-blue-400 hover:shadow-md",
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
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-blue-700">
                          {game.badge}
                        </span>
                      )}
                    </div>
                    {!isDisabled && (
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-blue-700 transition group-hover:border-blue-400 group-hover:text-blue-800">
                        Play
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    {game.description ?? "Sharpen your mind with a quick play session."}
                  </p>
                </div>
                {isDisabled && (
                  <span className="mt-6 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-amber-600">
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
