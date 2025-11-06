"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameFooter from "../components/GameFooter";
import SupportWidget from "../components/SupportWidget";
import { isGamePlayable } from "../utils/gameAvailability";

const BOARD_SIZE = 20;
const DEFAULT_HEAD_POSITION = { x: 5, y: 10 };
const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};
const BEST_SCORE_KEY = "online-games-snake-best-score";
const SPEED_BASE = 170;
const SPEED_STEP = 6;
const MIN_SPEED = 85;
const showSupportWidget = isGamePlayable("/snake");

const isOppositeDirection = (current, next) => {
  if (!current || !next) {
    return false;
  }

  if (current === "ArrowUp" && next === "ArrowDown") {
    return true;
  }
  if (current === "ArrowDown" && next === "ArrowUp") {
    return true;
  }
  if (current === "ArrowLeft" && next === "ArrowRight") {
    return true;
  }
  if (current === "ArrowRight" && next === "ArrowLeft") {
    return true;
  }
  return false;
};

const createCellKey = (x, y) => `${x}-${y}`;

const createInitialSnake = (initialDirection = "ArrowRight") => {
  const head = { ...DEFAULT_HEAD_POSITION };

  switch (initialDirection) {
    case "ArrowLeft":
      return [
        head,
        { x: head.x + 1, y: head.y },
        { x: head.x + 2, y: head.y },
      ];
    case "ArrowUp":
      return [
        head,
        { x: head.x, y: head.y + 1 },
        { x: head.x, y: head.y + 2 },
      ];
    case "ArrowDown":
      return [
        head,
        { x: head.x, y: head.y - 1 },
        { x: head.x, y: head.y - 2 },
      ];
    case "ArrowRight":
    default:
      return [
        head,
        { x: head.x - 1, y: head.y },
        { x: head.x - 2, y: head.y },
      ];
  }
};

export default function SnakeGame() {
  const [snake, setSnake] = useState(() => createInitialSnake());
  const [direction, setDirection] = useState("ArrowRight");
  const [food, setFood] = useState({ x: 12, y: 10 });
  const [status, setStatus] = useState("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const nextDirectionRef = useRef(direction);
  const directionRef = useRef(direction);
  const foodRef = useRef(food);
  const scoreRef = useRef(score);
  const bestScoreRef = useRef(bestScore);
  const touchStartRef = useRef(null);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    foodRef.current = food;
  }, [food]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    bestScoreRef.current = bestScore;
  }, [bestScore]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedBest = window.localStorage.getItem(BEST_SCORE_KEY);
    if (storedBest) {
      const parsed = Number.parseInt(storedBest, 10);
      if (!Number.isNaN(parsed)) {
        setBestScore(parsed);
      }
    }
  }, []);

  const generateFood = useCallback((occupied) => {
    const occupiedKeys = new Set(occupied.map((segment) => createCellKey(segment.x, segment.y)));
    const available = [];

    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const key = createCellKey(x, y);
        if (!occupiedKeys.has(key)) {
          available.push({ x, y });
        }
      }
    }

    if (available.length === 0) {
      return null;
    }

    return available[Math.floor(Math.random() * available.length)];
  }, []);

  const resetGame = useCallback((initialDirection = "ArrowRight") => {
    const startingSnake = createInitialSnake(initialDirection);
    const startingFood = generateFood(startingSnake);

    nextDirectionRef.current = initialDirection;
    directionRef.current = initialDirection;
    setDirection(initialDirection);
    setSnake(startingSnake);
    const fallbackFood = startingFood ?? { x: 12, y: 10 };
    setFood(fallbackFood);
    setStatus("running");
    setScore(0);

    scoreRef.current = 0;
    foodRef.current = fallbackFood;
  }, [generateFood]);

  const updateBestScore = useCallback((nextScore) => {
    if (nextScore > bestScoreRef.current) {
      bestScoreRef.current = nextScore;
      setBestScore(nextScore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(BEST_SCORE_KEY, String(nextScore));
      }
    }
  }, []);

  const endGame = useCallback(() => {
    setStatus("over");
  }, []);

  const advanceGame = useCallback(() => {
    if (status !== "running") {
      return;
    }

    const plannedDirection = nextDirectionRef.current;
    const movement = DIRECTIONS[plannedDirection];
    if (!movement) {
      return;
    }

    setDirection(plannedDirection);

    setSnake((currentSnake) => {
      const head = currentSnake[0];
      const newHead = { x: head.x + movement.x, y: head.y + movement.y };

      const hitsWall =
        newHead.x < 0 || newHead.x >= BOARD_SIZE || newHead.y < 0 || newHead.y >= BOARD_SIZE;

      if (hitsWall) {
        endGame();
        return currentSnake;
      }

      const snakeBody = currentSnake.slice(0, -1);
      const hitsSelf = snakeBody.some((segment) => segment.x === newHead.x && segment.y === newHead.y);

      if (hitsSelf) {
        endGame();
        return currentSnake;
      }

      const currentFood = foodRef.current;
      const isEating = currentFood && newHead.x === currentFood.x && newHead.y === currentFood.y;
      let nextSnake;

      if (isEating) {
        nextSnake = [newHead, ...currentSnake];
        const nextScore = scoreRef.current + 10;
        scoreRef.current = nextScore;
        setScore(nextScore);
        updateBestScore(nextScore);

        const nextFood = generateFood(nextSnake);
        foodRef.current = nextFood;
        setFood(nextFood);
      } else {
        nextSnake = [newHead, ...currentSnake.slice(0, -1)];
      }

      return nextSnake;
    });
  }, [endGame, generateFood, status, updateBestScore]);

  const speed = useMemo(() => {
    const level = Math.floor(score / 40);
    const candidate = SPEED_BASE - level * SPEED_STEP;
    return Math.max(candidate, MIN_SPEED);
  }, [score]);

  useEffect(() => {
    if (status !== "running") {
      return undefined;
    }

    const interval = window.setInterval(() => {
      advanceGame();
    }, speed);

    return () => {
      window.clearInterval(interval);
    };
  }, [advanceGame, speed, status]);

  const queueDirection = useCallback((next) => {
    if (!DIRECTIONS[next]) {
      return;
    }

    const current = directionRef.current;
    const planned = nextDirectionRef.current;

    if (isOppositeDirection(current, next) || isOppositeDirection(planned, next)) {
      return;
    }

    nextDirectionRef.current = next;
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      const { key } = event;
      if (!(key in DIRECTIONS)) {
        if (key === " " && status === "running") {
          event.preventDefault();
          setStatus("paused");
        } else if (key === " " && status === "paused") {
          event.preventDefault();
          setStatus("running");
        }
        return;
      }

      event.preventDefault();

      if (status === "idle" || status === "over") {
        resetGame(key);
        return;
      }

      if (status !== "paused") {
        queueDirection(key);
      }
    },
    [queueDirection, resetGame, status],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleDirectionButton = useCallback(
    (directionKey) => {
      if (status === "paused") {
        return;
      }

      if (status === "idle" || status === "over") {
        resetGame(directionKey);
        return;
      }

      queueDirection(directionKey);
    },
    [queueDirection, resetGame, status],
  );

  const handleTouchStart = useCallback((event) => {
    if (event.touches.length !== 1) {
      return;
    }
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback(
    (event) => {
      if (!touchStartRef.current) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < 30) {
        return;
      }

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX > absY) {
        handleDirectionButton(deltaX > 0 ? "ArrowRight" : "ArrowLeft");
      } else {
        handleDirectionButton(deltaY > 0 ? "ArrowDown" : "ArrowUp");
      }

      touchStartRef.current = null;
    },
    [handleDirectionButton],
  );

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  const togglePause = useCallback(() => {
    if (status === "running") {
      setStatus("paused");
    } else if (status === "paused") {
      setStatus("running");
    }
  }, [status]);

  const renderOverlay = () => {
    if (status === "running") {
      return null;
    }

    let title = "Tap or press Start";
    let message = "Use the arrow keys or swipe to guide the snake.";

    if (status === "paused") {
      title = "Paused";
      message = "Press resume or hit space to keep playing.";
    }

    if (status === "over") {
      title = "Game over";
      message = "Press restart to try again.";
    }

    if (status === "idle") {
      title = "Ready?";
      message = "Press start and collect glowing fruit.";
    }

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/85 text-center text-slate-700 backdrop-blur-sm">
        <p className="text-2xl font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">{message}</p>
        {status === "over" ? (
          <p className="text-sm font-semibold text-slate-700">Final score: {score}</p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen px-4 py-10 text-slate-900">
      {showSupportWidget && <SupportWidget />}

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
        <div className="w-full max-w-3xl space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-sky-50/80 to-emerald-50/60 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1 text-left">
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Snake</h1>
                <p className="text-sm text-slate-600">
                  Glide across the neon grid, scoop up glowing treats, and keep your tail from catching up.
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
                onClick={() => resetGame()}
                className="rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700"
              >
                {status === "idle" ? "Start" : "Restart"}
              </button>
              <button
                type="button"
                onClick={togglePause}
                disabled={status === "idle" || status === "over"}
                className="rounded-full border border-transparent bg-gradient-to-r from-emerald-100 via-green-100 to-blue-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700 shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "paused" ? "Resume" : "Pause"}
              </button>
              <span className="inline-flex items-center rounded-full border border-transparent bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-amber-700 shadow-sm">
                Arrow keys • Swipe • Tap controls
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-sky-50/80 to-rose-50/60 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-full max-w-xl" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                <div className="aspect-square w-full">
                  <div
                    className="grid h-full w-full gap-[3px] rounded-3xl bg-gradient-to-br from-slate-100 via-white to-slate-100 p-3 shadow-inner"
                    style={{
                      gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: BOARD_SIZE }).map((_, rowIndex) =>
                      Array.from({ length: BOARD_SIZE }).map((__, columnIndex) => {
                        const key = createCellKey(columnIndex, rowIndex);
                        const segmentIndex = snake.findIndex(
                          (segment) => segment.x === columnIndex && segment.y === rowIndex,
                        );
                        const isHead = segmentIndex === 0;
                        const isBody = segmentIndex > 0;
                        const isFood = food && food.x === columnIndex && food.y === rowIndex;

                        let cellClasses = "relative rounded-[10px] bg-white/60 transition";

                        if (isFood) {
                          cellClasses =
                            "relative rounded-[10px] border border-rose-200/80 bg-gradient-to-br from-rose-400 via-orange-400 to-amber-300 shadow-[0_10px_20px_rgba(244,114,182,0.28)]";
                        } else if (isHead) {
                          cellClasses =
                            "relative rounded-[10px] border border-emerald-400 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 shadow-[0_10px_20px_rgba(16,185,129,0.28)]";
                        } else if (isBody) {
                          cellClasses =
                            "relative rounded-[10px] border border-emerald-300/80 bg-gradient-to-br from-emerald-300 via-teal-400 to-emerald-500 shadow-[0_8px_16px_rgba(45,212,191,0.22)]";
                        }

                        return <div key={key} className={cellClasses} />;
                      }),
                    )}
                  </div>
                  {renderOverlay()}
                </div>
              </div>

              <div className="w-full max-w-sm sm:hidden">
                <div className="grid grid-cols-3 gap-3">
                  <div />
                  <button
                    type="button"
                    onClick={() => handleDirectionButton("ArrowUp")}
                    disabled={status === "paused"}
                    className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    ↑
                  </button>
                  <div />
                  <button
                    type="button"
                    onClick={() => handleDirectionButton("ArrowLeft")}
                    disabled={status === "paused"}
                    className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectionButton("ArrowDown")}
                    disabled={status === "paused"}
                    className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectionButton("ArrowRight")}
                    disabled={status === "paused"}
                    className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="w-full max-w-lg rounded-2xl border border-slate-200/70 bg-white/70 p-5 text-left shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">How to play</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px] text-xs">➤</span>
                    <span>Collect the glowing fruit to grow your snake and add 10 points to your score.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px] text-xs">➤</span>
                    <span>Guide the snake with the arrow keys, on-screen arrows, or by swiping on touch devices.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px] text-xs">➤</span>
                    <span>Avoid running into walls or your own tail to keep the neon flow alive.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <GameFooter
          gameName="Snake"
          creator="Gremlin Industries"
          moreInfo={{
            url: "https://en.wikipedia.org/wiki/Snake_(video_game_genre)",
            label: "Snake on Wikipedia",
          }}
          className="w-full max-w-md lg:max-w-xs lg:self-start"
        />
      </div>
    </div>
  );
}
