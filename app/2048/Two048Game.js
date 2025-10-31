"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameFooter from "../components/GameFooter";
import SupportWidget from "../components/SupportWidget";
import { isGamePlayable } from "../utils/gameAvailability";

const GRID_SIZE = 4;
const TARGET_TILE = 2048;
const BEST_SCORE_KEY = "online-games-2048-best-score";
const showSupportWidget = isGamePlayable("/2048");

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
  0: "bg-[#cdc1b4] text-transparent border border-[#bbada0]",
  2: "bg-[#eee4da] text-[#776e65]",
  4: "bg-[#ede0c8] text-[#776e65]",
  8: "bg-[#f2b179] text-white",
  16: "bg-[#f59563] text-white",
  32: "bg-[#f67c5f] text-white",
  64: "bg-[#f65e3b] text-white",
  128: "bg-[#edcf72] text-white text-2xl",
  256: "bg-[#edcc61] text-white text-2xl",
  512: "bg-[#edc850] text-white text-2xl",
  1024: "bg-[#edc53f] text-white text-xl",
  2048: "bg-[#edc22e] text-white text-xl",
};

const getTileClasses = (value) => {
  const baseClasses =
    "flex h-20 w-20 select-none items-center justify-center rounded-lg font-bold text-2xl transition-colors sm:h-24 sm:w-24 sm:text-3xl";
  const style = TILE_STYLES[value] ?? "bg-[#3c3a32] text-white text-xl";
  return `${baseClasses} ${style}`;
};

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
    className={`rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 ${className}`}
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

  const boardTiles = useMemo(
    () =>
      board.map((row, rowIndex) =>
        row.map((value, columnIndex) => (
          <div
            key={formatBoardKey(rowIndex, columnIndex)}
            className={`${getTileClasses(value)} h-20 w-20 sm:h-24 sm:w-24`}
          >
            {value !== 0 ? value : ""}
          </div>
        ))
      ),
    [board]
  );

  return (
    <div className="min-h-screen px-4 py-10 text-slate-900">
      {showSupportWidget && <SupportWidget />}

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
        <div className="w-full max-w-3xl space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-sky-50/80 to-emerald-50/60 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1 text-left">
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">2048</h1>
                <p className="text-sm text-slate-600">
                  Slide the tiles with your arrow keys or swipe gestures to merge matching numbers. Hit 2048 to win and keep going to beat your best score.
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-3 text-center">
                <div className="min-w-[120px] rounded-md border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 px-3 py-2 shadow-sm">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Score</p>
                  <p className="text-2xl font-semibold text-slate-900">{score.toLocaleString()}</p>
                </div>
                <div className="min-w-[120px] rounded-md border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 px-3 py-2 shadow-sm">
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Best</p>
                  <p className="text-2xl font-semibold text-slate-900">{bestScore.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startNewGame}
                className="rounded-full border border-transparent bg-gradient-to-r from-emerald-100 via-green-100 to-blue-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700 shadow-sm transition hover:brightness-110"
              >
                New Game
              </button>
              {hasWon && (
                <span className="inline-flex items-center rounded-full border border-transparent bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-amber-700 shadow-sm">
                  Keep pushing!
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-sky-50/80 to-rose-50/60 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col items-center gap-6">
              <div
                className="relative"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div className="rounded-3xl bg-gradient-to-br from-[#cdc1b4] via-[#d8cbbd] to-[#ece0d1] p-4 shadow-inner">
                  <div className="grid grid-cols-4 gap-3">
                    {boardTiles}
                  </div>
                </div>

                {(hasWon || isGameOver) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-white/95 via-sky-50/80 to-emerald-50/60 p-6 text-center shadow-inner">
                    <p className="text-2xl font-semibold text-slate-900">
                      {hasWon ? "You made it to 2048!" : "No more moves"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {hasWon
                        ? "Try for a new personal best or reset for a fresh challenge."
                        : "Start a new game and aim for the 2048 tile again."}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {hasWon && (
                        <button
                          type="button"
                          onClick={() => setHasWon(false)}
                          className="rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700"
                        >
                          Keep Playing
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={startNewGame}
                        className="rounded-full border border-transparent bg-gradient-to-r from-emerald-100 via-green-100 to-blue-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700 shadow-sm transition hover:brightness-110"
                      >
                        New Game
                      </button>
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
        </div>
        <GameFooter
          gameName="2048"
          creator="Gabriele Cirulli"
          moreInfo={{
            url: "https://play2048.co/",
            label: "the original 2048 site",
          }}
          className="w-full max-w-md lg:max-w-xs lg:self-start"
        />
      </div>
    </div>
  );
}
