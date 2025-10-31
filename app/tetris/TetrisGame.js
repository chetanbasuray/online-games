"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FloatingBubbles from "../components/FloatingBubbles";
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
      "bg-cyan-400/80 border border-cyan-200/70 shadow-[0_0_18px_rgba(34,211,238,0.45)]",
    preview: "bg-cyan-300/70",
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
      "bg-indigo-400/80 border border-indigo-200/70 shadow-[0_0_18px_rgba(99,102,241,0.45)]",
    preview: "bg-indigo-300/70",
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
      "bg-amber-400/80 border border-amber-200/70 shadow-[0_0_18px_rgba(251,191,36,0.45)]",
    preview: "bg-amber-300/70",
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
      "bg-yellow-300/90 border border-yellow-100/80 shadow-[0_0_18px_rgba(250,204,21,0.45)] text-slate-900",
    preview: "bg-yellow-200/80",
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
      "bg-emerald-400/80 border border-emerald-200/70 shadow-[0_0_18px_rgba(16,185,129,0.45)]",
    preview: "bg-emerald-300/70",
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
      "bg-fuchsia-400/80 border border-fuchsia-200/70 shadow-[0_0_18px_rgba(217,70,239,0.45)]",
    preview: "bg-fuchsia-300/70",
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
      "bg-rose-400/80 border border-rose-200/70 shadow-[0_0_18px_rgba(244,63,94,0.45)]",
    preview: "bg-rose-300/70",
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
  const [scale, setScale] = useState(1);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState(() => createInitialPosition());
  const [nextPiece, setNextPiece] = useState(() => getRandomPiece());
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [dropInterval, setDropInterval] = useState(INITIAL_DROP_INTERVAL);
  const contentRef = useRef(null);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateScale = () => {
      if (!contentRef.current) {
        return;
      }

      const { offsetWidth, offsetHeight } = contentRef.current;
      if (!offsetWidth || !offsetHeight) {
        return;
      }

      const horizontalMargin = 48;
      const verticalMargin = 72;
      const availableWidth = Math.max(
        window.innerWidth - horizontalMargin,
        320,
      );
      const availableHeight = Math.max(
        window.innerHeight - verticalMargin,
        320,
      );

      const widthScale = availableWidth / offsetWidth;
      const heightScale = availableHeight / offsetHeight;
      const nextScale = Math.min(1, widthScale, heightScale);

      setScale((previous) =>
        Math.abs(previous - nextScale) > 0.01 ? nextScale : previous,
      );
    };

    updateScale();

    window.addEventListener("resize", updateScale);

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined" && contentRef.current) {
      resizeObserver = new ResizeObserver(() => updateScale());
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateScale);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

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
      "relative h-9 w-9 rounded-md border border-slate-700/40 bg-slate-900/40 shadow-inner md:h-10 md:w-10 xl:h-11 xl:w-11";

    if (cell) {
      cellClasses = `relative h-9 w-9 rounded-md ${TETROMINOES[cell].style} md:h-10 md:w-10 xl:h-11 xl:w-11`;
    }

    if (isGhost) {
      cellClasses =
        "relative h-9 w-9 rounded-md border border-white/15 bg-white/10 md:h-10 md:w-10 xl:h-11 xl:w-11";
    }

    if (isActive) {
      const activeStyle = TETROMINOES[currentPiece.type]?.style;
      cellClasses = `relative h-9 w-9 rounded-md ${activeStyle} brightness-110 md:h-10 md:w-10 xl:h-11 xl:w-11`;
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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingBubbles />
      {showSupportWidget && <SupportWidget />}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
        <div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
          <div
            className="origin-top flex-shrink-0 transition-transform duration-300 ease-out"
            style={{ transform: `scale(${scale})` }}
          >
            <div
              ref={contentRef}
              className="flex flex-col items-center gap-8 text-slate-100"
            >
              <div className="text-center">
                <h1 className="text-4xl font-semibold uppercase tracking-[0.4em] text-white/80">
                  Cosmic Tetris
                </h1>
                <p className="mt-3 text-sm text-slate-300/80">
                  Stack the falling tetrominoes to clear lines and climb through
                  the levels of the cosmos.
                </p>
              </div>

              <div className="flex w-full max-w-5xl flex-col items-center gap-6 lg:flex-row lg:items-stretch lg:justify-center">
                <div className="order-2 flex w-full flex-col gap-4 lg:order-1 lg:w-72">
                  <div className="cosmic-card flex w-full flex-col gap-3 text-xs text-slate-200/90">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div>
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-300/70">
                          Score
                        </span>
                        <p className="text-xl font-semibold text-white/90">
                          {score.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-300/70">
                          Level
                        </span>
                        <p className="text-xl font-semibold text-white/90">{level}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div>
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-300/70">
                          Lines
                        </span>
                        <p className="text-lg font-medium text-white/80">{linesCleared}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-300/70">
                          Status
                        </span>
                        <p className="text-sm font-medium text-white/70">
                          {isGameOver
                            ? "Game Over"
                            : isPaused
                              ? "Paused"
                              : "Falling"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div>
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-300/70">
                          Drop Speed
                        </span>
                        <p className="text-sm font-medium text-white/70">
                          {(dropInterval / 1000).toFixed(2)}s
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-300/70">
                          Next Piece
                        </span>
                        <div className="mt-1 inline-block rounded-xl border border-slate-700/40 bg-slate-900/60 p-2 shadow-inner">
                          <div className="grid grid-cols-4 gap-[3px]">
                            {previewGrid.map((row, rowIndex) =>
                              row.map((isFilled, columnIndex) => {
                                const previewKey = `${rowIndex}-${columnIndex}`;
                                const previewClasses = isFilled
                                  ? `${TETROMINOES[nextPiece.type].preview} h-4 w-4 rounded-sm shadow-[0_0_12px_rgba(148,163,184,0.35)]`
                                  : "h-4 w-4 rounded-sm border border-slate-700/50 bg-slate-900/40";
                                return (
                                  <div key={previewKey} className={previewClasses} aria-hidden />
                                );
                              }),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={resetGame}
                        className="cosmic-pill px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80"
                      >
                        Restart
                      </button>
                      <button
                        type="button"
                        onClick={togglePause}
                        className={`cosmic-pill px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 ${isPaused ? "cosmic-pill--active" : ""}`}
                      >
                        {isPaused ? "Resume" : "Pause"}
                      </button>
                      <button
                        type="button"
                        onClick={hardDrop}
                        className="cosmic-pill px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80"
                      >
                        Hard Drop
                      </button>
                    </div>
                  </div>

                  <div className="cosmic-card text-xs text-slate-300/80">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                      Controls
                    </h2>
                    <ul className="mt-3 space-y-2 leading-relaxed">
                      <li>
                        <span className="font-semibold text-white/80">Arrow Keys</span> —
                        Move left, right, and soft drop
                      </li>
                      <li>
                        <span className="font-semibold text-white/80">Arrow Up / X</span> —
                        Rotate clockwise
                      </li>
                      <li>
                        <span className="font-semibold text-white/80">Z</span> — Rotate
                        counter-clockwise
                      </li>
                      <li>
                        <span className="font-semibold text-white/80">Space</span> — Hard
                        drop
                      </li>
                      <li>
                        <span className="font-semibold text-white/80">P</span> — Pause or
                        resume
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="order-1 flex items-center justify-center lg:order-2">
                  <div className="relative rounded-[28px] border border-slate-700/40 bg-slate-900/50 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.65)] backdrop-blur-sm">
                    <div className="grid grid-cols-10 gap-[4px]">
                      {board.map((row, rowIndex) =>
                        row.map((cell, columnIndex) =>
                          renderBoardCell(cell, columnIndex, rowIndex),
                        ),
                      )}
                    </div>
                    {isGameOver ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[28px] bg-slate-950/80 backdrop-blur">
                        <p className="text-2xl font-semibold text-white/90">Game Over</p>
                        <p className="mt-2 text-sm text-slate-300/80">
                          Press restart to play again.
                        </p>
                      </div>
                    ) : null}
                    {isPaused && !isGameOver ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[28px] bg-slate-950/70 backdrop-blur">
                        <p className="text-xl font-semibold text-white/90">Paused</p>
                        <p className="mt-2 text-xs text-slate-300/80">
                          Press resume or the P key to continue.
                        </p>
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
    </div>
  );
}
