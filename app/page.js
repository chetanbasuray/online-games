"use client";
import { motion } from "framer-motion";
import { GAMES } from "./data/games";
import FloatingBubbles from "./components/FloatingBubbles";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 flex flex-col items-center justify-center overflow-hidden">
      {/* Background bubbles */}
      <FloatingBubbles count={15} area="full" zIndex={0} />

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-6xl sm:text-7xl font-bold text-white mb-6 text-center z-10"
      >
        Play Popular Games Online
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="text-xl sm:text-2xl text-white/80 mb-12 text-center max-w-xl z-10"
      >
        Wordle, Sudoku, and more – directly in your browser. Fun, fast, and free!
      </motion.p>

      {/* Subtle bubbles behind buttons */}
      <FloatingBubbles count={6} area="button" zIndex={0} />

      {/* Game buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="flex gap-6 flex-wrap justify-center relative z-10"
      >
        {GAMES.map((game) => (
          <a
            key={game.path}
            href={game.comingSoon ? "#" : game.path}
            className="px-6 py-3 bg-white text-purple-700 font-bold rounded-lg shadow-lg hover:scale-110 transition-transform relative z-10"
            title={game.comingSoon ? "Coming Soon" : game.name}
          >
            {game.name} {game.comingSoon && "🚧"}
          </a>
        ))}
      </motion.div>
    </div>
  );
}
