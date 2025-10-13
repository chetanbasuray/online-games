"use client";
import { motion } from "framer-motion";

export default function Sudoku() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="text-5xl sm:text-6xl font-bold text-white mb-6 text-center"
      >
        Sudoku
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="text-xl sm:text-2xl text-white/80 mb-12 text-center max-w-xl"
      >
        Coming Soon! Stay tuned for your favorite number puzzles directly in the browser.
      </motion.p>
    </div>
  );
}
