"use client";
import { motion } from "framer-motion";

export default function GamePlaceholder({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-6">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-6xl font-bold text-white mb-6 text-center"
      >
        {title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="text-xl text-white/80 text-center max-w-lg"
      >
        Coming soon! This game will be playable directly in your browser soon. Stay tuned!
      </motion.p>
    </div>
  );
}
