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
    style: "bg-cyan-400 border border-cyan-500 text-white shadow-sm",
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
    style: "bg-blue-500 border border-blue-600 text-white shadow-sm",
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
    style: "bg-orange-400 border border-orange-500 text-white shadow-sm",
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
    style: "bg-yellow-300 border border-yellow-400 text-slate-900 shadow-sm",
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
    style: "bg-emerald-500 border border-emerald-600 text-white shadow-sm",
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
    style: "bg-purple-500 border border-purple-600 text-white shadow-sm",
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
    style: "bg-rose-500 border border-rose-600 text-white shadow-sm",
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

  const lockPiece = useCallback(() => {
    if (!currentPiece) {
      return;
    }

    const settledBoard = board.map((row) => [...row]);
    getPieceCells(currentPiece.type, currentPiece.rotation).forEach(
      ({ x, y }) => {
        const boardX = position.x + x;
        const boardY = position.y + y;
        if (
          boardX >= 0 &&
          boardX < BOARD_WIDTH &&
          boardY >= 0 &&
          boardY < BOARD_HEIGHT
        ) {
          settledBoard[boardY][boardX] = currentPiece.type;
        }
      },
    );

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
  }, [board, currentPiece, level, nextPiece, position]);

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

    let dropDistance = 0;
    while (movePiece(0, 1)) {
      dropDistance += 1;
    }

    if (dropDistance > 0) {
      setScore((prev) => prev + dropDistance * 2);
    }

    lockPiece();
  }, [currentPiece, isGameOver, isPaused, lockPiece, movePiece]);

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

    let cellClasses =
      "relative h-8 w-8 rounded-sm border border-slate-300 bg-white shadow-inner sm:h-9 sm:w-9 md:h-10 md:w-10";

    if (cell) {
      cellClasses = `relative h-8 w-8 rounded-sm ${TETROMINOES[cell].style} sm:h-9 sm:w-9 md:h-10 md:w-10`;
    }

    if (isGhost) {
      cellClasses =
        "relative h-8 w-8 rounded-sm border-2 border-dashed border-blue-300/80 bg-transparent sm:h-9 sm:w-9 md:h-10 md:w-10";
    }

    if (isActive) {
      const activeStyle = TETROMINOES[currentPiece.type]?.style;
      cellClasses = `relative h-8 w-8 rounded-sm ${activeStyle} ring-2 ring-blue-200 sm:h-9 sm:w-9 md:h-10 md:w-10`;
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

  return (
    <div className="min-h-screen px-4 py-10 text-slate-900">
      {showSupportWidget && <SupportWidget />}
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
        <div className="w-full max-w-3xl space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-sky-50/80 to-emerald-50/60 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Tetris</h1>
                <p className="text-sm text-slate-600">
                  Rotate, stack, and clear falling tetrominoes before the board fills up.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
                <div className="rounded-md border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 px-3 py-2 shadow-sm">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Score</p>
                  <p className="text-xl font-semibold text-slate-900">{score.toLocaleString()}</p>
                </div>
                <div className="rounded-md border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 px-3 py-2 shadow-sm">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Level</p>
                  <p className="text-xl font-semibold text-slate-900">{level}</p>
                </div>
                <div className="rounded-md border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 px-3 py-2 shadow-sm">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Lines</p>
                  <p className="text-xl font-semibold text-slate-900">{linesCleared}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 px-3 py-2 text-center shadow-sm">
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Status</p>
                <p className="text-sm font-semibold text-slate-900">{gameStatus}</p>
              </div>
              <div className="rounded-md border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 px-3 py-2 text-center shadow-sm">
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Drop Speed</p>
                <p className="text-sm font-semibold text-slate-900">{dropSpeedSeconds}s</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetGame}
                className="rounded-full border border-transparent bg-gradient-to-r from-emerald-100 via-green-100 to-blue-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700 shadow-sm transition hover:brightness-110"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={togglePause}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] shadow-sm transition ${
                  isPaused
                    ? "border-transparent bg-gradient-to-r from-emerald-100 via-green-100 to-blue-100 text-emerald-700 hover:brightness-110"
                    : "border-transparent bg-gradient-to-r from-blue-100 via-sky-100 to-emerald-100 text-blue-800 hover:brightness-110"
                }`}
              >
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                onClick={hardDrop}
                className="rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700"
              >
                Hard Drop
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-sky-50/80 to-rose-50/60 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="order-2 w-full max-w-sm space-y-4 lg:order-1">
                <div className="rounded-lg border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 p-4 shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Next Piece</h2>
                  <div className="mt-3 inline-block rounded-lg border border-slate-200/70 bg-white/80 px-3 py-3 shadow-sm">
                    <div className="grid grid-cols-4 gap-1">
                      {previewGrid.map((row, rowIndex) =>
                        row.map((isFilled, columnIndex) => {
                          const previewKey = `${rowIndex}-${columnIndex}`;
                          const previewClasses =
                            isFilled && nextPiece
                              ? `${TETROMINOES[nextPiece.type].preview} h-4 w-4 rounded-sm shadow-sm`
                              : "h-4 w-4 rounded-sm border border-slate-200/70 bg-gradient-to-br from-white via-blue-50 to-white";
                          return <div key={previewKey} className={previewClasses} aria-hidden />;
                        }),
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 p-4 shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Controls</h2>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>
                      <span className="font-semibold text-slate-700">Arrow Keys</span> — Move left, right, and soft drop
                    </li>
                    <li>
                      <span className="font-semibold text-slate-700">Arrow Up / X</span> — Rotate clockwise
                    </li>
                    <li>
                      <span className="font-semibold text-slate-700">Z</span> — Rotate counter-clockwise
                    </li>
                    <li>
                      <span className="font-semibold text-slate-700">Space</span> — Hard drop instantly
                    </li>
                    <li>
                      <span className="font-semibold text-slate-700">P</span> — Pause or resume
                    </li>
                  </ul>
                </div>
              </div>

              <div className="order-1 flex justify-center lg:order-2 lg:flex-1">
                <div className="relative rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 p-3 shadow-inner">
                  <div className="grid grid-cols-10 gap-1 sm:gap-[6px]">
                    {board.map((row, rowIndex) =>
                      row.map((cell, columnIndex) =>
                        renderBoardCell(cell, columnIndex, rowIndex),
                      ),
                    )}
                  </div>
                  {isGameOver ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-white/95 via-rose-50/70 to-amber-50/70 p-6 text-center shadow-inner">
                      <p className="text-2xl font-semibold text-slate-900">Game Over</p>
                      <p className="mt-2 text-sm text-slate-600">Press restart to play again.</p>
                    </div>
                  ) : null}
                  {isPaused && !isGameOver ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/80 p-6 text-center">
                      <p className="text-xl font-semibold text-slate-900">Paused</p>
                      <p className="mt-2 text-xs text-slate-600">Press resume or the P key to continue.</p>
                    </div>
                  ) : null}
                </div>
              </div>
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
          className="w-full max-w-md lg:max-w-xs lg:self-start"
        />
      </div>
    </div>
  );
}
