"use client";
import { motion } from "framer-motion";
import { GAMES } from "./data/games";
import FloatingBubbles from "./components/FloatingBubbles";
import SupportWidget from "./components/SupportWidget";
import { hasPlayableGame } from "./utils/gameAvailability";

export default function HomePage() {
  const showSupportWidget = hasPlayableGame();

  return (
    <div className="cosmic-page">
      <FloatingBubbles count={9} area="full" zIndex={1} />
      {showSupportWidget && <SupportWidget />}

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex max-w-4xl flex-col items-center gap-6 text-center"
      >
        <span className="cosmic-pill px-5 py-2 text-xs uppercase tracking-[0.4em] text-white/70">
          Play instantly, no installs
        </span>
        <h1 className="cosmic-heading text-5xl font-bold sm:text-6xl">
          Discover Your Next Favorite Puzzle
        </h1>
        <p className="max-w-2xl text-lg text-white/80 sm:text-xl">
          Dive into a constellation of classic games reimagined with a modern, luminous interface. Switch between titles seamlessly and chase new high scores.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1 }}
        className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {GAMES.map((game) => (
          <a
            key={game.path}
            href={game.comingSoon ? "#" : game.path}
            className={`cosmic-card group flex h-full flex-col justify-between ${
              game.comingSoon ? "cursor-not-allowed opacity-70" : "hover:border-white/40"
            }`}
            title={game.comingSoon ? "Coming Soon" : game.name}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold text-white">{game.name}</h2>
                  {game.badge && (
                    <span className="cosmic-pill px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.3em] text-sky-100">
                      {game.badge}
                    </span>
                  )}
                </div>
                <motion.span
                  whileHover={{ rotate: 12 }}
                  className="cosmic-pill px-3 py-1 text-xs uppercase tracking-widest text-white/80"
                >
                  Play
                </motion.span>
              </div>
              <p className="text-sm text-white/60">
                {game.description ?? "Sharpen your mind with a quick play session."}
              </p>
            </div>
            {game.comingSoon && (
              <span className="mt-6 text-xs font-semibold uppercase tracking-widest text-rose-200">
                Coming Soon
              </span>
            )}
          </a>
        ))}
      </motion.div>
    </div>
  );
}
