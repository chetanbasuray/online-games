"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GameFooter from "../components/GameFooter";
import SupportWidget from "../components/SupportWidget";
import { isGamePlayable } from "../utils/gameAvailability";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_DROP_INTERVAL = 1000;
const LEVEL_SPEED_BONUS = 65;
const showSupportWidget = isGamePlayable("/tetris");

const createInitialPosition = () => ({
  x: Math.floor(BOARD_WIDTH / 2) - 2,
  y: -2,
});

const TETROMINOES = {
  I: {
    style:
      "bg-gradient-to-br from-cyan-400 via-sky-400 to-sky-500 border border-cyan-500 text-white shadow-[0_10px_18px_rgba(14,165,233,0.28)]",
    preview: "bg-cyan-300",
    rotations: [
      [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
      ],
      [
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 2, y: 3 },
      ],
    ],
  },
  J: {
    style:
      "bg-gradient-to-br from-blue-500 via-blue-500 to-indigo-500 border border-blue-600 text-white shadow-[0_10px_18px_rgba(59,130,246,0.28)]",
    preview: "bg-blue-300",
    rotations: [
      [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ],
      [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
      ],
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
      ],
    ],
  },
  L: {
    style:
      "bg-gradient-to-br from-orange-400 via-amber-400 to-amber-500 border border-orange-500 text-white shadow-[0_10px_18px_rgba(251,146,60,0.3)]",
    preview: "bg-orange-300",
    rotations: [
      [
        { x: 2, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
      ],
      [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 0, y: 2 },
      ],
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ],
    ],
  },
  O: {
    style:
      "bg-gradient-to-br from-yellow-300 via-amber-200 to-amber-400 border border-yellow-400 text-slate-900 shadow-[0_10px_18px_rgba(250,204,21,0.28)]",
    preview: "bg-yellow-200",
    rotations: [
      [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
    ],
  },
  S: {
    style:
      "bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500 border border-emerald-600 text-white shadow-[0_10px_18px_rgba(16,185,129,0.28)]",
    preview: "bg-emerald-300",
    rotations: [
      [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
      ],
    ],
  },
  T: {
    style:
      "bg-gradient-to-br from-purple-500 via-fuchsia-500 to-purple-600 border border-purple-600 text-white shadow-[0_10px_18px_rgba(168,85,247,0.28)]",
    preview: "bg-purple-300",
    rotations: [
      [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ],
      [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ],
      [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ],
    ],
  },
  Z: {
    style:
      "bg-gradient-to-br from-rose-500 via-rose-500 to-pink-500 border border-rose-600 text-white shadow-[0_10px_18px_rgba(244,63,94,0.28)]",
    preview: "bg-rose-300",
    rotations: [
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      [
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ],
    ],
  },
};

const createEmptyBoard = () =>
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));

const getRandomPiece = () => {
  const types = Object.keys(TETROMINOES);
  const type = types[Math.floor(Math.random() * types.length)];
  return { type, rotation: 0 };
};

const getPieceCells = (type, rotation) => {
  const piece = TETROMINOES[type];
  if (!piece) {
    return [];
  }
  const rotationIndex = rotation % piece.rotations.length;
  return piece.rotations[rotationIndex];
};

const checkCollision = (board, piece, position) => {
  if (!piece) {
    return false;
  }

  return getPieceCells(piece.type, piece.rotation).some(({ x, y }) => {
    const boardX = position.x + x;
    const boardY = position.y + y;

    if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
      return true;
    }

    if (boardY >= 0 && board[boardY][boardX]) {
      return true;
    }

    return false;
  });
};

const clearCompletedLines = (board) => {
  const remainingRows = [];
  let cleared = 0;

  for (let row = 0; row < BOARD_HEIGHT; row += 1) {
    const isComplete = board[row].every(Boolean);
    if (isComplete) {
      cleared += 1;
    } else {
      remainingRows.push([...board[row]]);
    }
  }

  while (remainingRows.length < BOARD_HEIGHT) {
    remainingRows.unshift(Array(BOARD_WIDTH).fill(null));
  }

  return { board: remainingRows, linesCleared: cleared };
};

const getLineScore = (lines, level) => {
  const lineScores = [0, 40, 100, 300, 1200];
  return (lineScores[lines] || 0) * level;
};

const projectGhostPosition = (board, piece, position) => {
  if (!piece) {
    return null;
  }

  let ghostY = position.y;
  while (!checkCollision(board, piece, { x: position.x, y: ghostY + 1 })) {
    ghostY += 1;
  }

  return { x: position.x, y: ghostY };
};

const formatCellKey = (x, y) => `${x}-${y}`;

export default function TetrisGame() {
  const [board, setBoard] = useState(() => createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState(() => createInitialPosition());
  const [nextPiece, setNextPiece] = useState(() => getRandomPiece());
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [dropInterval, setDropInterval] = useState(INITIAL_DROP_INTERVAL);

  const level = useMemo(
    () => Math.floor(linesCleared / 10) + 1,
    [linesCleared],
  );

  const resetGame = useCallback(() => {
    const emptyBoard = createEmptyBoard();
    const startingPiece = getRandomPiece();
    const upcomingPiece = getRandomPiece();
    const startPosition = createInitialPosition();
    const blocked = checkCollision(emptyBoard, startingPiece, startPosition);

    setBoard(emptyBoard);
    setScore(0);
    setLinesCleared(0);
    setIsPaused(false);
    setIsGameOver(blocked);
    setDropInterval(INITIAL_DROP_INTERVAL);
    setNextPiece(upcomingPiece);
    setPosition(startPosition);
    setCurrentPiece(blocked ? null : startingPiece);
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    const nextInterval = Math.max(
      140,
      INITIAL_DROP_INTERVAL - (level - 1) * LEVEL_SPEED_BONUS,
    );
    setDropInterval(nextInterval);
  }, [level]);

  const movePiece = useCallback(
    (dx, dy) => {
      if (!currentPiece || isPaused || isGameOver) {
        return false;
      }
      const newPosition = { x: position.x + dx, y: position.y + dy };
      if (!checkCollision(board, currentPiece, newPosition)) {
        setPosition(newPosition);
        return true;
      }
      return false;
    },
    [board, currentPiece, position, isPaused, isGameOver],
  );

  const rotatePiece = useCallback(
    (direction) => {
      if (!currentPiece || isPaused || isGameOver) {
        return false;
      }

      const pieceDefinition = TETROMINOES[currentPiece.type];
      const rotationCount = pieceDefinition.rotations.length;
      const newRotation =
        (currentPiece.rotation + direction + rotationCount) % rotationCount;
      const candidate = { type: currentPiece.type, rotation: newRotation };

      const offsets = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: 0 },
        { x: -2, y: 0 },
      ];

      for (const offset of offsets) {
        const testPosition = {
          x: position.x + offset.x,
          y: position.y + offset.y,
        };
        if (!checkCollision(board, candidate, testPosition)) {
          setCurrentPiece((prev) =>
            prev ? { ...prev, rotation: newRotation } : prev,
          );
          setPosition(testPosition);
          return true;
        }
      }

      return false;
    },
    [board, currentPiece, position, isPaused, isGameOver],
  );

  const lockPiece = useCallback(
    (piecePosition = position) => {
      if (!currentPiece) {
        return;
      }

      const settledBoard = board.map((row) => [...row]);
      let overflowedTop = false;

      getPieceCells(currentPiece.type, currentPiece.rotation).forEach(
        ({ x, y }) => {
          const boardX = piecePosition.x + x;
          const boardY = piecePosition.y + y;

          if (boardY < 0) {
            overflowedTop = true;
            return;
          }

          if (
            boardX >= 0 &&
            boardX < BOARD_WIDTH &&
            boardY < BOARD_HEIGHT
          ) {
            settledBoard[boardY][boardX] = currentPiece.type;
          }
        },
      );

      if (overflowedTop) {
        setBoard(settledBoard);
        setCurrentPiece(null);
        setIsGameOver(true);
        setIsPaused(false);
        return;
      }

      const { board: clearedBoard, linesCleared: clearedLines } =
        clearCompletedLines(settledBoard);

      if (clearedLines > 0) {
        setScore((prev) => prev + getLineScore(clearedLines, level));
        setLinesCleared((prev) => prev + clearedLines);
      }

      const startPosition = createInitialPosition();
      const pieceToSpawn = nextPiece ?? getRandomPiece();
      const upcomingPiece = getRandomPiece();

      if (checkCollision(clearedBoard, pieceToSpawn, startPosition)) {
        setBoard(clearedBoard);
        setCurrentPiece(null);
        setIsGameOver(true);
        setIsPaused(false);
        setPosition(startPosition);
        return;
      }

      setBoard(clearedBoard);
      setCurrentPiece(pieceToSpawn);
      setNextPiece(upcomingPiece);
      setPosition(startPosition);
    },
    [board, currentPiece, level, nextPiece, position],
  );

  const dropPiece = useCallback(() => {
    if (isPaused || isGameOver || !currentPiece) {
      return;
    }
    const moved = movePiece(0, 1);
    if (!moved) {
      lockPiece();
    }
  }, [currentPiece, isPaused, isGameOver, lockPiece, movePiece]);

  const hardDrop = useCallback(() => {
    if (isPaused || isGameOver || !currentPiece) {
      return;
    }

    const finalPosition = projectGhostPosition(board, currentPiece, position);
    if (!finalPosition) {
      return;
    }

    const dropDistance = Math.max(0, finalPosition.y - position.y);
    if (dropDistance > 0) {
      setScore((prev) => prev + dropDistance * 2);
    }

    lockPiece(finalPosition);
  }, [board, currentPiece, isGameOver, isPaused, lockPiece, position]);

  const togglePause = useCallback(() => {
    if (isGameOver) {
      return;
    }
    setIsPaused((prev) => !prev);
  }, [isGameOver]);

  useEffect(() => {
    if (!currentPiece || isPaused || isGameOver) {
      return undefined;
    }

    const interval = setInterval(() => {
      dropPiece();
    }, dropInterval);

    return () => clearInterval(interval);
  }, [currentPiece, dropInterval, dropPiece, isGameOver, isPaused]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target instanceof HTMLElement) {
        const tagName = event.target.tagName.toLowerCase();
        if (tagName === "input" || tagName === "textarea") {
          return;
        }
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          movePiece(-1, 0);
          break;
        case "ArrowRight":
          event.preventDefault();
          movePiece(1, 0);
          break;
        case "ArrowDown":
          event.preventDefault();
          if (!movePiece(0, 1)) {
            lockPiece();
          } else {
            setScore((prev) => prev + 1);
          }
          break;
        case "ArrowUp":
        case "x":
        case "X":
          event.preventDefault();
          rotatePiece(1);
          break;
        case "z":
        case "Z":
          event.preventDefault();
          rotatePiece(-1);
          break;
        case " ":
          event.preventDefault();
          hardDrop();
          break;
        case "p":
        case "P":
          event.preventDefault();
          togglePause();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hardDrop, lockPiece, movePiece, rotatePiece, togglePause]);

  const ghostPosition = useMemo(
    () => projectGhostPosition(board, currentPiece, position),
    [board, currentPiece, position],
  );

  const activeCells = useMemo(() => {
    if (!currentPiece) {
      return new Set();
    }

    const filled = new Set();
    getPieceCells(currentPiece.type, currentPiece.rotation).forEach(
      ({ x, y }) => {
        const boardX = position.x + x;
        const boardY = position.y + y;
        if (boardY >= 0) {
          filled.add(formatCellKey(boardX, boardY));
        }
      },
    );

    return filled;
  }, [currentPiece, position]);

  const ghostCells = useMemo(() => {
    if (!currentPiece || !ghostPosition) {
      return new Set();
    }

    const cells = new Set();
    getPieceCells(currentPiece.type, currentPiece.rotation).forEach(
      ({ x, y }) => {
        const boardX = ghostPosition.x + x;
        const boardY = ghostPosition.y + y;
        if (boardY >= 0) {
          const key = formatCellKey(boardX, boardY);
          if (!activeCells.has(key)) {
            cells.add(key);
          }
        }
      },
    );

    return cells;
  }, [activeCells, currentPiece, ghostPosition]);

  const renderBoardCell = (cell, x, y) => {
    const key = formatCellKey(x, y);
    const isActive = activeCells.has(key);
    const isGhost = ghostCells.has(key);

    const baseSize = "h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12";

    let cellClasses =
      `tetris-cell tetris-cell-empty relative ${baseSize} rounded-lg border border-white/25 bg-slate-900/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur`;

    if (cell) {
      cellClasses = `tetris-cell tetris-cell-filled relative ${baseSize} rounded-lg ${TETROMINOES[cell].style}`;
    }

    if (isGhost) {
      cellClasses =
        `tetris-cell tetris-cell-ghost relative ${baseSize} rounded-lg border border-sky-300/60 bg-sky-300/10 shadow-[inset_0_0_14px_rgba(56,189,248,0.35)]`;
    }

    if (isActive) {
      const activeStyle = TETROMINOES[currentPiece.type]?.style;
      cellClasses = `tetris-cell tetris-cell-active tetris-cell-filled relative ${baseSize} rounded-lg ${activeStyle} ring-2 ring-white/40`;
    }

    return <div key={key} className={cellClasses} aria-hidden />;
  };

  const previewGrid = useMemo(() => {
    const size = 4;
    const preview = Array.from({ length: size }, () => Array(size).fill(false));
    const piece = nextPiece;

    if (!piece) {
      return preview;
    }

    getPieceCells(piece.type, 0).forEach(({ x, y }) => {
      const px = Math.min(size - 1, x + 1);
      const py = Math.min(size - 1, y + 1);
      preview[py][px] = true;
    });

    return preview;
  }, [nextPiece]);

  const gameStatus = isGameOver ? "Game over" : isPaused ? "Paused" : "Falling";
  const dropSpeedSeconds = (dropInterval / 1000).toFixed(2);
  const linesIntoCurrentLevel = linesCleared % 10;
  const linesUntilNextLevel = linesIntoCurrentLevel === 0 ? 10 : 10 - linesIntoCurrentLevel;
  const levelProgress = Math.round((linesIntoCurrentLevel / 10) * 100);

  return (
    <div className="relative isolate flex min-h-screen w-full justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 px-4 pb-16 pt-14 text-slate-900 lg:px-8">
      {showSupportWidget && <SupportWidget />}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[-10%] h-72 w-72 rounded-full bg-sky-200/55 blur-3xl" />
        <div className="absolute right-[-6%] top-[22%] h-96 w-96 rounded-full bg-rose-200/45 blur-3xl" />
        <div className="absolute left-1/2 top-[68%] h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-emerald-200/45 blur-[140px]" />
      </div>
      <div className="relative z-10 flex w-full max-w-6xl flex-col gap-12">
        <header className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm">
            Modern Classic
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Tetris</h1>
          <p className="text-base text-slate-600 sm:text-lg">
            Guide glowing tetrominoes through a polished cabinet and chase ever-higher scores in this refreshed classic.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={resetGame}
              className="inline-flex items-center justify-center rounded-full border border-transparent bg-gradient-to-r from-emerald-100 via-teal-100 to-sky-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700 shadow-sm transition hover:brightness-110"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={togglePause}
              className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] shadow-sm transition ${
                isPaused
                  ? "border-transparent bg-gradient-to-r from-emerald-100 via-teal-100 to-sky-100 text-emerald-700 hover:brightness-110"
                  : "border-transparent bg-gradient-to-r from-sky-100 via-blue-100 to-emerald-100 text-blue-800 hover:brightness-110"
              }`}
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={hardDrop}
              className="inline-flex items-center justify-center rounded-full border border-slate-300/80 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50/70 hover:text-sky-700"
            >
              Hard Drop
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,260px)] xl:items-start">
          <div className="order-2 flex flex-col gap-5 xl:order-1">
            <div className="rounded-[26px] border border-white/75 bg-white/70 p-6 shadow-[0_22px_48px_rgba(148,163,184,0.28)] backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Score</h2>
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-100/80 to-sky-100/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-700">
                  {gameStatus}
                </span>
              </div>
              <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{score.toLocaleString()}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-700">Lines cleared</dt>
                  <dd className="mt-1 text-2xl font-semibold text-slate-900">{linesCleared}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Drop speed</dt>
                  <dd className="mt-1 text-2xl font-semibold text-slate-900">{dropSpeedSeconds}s</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-[26px] border border-white/70 bg-gradient-to-br from-sky-100/80 via-emerald-100/75 to-amber-100/75 p-6 shadow-[0_22px_48px_rgba(56,189,248,0.25)]">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-slate-600">
                <span>Level</span>
                <span>{level}</span>
              </div>
              <div className="mt-5 h-2 w-full rounded-full bg-white/60">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500 transition-[width]"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-600">
                {linesUntilNextLevel === 10
                  ? "Clear 10 lines to level up"
                  : `${linesUntilNextLevel} line${linesUntilNextLevel === 1 ? "" : "s"} to level up`}
              </p>
            </div>
          </div>

          <div className="order-1 flex justify-center xl:order-2">
            <div className="relative w-full max-w-[min(560px,90vw)]">
              <div className="pointer-events-none absolute inset-x-[-25%] top-1/2 -z-10 h-[120%] -translate-y-1/2 rounded-[50%] bg-gradient-to-br from-sky-200/25 via-blue-200/20 to-emerald-200/25 blur-3xl" />
              <div className="relative overflow-hidden rounded-[34px] border border-white/75 bg-white/55 p-[18px] shadow-[0_35px_80px_rgba(15,23,42,0.24)] backdrop-blur-xl">
                <div className="relative overflow-hidden rounded-[26px] border border-white/25 bg-gradient-to-b from-slate-900/92 via-slate-950/94 to-slate-900/92 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_60%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(244,114,182,0.22),transparent_60%)]" />
                  <div className="pointer-events-none absolute inset-0 border border-white/5 mix-blend-soft-light" />
                  <div className="relative">
                    <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/80 shadow-sm">
                      {gameStatus}
                    </div>
                    <div className="relative grid grid-cols-10 gap-[4px] pt-8 sm:gap-[5px] sm:pt-10 md:gap-[6px]">
                      {board.map((row, rowIndex) =>
                        row.map((cell, columnIndex) =>
                          renderBoardCell(cell, columnIndex, rowIndex),
                        ),
                      )}
                    </div>
                    {isGameOver ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[22px] bg-slate-950/85 p-8 text-center shadow-[inset_0_0_70px_rgba(15,23,42,0.9)]">
                        <p className="text-3xl font-semibold text-white">Game Over</p>
                        <p className="mt-3 text-sm text-slate-200">Press restart to try again.</p>
                      </div>
                    ) : null}
                    {isPaused && !isGameOver ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[22px] bg-white/10 p-8 text-center backdrop-blur">
                        <p className="text-2xl font-semibold text-white">Paused</p>
                        <p className="mt-2 text-sm text-slate-200">Press resume or the P key to continue.</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-3 flex flex-col gap-5 xl:order-3">
            <div className="rounded-[26px] border border-white/75 bg-white/70 p-6 shadow-[0_22px_48px_rgba(99,102,241,0.18)] backdrop-blur">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600">Next Piece</h2>
              <div className="mt-4 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/80 to-violet-50/80 p-4 shadow-inner">
                <div className="grid grid-cols-4 gap-2">
                  {previewGrid.map((row, rowIndex) =>
                    row.map((isFilled, columnIndex) => {
                      const previewKey = `${rowIndex}-${columnIndex}`;
                      const previewClasses =
                        isFilled && nextPiece
                          ? `${TETROMINOES[nextPiece.type].preview} h-6 w-6 rounded-lg shadow-sm`
                          : "h-6 w-6 rounded-lg border border-slate-200/70 bg-white/80";
                      return <div key={previewKey} className={previewClasses} aria-hidden />;
                    }),
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-[26px] border border-white/75 bg-white/70 p-6 shadow-[0_22px_48px_rgba(148,163,184,0.24)] backdrop-blur">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600">Controls</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-white/80 px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-700">
                    ← → ↓
                  </span>
                  <span className="leading-tight">Move left, right, and soft drop</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-white/80 px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-700">
                    ↑ / X
                  </span>
                  <span className="leading-tight">Rotate clockwise</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-white/80 px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-700">
                    Z
                  </span>
                  <span className="leading-tight">Rotate counter-clockwise</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-white/80 px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-700">
                    Space
                  </span>
                  <span className="leading-tight">Hard drop instantly</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-white/80 px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-700">
                    P
                  </span>
                  <span className="leading-tight">Pause or resume</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <GameFooter
          gameName="Tetris"
          creator="Alexey Pajitnov"
          moreInfo={{
            url: "https://tetris.com/about-tetris",
            label: "the official Tetris history",
          }}
          className="mx-auto w-full max-w-md"
        />
      </div>
    </div>
  );
}
