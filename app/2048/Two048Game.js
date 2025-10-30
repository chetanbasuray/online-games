"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FloatingBubbles from "../components/FloatingBubbles";

const GRID_SIZE = 4;
const TARGET_TILE = 2048;
const BEST_SCORE_KEY = "online-games-2048-best-score";

const createEmptyBoard = () =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

const cloneBoard = (board) => board.map((row) => [...row]);

const addRandomTile = (board) => {
  const emptyCells = [];

  board.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value === 0) {
        emptyCells.push([rowIndex, columnIndex]);
      }
    });
  });

  if (emptyCells.length === 0) {
    return board;
  }

  const [rowIndex, columnIndex] =
    emptyCells[Math.floor(Math.random() * emptyCells.length)];

  const value = Math.random() < 0.9 ? 2 : 4;
  const newBoard = cloneBoard(board);
  newBoard[rowIndex][columnIndex] = value;
  return newBoard;
};

const initializeBoard = () => {
  let board = createEmptyBoard();
  board = addRandomTile(board);
  board = addRandomTile(board);
  return board;
};

const moveRowLeft = (row) => {
  const tightRow = row.filter((value) => value !== 0);
  const newRow = [];
  let rowMoved = false;
  let scoreGained = 0;

  for (let i = 0; i < tightRow.length; i += 1) {
    const current = tightRow[i];
    const next = tightRow[i + 1];

    if (current !== undefined && current === next) {
      const merged = current * 2;
      newRow.push(merged);
      scoreGained += merged;
      i += 1;
      rowMoved = true;
    } else {
      newRow.push(current);
    }
  }

  while (newRow.length < GRID_SIZE) {
    newRow.push(0);
  }

  if (!rowMoved) {
    rowMoved = newRow.some((value, index) => value !== row[index]);
  }

  return { row: newRow, moved: rowMoved, scoreGained };
};

const transpose = (board) =>
  board[0].map((_, columnIndex) => board.map((row) => row[columnIndex]));

const moveLeft = (board) => {
  let moved = false;
  let scoreGained = 0;
  const newBoard = board.map((row) => {
    const { row: newRow, moved: rowMoved, scoreGained: rowScore } =
      moveRowLeft(row);
    if (rowMoved) {
      moved = true;
    }
    scoreGained += rowScore;
    return newRow;
  });

  return { board: newBoard, moved, scoreGained };
};

const moveRight = (board) => {
  let moved = false;
  let scoreGained = 0;
  const newBoard = board.map((row) => {
    const reversed = [...row].reverse();
    const {
      row: reversedRow,
      moved: rowMoved,
      scoreGained: rowScore,
    } = moveRowLeft(reversed);
    if (rowMoved) {
      moved = true;
    }
    scoreGained += rowScore;
    return reversedRow.reverse();
  });

  return { board: newBoard, moved, scoreGained };
};

const moveUp = (board) => {
  const transposed = transpose(board);
  const { board: movedBoard, moved, scoreGained } = moveLeft(transposed);
  return { board: transpose(movedBoard), moved, scoreGained };
};

const moveDown = (board) => {
  const transposed = transpose(board);
  const { board: movedBoard, moved, scoreGained } = moveRight(transposed);
  return { board: transpose(movedBoard), moved, scoreGained };
};

const moveBoard = (board, direction) => {
  switch (direction) {
    case "ArrowLeft":
      return moveLeft(board);
    case "ArrowRight":
      return moveRight(board);
    case "ArrowUp":
      return moveUp(board);
    case "ArrowDown":
      return moveDown(board);
    default:
      return { board, moved: false, scoreGained: 0 };
  }
};

const boardHasTarget = (board) =>
  board.some((row) => row.some((value) => value >= TARGET_TILE));

const isBoardStuck = (board) => {
  const hasEmptyCell = board.some((row) => row.some((value) => value === 0));

  if (hasEmptyCell) {
    return false;
  }

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let column = 0; column < GRID_SIZE; column += 1) {
      const value = board[row][column];
      const right = board[row][column + 1];
      const down = board[row + 1]?.[column];

      if (value === right || value === down) {
        return false;
      }
    }
  }

  return true;
};

const TILE_STYLES = {
  0: "bg-white/5 text-transparent border border-white/5",
  2: "bg-indigo-500/30 text-indigo-100 border border-indigo-200/30",
  4: "bg-fuchsia-500/30 text-fuchsia-100 border border-fuchsia-200/30",
  8: "bg-emerald-500/40 text-emerald-50 border border-emerald-200/30",
  16: "bg-cyan-500/40 text-cyan-50 border border-cyan-200/30",
  32: "bg-sky-500/50 text-sky-50 border border-sky-200/30",
  64: "bg-amber-500/60 text-white border border-amber-200/30",
  128: "bg-rose-500/70 text-white text-2xl border border-rose-200/40",
  256: "bg-purple-500/70 text-white text-2xl border border-purple-200/40",
  512: "bg-violet-500/80 text-white text-2xl border border-violet-200/40",
  1024: "bg-teal-500/80 text-white text-xl border border-teal-200/40",
  2048: "bg-lime-400/80 text-slate-900 text-xl border border-lime-200/60",
};

const getTileClasses = (value) =>
  `${TILE_STYLES[value] ?? "bg-lime-500/80 text-slate-900 text-xl border border-lime-200/60"} rounded-xl font-bold flex items-center justify-center game-tile shadow-[0_12px_30px_rgba(79,70,229,0.35)] select-none backdrop-blur-sm`;

const formatBoardKey = (rowIndex, columnIndex) => `${rowIndex}-${columnIndex}`;

const DirectionButton = ({
  label,
  onClick,
  className = "",
  ariaLabel,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`cosmic-pill px-4 py-3 text-lg font-semibold uppercase tracking-[0.3em] text-white/80 transition ${className}`}
    aria-label={ariaLabel ?? label}
  >
    {label}
  </button>
);

export default function Two048Game() {
  const [board, setBoard] = useState(() => initializeBoard());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [recentlyChanged, setRecentlyChanged] = useState([]);
  const touchStartRef = useRef(null);

  const startNewGame = useCallback(() => {
    setBoard(initializeBoard());
    setScore(0);
    setHasWon(false);
    setIsGameOver(false);
  }, []);

  const handleMove = useCallback(
    (direction) => {
      if (isGameOver || hasWon) {
        return;
      }

      setBoard((currentBoard) => {
        const { board: movedBoard, moved, scoreGained } =
          moveBoard(currentBoard, direction);

        if (!moved) {
          return currentBoard;
        }

        const boardWithTile = addRandomTile(movedBoard);

        const changedTiles = [];

        for (let rowIndex = 0; rowIndex < GRID_SIZE; rowIndex += 1) {
          for (
            let columnIndex = 0;
            columnIndex < GRID_SIZE;
            columnIndex += 1
          ) {
            if (
              boardWithTile[rowIndex][columnIndex] !==
                currentBoard[rowIndex][columnIndex] &&
              boardWithTile[rowIndex][columnIndex] !== 0
            ) {
              changedTiles.push(formatBoardKey(rowIndex, columnIndex));
            }
          }
        }

        setRecentlyChanged(changedTiles);

        if (scoreGained) {
          setScore((previous) => previous + scoreGained);
        }

        if (!hasWon && boardHasTarget(boardWithTile)) {
          setHasWon(true);
        }

        if (isBoardStuck(boardWithTile)) {
          setIsGameOver(true);
        }

        return boardWithTile;
      });
    },
    [hasWon, isGameOver]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        handleMove(event.key);
      }
    },
    [handleMove]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedBest = window.localStorage.getItem(BEST_SCORE_KEY);
    if (storedBest) {
      setBestScore(Number(storedBest));
    }
  }, []);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(BEST_SCORE_KEY, String(score));
      }
    }
  }, [score, bestScore]);

  const handleTouchStart = useCallback((event) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (event) => {
      if (!touchStartRef.current) {
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const threshold = 30;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) {
          handleMove(deltaX > 0 ? "ArrowRight" : "ArrowLeft");
        }
      } else if (Math.abs(deltaY) > threshold) {
        handleMove(deltaY > 0 ? "ArrowDown" : "ArrowUp");
      }

      touchStartRef.current = null;
    },
    [handleMove]
  );

  useEffect(() => {
    if (recentlyChanged.length === 0) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setRecentlyChanged([]);
    }, 140);

    return () => clearTimeout(timeout);
  }, [recentlyChanged]);

  const boardTiles = useMemo(() => {
    const activeTiles = new Set(recentlyChanged);

    return board.map((row, rowIndex) =>
      row.map((value, columnIndex) => {
        const tileKey = formatBoardKey(rowIndex, columnIndex);
        const isActive = activeTiles.has(tileKey);

        return (
          <div
            key={tileKey}
            className={`${getTileClasses(value)} h-20 w-20 sm:h-24 sm:w-24${
              isActive ? " tile-pop" : ""
            }`}
          >
            {value !== 0 ? value : ""}
          </div>
        );
      })
    );
  }, [board, recentlyChanged]);

  return (
    <div className="cosmic-page">
      <FloatingBubbles count={14} area="full" zIndex={1} />

      <div className="cosmic-panel relative z-10 flex w-full max-w-4xl flex-col items-center gap-10 px-6 py-12 text-center sm:px-10">
        <header className="space-y-3">
          <h1 className="cosmic-heading text-4xl font-bold sm:text-5xl">2048</h1>
          <p className="text-sm uppercase tracking-[0.5em] text-white/60">
            Fuse the tiles, chase the light
          </p>
          <p className="text-base text-white/75 sm:text-lg">
            Merge matching tiles to craft luminous numbers. Use your keyboard, swipe gestures, or the starlit controls below.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="cosmic-card px-6 py-4">
            <div className="text-xs uppercase tracking-[0.4em] text-white/60">Score</div>
            <div className="mt-2 text-3xl font-bold text-white">{score}</div>
          </div>
          <div className="cosmic-card px-6 py-4">
            <div className="text-xs uppercase tracking-[0.4em] text-white/60">Best</div>
            <div className="mt-2 text-3xl font-bold text-white">{bestScore}</div>
          </div>
          <button
            type="button"
            onClick={startNewGame}
            className="cosmic-pill px-6 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-white/80"
          >
            New Game
          </button>
        </div>

        <div
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-4 gap-4 rounded-3xl border border-white/10 bg-slate-900/40 p-5 shadow-[0_25px_60px_rgba(79,70,229,0.35)] backdrop-blur-xl touch-none">
            {boardTiles}
          </div>

          {(hasWon || isGameOver) && (
            <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-slate-950/80 p-6 text-center backdrop-blur">
              <div className="flex flex-col items-center gap-4">
                <p className="text-3xl font-bold text-white">
                  {hasWon ? "You made it to 2048!" : "No more moves!"}
                </p>
                <p className="text-sm text-white/70">
                  {hasWon
                    ? "Keep going to push your score even higher, or reset the cosmic board."
                    : "Start a fresh grid and aim for a new personal best."}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {hasWon && (
                    <button
                      type="button"
                      onClick={() => setHasWon(false)}
                      className="cosmic-pill px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80"
                    >
                      Keep Playing
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={startNewGame}
                    className="cosmic-pill px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80"
                  >
                    New Game
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-sm">
          <div className="grid grid-cols-3 gap-4">
            <div />
            <DirectionButton
              label="↑"
              ariaLabel="Move tiles up"
              onClick={() => handleMove("ArrowUp")}
            />
            <div />
            <DirectionButton
              label="←"
              ariaLabel="Move tiles left"
              onClick={() => handleMove("ArrowLeft")}
            />
            <DirectionButton
              label="↓"
              ariaLabel="Move tiles down"
              onClick={() => handleMove("ArrowDown")}
              className="col-start-2"
            />
            <DirectionButton
              label="→"
              ariaLabel="Move tiles right"
              onClick={() => handleMove("ArrowRight")}
              className="col-start-3"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
