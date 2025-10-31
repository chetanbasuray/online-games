"use client";
import { motion } from "framer-motion";
import GameFooter from "./GameFooter";

export default function GamePlaceholder({ title, creator, moreInfo }) {
  return (
    <div className="cosmic-page">
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-4 py-12 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="cosmic-panel flex w-full max-w-3xl flex-col items-center gap-6 px-10 py-14 text-center"
        >
          <h1 className="cosmic-heading text-5xl font-bold">{title}</h1>
          <p className="text-lg text-white/75">
            We&rsquo;re giving this classic the same starlit glow as the rest of the arcade. Check back soon for its grand entrance.
          </p>
          <span className="cosmic-pill px-6 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
            In development
          </span>
        </motion.div>
        <GameFooter
          gameName={title}
          creator={creator}
          moreInfo={moreInfo}
          className="w-full max-w-md lg:max-w-xs lg:self-start"
        />
      </div>
    </div>
  );
}
