"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GAMES } from "./data/games";

export default function HomePage() {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    // Create 15 random bubbles
    const bubbleArray = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      size: 4 + Math.random() * 8, // px
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 3 + Math.random() * 5,
      delay: Math.random() * 5,
    }));
    setBubbles(bubbleArray);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 flex flex-col items-center justify-center overflow-hidden">
      {/* Floating bubbles */}
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          className="absolute bg-white rounded-full opacity-30"
          style={{
            width: `${b.size}vmin`,
            height: `${b.size}vmin`,
            top: `${b.top}%`,
            left: `${b.left}%`,
          }}
          animate={{ y: ["0%", "-20%", "0%"], x: ["0%", "5%", "0%"] }}
          transition={{ duration: b.duration, repeat: Infinity, delay: b.delay, ease: "easeInOut" }}
        />
      ))}

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-6xl sm:text-7xl font-bold text-white mb-6 text-center"
      >
        Play Popular Games Online
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="text-xl sm:text-2xl text-white/80 mb-12 text-center max-w-xl"
      >
        Wordle, Sudoku, and more – directly in your browser. Fun, fast, and free!
      </motion.p>

      {/* Game buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="flex gap-6 flex-wrap justify-center"
      >
        {GAMES.map((game) => (
          <a
            key={game.path}
            href={game.comingSoon ? "#" : game.path}
            className="px-6 py-3 bg-white text-purple-700 font-bold rounded-lg shadow-lg hover:scale-110 transition-transform"
            title={game.comingSoon ? "Coming Soon" : game.name}
          >
            {game.name} {game.comingSoon && "🚧"}
          </a>
        ))}
      </motion.div>
    </div>
  );
}
