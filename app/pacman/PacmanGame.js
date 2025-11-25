"use client";

import { useEffect, useMemo, useState } from "react";

import GameFooter from "../components/GameFooter";

import { BOARD_WIDTH, advanceGameState, createGameState, getTickInterval } from "./logic.js";
import { getPacmanOriginsDisplay } from "./history";
import { getBoardStyle, getPelletStyle } from "./display";

const KEY_TO_DIRECTION = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

const GHOST_COLORS = ["bg-rose-500", "bg-sky-500", "bg-amber-500", "bg-emerald-500"];

export default function PacmanGame() {
  const [state, setState] = useState(() => createGameState());

  const totalPellets = useMemo(() => createGameState().pelletsRemaining, []);
  const pelletsCollected = useMemo(
    () => Math.max(0, totalPellets - state.pelletsRemaining),
    [state.pelletsRemaining, totalPellets],
  );
  const originDisplay = useMemo(() => getPacmanOriginsDisplay(), []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const direction = KEY_TO_DIRECTION[event.key];
      if (!direction) return;
      event.preventDefault();
      setState((prev) => ({
        ...prev,
        pacman: { ...prev.pacman, pendingDirection: direction },
      }));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const interval = getTickInterval(state.score);
    const id = setInterval(() => {
      setState((prev) => advanceGameState(prev));
    }, interval);

    return () => clearInterval(id);
  }, [state.score]);

  const handleRestart = () => {
    setState(createGameState());
  };

  const statusLabel =
    state.status === "won"
      ? "Maze cleared"
      : state.status === "over"
        ? "Game over"
        : state.powerTimer > 0
          ? "Power mode"
          : "Chase";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-slate-900/40 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-blue-200/70">Pac-Man Tribute</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">Chomp the dots, dodge the ghosts</h1>
            <p className="max-w-3xl text-sm text-slate-200/80 sm:text-base">
              Glide through a compact neon maze, collect every pellet, and flip the tables with power orbs.
              Arrow keys or WASD steer Pac-Man. Clearing the maze without losing all lives wins the round.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <InfoPill label="Score" value={state.score.toLocaleString()} />
            <InfoPill label="Lives" value={<Lives count={state.lives} />} />
            <InfoPill label="Status" value={statusLabel} tone={state.status === "won" ? "success" : undefined} />
            <button
              type="button"
              onClick={handleRestart}
              className="rounded-full border border-blue-300/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:border-blue-200/60 hover:bg-blue-500/20"
            >
              Restart
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[auto,280px]">
          <div className="flex items-center justify-center">
            <div
              className="rounded-3xl border border-blue-400/25 bg-slate-950/70 p-5 shadow-[0_20px_60px_rgba(14,165,233,0.2)]"
            >
              <div
                className="grid rounded-2xl bg-slate-900/50 p-2"
                style={getBoardStyle(BOARD_WIDTH)}
              >
                {state.board.map((row, y) =>
                  row.map((cell, x) => {
                    const isPacman = state.pacman.position.x === x && state.pacman.position.y === y;
                    const ghostIndex = state.ghosts.findIndex(
                      (ghost) => ghost.position.x === x && ghost.position.y === y,
                    );
                    const isGhost = ghostIndex !== -1;
                    const tileClasses =
                      cell === "#"
                        ? "bg-slate-900 shadow-[inset_0_0_12px_rgba(59,130,246,0.55)]"
                        : "bg-slate-900/60 backdrop-blur";

                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`${tileClasses} relative aspect-square rounded-[6px] border border-slate-800/70 shadow-inner shadow-blue-500/10`}
                      >
                        {cell === "." && !isPacman && !isGhost && (
                          <span
                            className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                            style={getPelletStyle(false)}
                          />
                        )}
                        {cell === "o" && !isPacman && !isGhost && (
                          <span
                            className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.85)]"
                            style={getPelletStyle(true)}
                          />
                        )}
                        {isGhost && <Ghost colorClass={GHOST_COLORS[ghostIndex % GHOST_COLORS.length]} />}
                        {isPacman && <Pacman powerMode={state.powerTimer > 0} />}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/60 p-6 text-sm text-slate-100 shadow-2xl shadow-slate-950/40">
            <h2 className="text-lg font-semibold text-white">Round Breakdown</h2>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                <span>Pellets cleared</span>
                <span className="font-semibold text-white">{pelletsCollected}</span>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                <span>Pellets remaining</span>
                <span className="font-semibold text-white">{state.pelletsRemaining}</span>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                <span>Power timer</span>
                <span className="font-semibold text-white">{state.powerTimer}</span>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                <span>Game status</span>
                <span className="font-semibold text-white">{statusLabel}</span>
              </li>
            </ul>
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner shadow-blue-500/10">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-100/80">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/30 text-[0.8rem]">🎮</span>
                <span>How to play</span>
              </div>
              <ul className="space-y-2 text-[13px] text-slate-100/80">
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] text-blue-200">➤</span>
                  <span>Move with Arrow Keys or WASD to sweep the maze without losing all three lives.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] text-blue-200">➤</span>
                  <span>Power orbs let you eat ghosts for a burst of points and a brief safety window.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] text-blue-200">➤</span>
                  <span>As your score rises, Pac-Man accelerates—collecting pellets speeds the action up.</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/80 px-4 py-3 shadow-inner shadow-slate-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-200/80">{originDisplay.heading}</p>
              <p className="mt-2 text-sm text-slate-100/80">{originDisplay.summary}</p>
              <a
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-100 underline underline-offset-4 transition hover:text-white"
                href={originDisplay.officialSite}
                target="_blank"
                rel="noreferrer"
              >
                {originDisplay.linkLabel}
                <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
        </div>

        <GameFooter
          gameName="Pac-Man"
          creator={originDisplay.creatorLine}
          moreInfo={{
            url: originDisplay.officialSite,
            label: originDisplay.linkLabel,
          }}
          className="w-full max-w-2xl lg:max-w-lg lg:self-start"
          variant="cosmic"
        />
      </div>
    </div>
  );
}

function InfoPill({ label, value, tone = "default" }) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-50"
      : "border-blue-300/30 bg-blue-500/10 text-blue-100";

  return (
    <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${toneClasses}`}>
      <span className="text-xs uppercase tracking-[0.3em] text-white/80">{label}</span>
      <span className="text-base text-white">{value}</span>
    </div>
  );
}

function Lives({ count }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 3 }).map((_, index) => {
        const filled = index < count;
        const opacity = filled ? "opacity-100" : "opacity-30";
        return <span key={index} className={`text-lg text-amber-300 ${opacity}`}>❤</span>;
      })}
    </div>
  );
}

function Ghost({ colorClass }) {
  return (
    <div
      className={`absolute inset-0 m-auto flex h-6 w-6 items-center justify-center rounded-lg ${colorClass} shadow-[0_0_8px_rgba(255,255,255,0.4)]`}
    >
      <span className="text-[10px] text-white">👻</span>
    </div>
  );
}

function Pacman({ powerMode }) {
  return (
    <div className="absolute inset-0 m-auto flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 shadow-[0_0_14px_rgba(251,191,36,0.65)]">
      <span className="text-[10px]" role="img" aria-label="Pac-Man">
        {powerMode ? "😮" : "😋"}
      </span>
    </div>
  );
}
