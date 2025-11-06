"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import GameFooter from "../components/GameFooter";
import SupportWidget from "../components/SupportWidget";
import { isGamePlayable } from "../utils/gameAvailability";
import {
  DIFFICULTIES,
  PIECES,
  INITIAL_FEN,
  DEFAULT_RATING,
  DEFAULT_DIFFICULTY_ID,
  LOCAL_STORAGE_KEY,
  adjustRating,
  difficultyById,
  fenToBoard,
  ratingToDifficultyId,
  sanitizeMovesList,
} from "./utils";

const PLAYER_COLOR = "w";
const STOCKFISH_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/stockfish@16.1.0/stockfish.js";

const showSupportWidget = isGamePlayable("/chess");

const loadStockfishWorker = async () => {
  const response = await fetch(STOCKFISH_SCRIPT_URL);
  if (!response.ok) {
    throw new Error("Unable to fetch Stockfish script");
  }
  const source = await response.text();
  const blob = new Blob([source], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  return { worker, url };
};

const historyEntry = (result, difficultyId) => ({
  result,
  difficultyId,
  timestamp: new Date().toISOString(),
});

const bestMoveToAlgebraic = (move) => {
  if (!move || move === "(none)" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
    return null;
  }
  const from = move.slice(0, 2);
  const to = move.slice(2, 4);
  const promo = move.slice(4);
  return promo ? `${from} → ${to} (${promo.toUpperCase()})` : `${from} → ${to}`;
};

const moveDisplayList = (moves) =>
  moves.map((move, index) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const isPlayerMove = index % 2 === 0;
    const label = bestMoveToAlgebraic(move);
    return {
      id: `${index}-${move}`,
      moveNumber,
      label,
      isPlayerMove,
    };
  });

export default function ChessGame() {
  const workerRef = useRef(null);
  const workerUrlRef = useRef(null);
  const requestQueueRef = useRef([]);
  const moveHistoryRef = useRef([]);
  const [position, setPosition] = useState({
    fen: INITIAL_FEN,
    board: fenToBoard(INITIAL_FEN),
    legalMoves: [],
    inCheck: false,
    turn: "w",
  });
  const [engineReady, setEngineReady] = useState(false);
  const [status, setStatus] = useState("Loading Stockfish...");
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [promotionOptions, setPromotionOptions] = useState(null);
  const [result, setResult] = useState(null);
  const [difficultyId, setDifficultyId] = useState(DEFAULT_DIFFICULTY_ID);
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [rating, setRating] = useState(DEFAULT_RATING);
  const [savedHistory, setSavedHistory] = useState([]);
  const [computerThinking, setComputerThinking] = useState(false);
  const [lastEngineMove, setLastEngineMove] = useState(null);

  const isPlayerTurn = position.turn === PLAYER_COLOR && !computerThinking && !result;

  const movesForDisplay = useMemo(
    () => moveDisplayList(moveHistoryRef.current),
    [position.fen, result]
  );

  const currentDifficulty = difficultyById.get(difficultyId) ?? DIFFICULTIES[0];

  const persistProgress = useCallback(
    (state) => {
      if (typeof window === "undefined") return;
      const payload = JSON.stringify({
        rating: state.rating,
        history: state.history,
        autoAdjust: state.autoAdjust,
        difficultyId: state.difficultyId,
      });
      window.localStorage.setItem(LOCAL_STORAGE_KEY, payload);
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    persistProgress({
      rating,
      history: savedHistory,
      autoAdjust,
      difficultyId,
    });
  }, [autoAdjust, difficultyId, persistProgress, rating, savedHistory]);

  const enqueueCommand = useCallback((command, type) => {
    const worker = workerRef.current;
    if (!worker) return Promise.reject(new Error("Stockfish is not ready"));
    return new Promise((resolve, reject) => {
      requestQueueRef.current.push({
        type,
        resolve,
        reject,
        fen: null,
        legalMoves: null,
        inCheck: false,
      });
      worker.postMessage(command);
    });
  }, []);

  const waitReady = useCallback(() => enqueueCommand("isready", "ready"), [enqueueCommand]);

  const requestPositionInfo = useCallback(
    async (moves) => {
      const worker = workerRef.current;
      if (!worker) throw new Error("Stockfish not initialised");
      const cleanedMoves = sanitizeMovesList(moves);
      const movesString = cleanedMoves.length ? ` moves ${cleanedMoves.join(" ")}` : "";
      worker.postMessage(`position startpos${movesString}`);
      const info = await enqueueCommand("d", "d");
      const legalMoves = sanitizeMovesList(info.legalMoves ?? []);
      return { ...info, legalMoves, moves: cleanedMoves };
    },
    [enqueueCommand]
  );

  const updatePositionState = useCallback(
    async (moves) => {
      const info = await requestPositionInfo(moves);
      moveHistoryRef.current = info.moves;
      setPosition({
        fen: info.fen,
        board: fenToBoard(info.fen),
        legalMoves: info.legalMoves,
        inCheck: info.inCheck,
        turn: info.fen.split(" ")[1],
      });
      return info;
    },
    [requestPositionInfo]
  );

  const endGame = useCallback(
    (outcome) => {
      setResult(outcome);
      setComputerThinking(false);
      const entry = historyEntry(outcome, difficultyId);
      const updatedHistory = [entry, ...savedHistory].slice(0, 30);
      const opponentRating = currentDifficulty.minRating + 200;
      const newRating = autoAdjust
        ? Math.max(100, adjustRating(rating, opponentRating, outcome))
        : rating;
      setRating(newRating);
      setSavedHistory(updatedHistory);
      persistProgress({
        rating: newRating,
        history: updatedHistory,
        autoAdjust,
        difficultyId,
      });
      if (autoAdjust) {
        const suggested = ratingToDifficultyId(newRating);
        setDifficultyId(suggested);
      }
      if (outcome === "win") {
        setStatus("Checkmate! You defeated Stockfish.");
      } else if (outcome === "loss") {
        setStatus("Checkmate. Stockfish wins this round.");
      } else {
        setStatus("Drawn position reached.");
      }
    },
    [autoAdjust, currentDifficulty.minRating, difficultyId, persistProgress, rating, savedHistory]
  );

  const handleWorkerMessage = useCallback((event) => {
    const text = typeof event.data === "string" ? event.data : "";
    if (!requestQueueRef.current.length) {
      return;
    }
    const current = requestQueueRef.current[0];
    if (!current) return;

    if (current.type === "ready" && text.trim() === "readyok") {
      requestQueueRef.current.shift();
      current.resolve();
      return;
    }

    if (current.type === "uci" && text.trim() === "uciok") {
      requestQueueRef.current.shift();
      current.resolve();
      return;
    }

    if (current.type === "bestmove" && text.startsWith("bestmove")) {
      requestQueueRef.current.shift();
      const [, best] = text.split(" ");
      current.resolve(best);
      return;
    }

    if (current.type === "d") {
      if (text.startsWith("Fen:")) {
        current.fen = text.slice(4).trim();
      }
      if (text.startsWith("Checkers:")) {
        current.inCheck = text.slice(9).trim() !== "-";
      }
      if (text.startsWith("Legal moves:")) {
        const moves = text.slice(13).trim();
        current.legalMoves = moves ? moves.split(" ").filter(Boolean) : [];
        if (current.fen) {
          requestQueueRef.current.shift();
          current.resolve({
            fen: current.fen,
            legalMoves: current.legalMoves,
            inCheck: current.inCheck,
          });
        }
      }
      return;
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (typeof window === "undefined") return undefined;

    const initialise = async () => {
      let persistedDifficultyId = DEFAULT_DIFFICULTY_ID;
      try {
        const savedRaw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedRaw) {
          try {
            const parsed = JSON.parse(savedRaw);
            if (typeof parsed.rating === "number") {
              setRating(parsed.rating);
            }
            if (Array.isArray(parsed.history)) {
              setSavedHistory(parsed.history);
            }
            if (typeof parsed.autoAdjust === "boolean") {
              setAutoAdjust(parsed.autoAdjust);
            }
            if (typeof parsed.difficultyId === "string") {
              persistedDifficultyId = parsed.difficultyId;
              setDifficultyId(parsed.difficultyId);
            }
          } catch {
            // ignore corrupted saves
          }
        }

        const { worker, url } = await loadStockfishWorker();
        if (!active) {
          worker.terminate();
          URL.revokeObjectURL(url);
          return;
        }
        workerRef.current = worker;
        workerUrlRef.current = url;
        worker.addEventListener("message", handleWorkerMessage);

        const initialDifficulty = difficultyById.get(persistedDifficultyId) ?? DIFFICULTIES[0];

        worker.postMessage("uci");
        await waitReady();
        worker.postMessage(`setoption name Skill Level value ${initialDifficulty.skill}`);
        await waitReady();
        worker.postMessage("ucinewgame");
        await waitReady();
        await updatePositionState([]);
        setEngineReady(true);
        setStatus("Your move! Select a piece to begin.");
      } catch (error) {
        console.error(error);
        setStatus("Unable to load Stockfish. Please check your connection and refresh.");
      }
    };

    initialise();

    return () => {
      active = false;
      const worker = workerRef.current;
      if (worker) {
        worker.removeEventListener("message", handleWorkerMessage);
        worker.terminate();
      }
      if (workerUrlRef.current) {
        URL.revokeObjectURL(workerUrlRef.current);
      }
      workerRef.current = null;
      workerUrlRef.current = null;
      requestQueueRef.current = [];
    };
  }, [handleWorkerMessage, updatePositionState, waitReady]);

  useEffect(() => {
    if (!engineReady) return;
    const worker = workerRef.current;
    if (!worker) return;
    worker.postMessage(`setoption name Skill Level value ${currentDifficulty.skill}`);
    void waitReady().catch(() => {
      setStatus("Reconnecting to Stockfish...");
    });
  }, [currentDifficulty.skill, engineReady, waitReady]);

  useEffect(() => {
    if (!autoAdjust) return;
    const suggested = ratingToDifficultyId(rating);
    setDifficultyId(suggested);
  }, [autoAdjust, rating]);

  const resetGame = useCallback(async () => {
    if (!workerRef.current) return;
    setResult(null);
    setComputerThinking(false);
    setSelectedSquare(null);
    setPromotionOptions(null);
    moveHistoryRef.current = [];
    workerRef.current.postMessage("ucinewgame");
    await waitReady();
    const info = await updatePositionState([]);
    if (info.turn === "b") {
      await enginePlayMove();
    } else {
      setStatus("New game! You're playing White.");
    }
  }, [updatePositionState, waitReady]);

  const enginePlayMove = useCallback(async () => {
    if (!workerRef.current) return;
    setComputerThinking(true);
    setStatus("Stockfish is thinking...");
    const { depth } = currentDifficulty;
    const best = await enqueueCommand(`go depth ${depth}`, "bestmove").catch(() => null);
    setComputerThinking(false);
    if (!best || best === "(none)") {
      const info = await updatePositionState(moveHistoryRef.current);
      if (info.legalMoves.length === 0) {
        endGame(info.inCheck ? "win" : "draw");
      }
      return;
    }
    const updatedMoves = [...moveHistoryRef.current, best];
    setLastEngineMove(best);
    const info = await updatePositionState(updatedMoves);
    if (info.legalMoves.length === 0) {
      endGame(info.inCheck ? "loss" : "draw");
      return;
    }
    setStatus("Your move.");
  }, [currentDifficulty, endGame, enqueueCommand, updatePositionState]);

  const handlePlayerMove = useCallback(
    async (move) => {
      const updatedMoves = [...moveHistoryRef.current, move];
      const info = await updatePositionState(updatedMoves);
      setSelectedSquare(null);
      setPromotionOptions(null);
      setLastEngineMove(move);

      if (info.legalMoves.length === 0) {
        endGame(info.inCheck ? "win" : "draw");
        return;
      }

      await enginePlayMove();
    },
    [endGame, enginePlayMove, updatePositionState]
  );

  const onSquareClick = useCallback(
    (square) => {
      if (!engineReady || !isPlayerTurn) return;
      if (promotionOptions) {
        return;
      }
      const playerMoves = position.legalMoves.filter((move) => move.startsWith(square));
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      if (selectedSquare) {
        const matchingMoves = position.legalMoves.filter((move) => move.startsWith(selectedSquare) && move.slice(2, 4) === square);
        if (matchingMoves.length === 0) {
          if (playerMoves.length > 0) {
            setSelectedSquare(square);
          }
          return;
        }
        if (matchingMoves.length === 1 && matchingMoves[0].length === 4) {
          void handlePlayerMove(matchingMoves[0]);
          return;
        }
        if (matchingMoves.some((move) => move.length === 5)) {
          setPromotionOptions({
            source: selectedSquare,
            target: square,
            moves: matchingMoves,
          });
        }
        return;
      }

      if (playerMoves.length > 0) {
        setSelectedSquare(square);
      }
    },
    [engineReady, handlePlayerMove, isPlayerTurn, position.legalMoves, promotionOptions, selectedSquare]
  );

  const selectPromotion = useCallback(
    (piece) => {
      if (!promotionOptions) return;
      const match = promotionOptions.moves.find((move) => move.endsWith(piece));
      if (match) {
        void handlePlayerMove(match);
      }
      setPromotionOptions(null);
    },
    [handlePlayerMove, promotionOptions]
  );

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return new Set();
    const moves = position.legalMoves.filter((move) => move.startsWith(selectedSquare));
    return new Set(moves.map((move) => move.slice(2, 4)));
  }, [position.legalMoves, selectedSquare]);

  const boardSquares = useMemo(() => {
    const rows = [];
    for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
      const row = [];
      for (let fileIndex = 0; fileIndex < 8; fileIndex += 1) {
        const square = String.fromCharCode(97 + fileIndex) + (8 - rankIndex);
        const piece = position.board[rankIndex]?.[fileIndex] ?? null;
        const isLight = (fileIndex + rankIndex) % 2 === 0;
        const isSelected = selectedSquare === square;
        const isTarget = legalTargets.has(square);
        const isLastMoveSquare =
          lastEngineMove &&
          (lastEngineMove.startsWith(square) || lastEngineMove.slice(2, 4) === square);
        row.push({
          key: square,
          square,
          piece,
          isLight,
          isSelected,
          isTarget,
          isLastMoveSquare,
        });
      }
      rows.push(row);
    }
    return rows;
  }, [lastEngineMove, legalTargets, position.board, selectedSquare]);

  const computerLabel = useMemo(() => {
    const label = currentDifficulty.label;
    return autoAdjust ? `${label} (auto)` : label;
  }, [autoAdjust, currentDifficulty.label]);

  return (
    <div className="min-h-screen px-4 py-10">
      {showSupportWidget && <SupportWidget />}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 lg:flex-row">
        <div className="flex w-full flex-col gap-6 lg:w-2/3">
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur">
            <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
              <span className="font-semibold uppercase tracking-[0.3em] text-slate-700">Chess vs Stockfish</span>
              <span className="rounded-full bg-gradient-to-r from-blue-100 via-sky-100 to-emerald-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-blue-800">
                {computerLabel}
              </span>
            </div>
            <div className="aspect-square w-full max-w-xl self-center">
              <div className="grid h-full w-full grid-cols-8 overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
                {boardSquares.map((row) =>
                  row.map((square) => {
                    const { key, piece, isLight, isSelected, isTarget, isLastMoveSquare } = square;
                    const bg = isSelected
                      ? "bg-amber-200"
                      : isTarget
                      ? "bg-emerald-200/70"
                      : isLastMoveSquare
                      ? "bg-rose-200/70"
                      : isLight
                      ? "bg-slate-100/80"
                      : "bg-slate-300/60";
                    const pieceColor = piece && piece === piece.toUpperCase() ? "text-slate-900" : "text-slate-700";
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`${bg} relative flex items-center justify-center text-3xl font-medium transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2`}
                        onClick={() => onSquareClick(key)}
                      >
                        <span className="sr-only">{key}</span>
                        {isTarget && <span className="absolute h-3 w-3 rounded-full bg-emerald-500/70 z-10" />}
                        {piece && (
                          <span className={`pointer-events-none absolute inset-0 z-0 flex items-center justify-center text-4xl ${pieceColor}`}>
                            {PIECES[piece] ?? ""}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">{status}</p>
              <p>
                Rating estimate: <span className="font-semibold text-slate-800">{rating}</span>
              </p>
              {result && <p>Game result: {result === "draw" ? "Draw" : result === "win" ? "You win" : "Stockfish wins"}</p>}
              {position.inCheck && !result && (
                <p className="text-rose-600">Check! Defend your king.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Difficulty</p>
                <p className="text-sm font-semibold text-slate-700">{currentDifficulty.label}</p>
                <p className="text-xs text-slate-500">{currentDifficulty.description}</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                  <input
                    type="checkbox"
                    checked={autoAdjust}
                    onChange={(event) => {
                      const next = event.target.checked;
                      setAutoAdjust(next);
                      persistProgress({
                        rating,
                        history: savedHistory,
                        autoAdjust: next,
                        difficultyId: next ? ratingToDifficultyId(rating) : difficultyId,
                      });
                    }}
                  />
                  Auto adjust
                </label>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none"
                  value={difficultyId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setDifficultyId(nextId);
                    persistProgress({
                      rating,
                      history: savedHistory,
                      autoAdjust,
                      difficultyId: nextId,
                    });
                  }}
                  disabled={autoAdjust}
                >
                  {DIFFICULTIES.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100"
                onClick={() => void resetGame()}
              >
                New game
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
                onClick={() => {
                  const nextRating = DEFAULT_RATING;
                  setRating(nextRating);
                  const nextDifficulty = ratingToDifficultyId(nextRating);
                  setDifficultyId(nextDifficulty);
                  setSavedHistory([]);
                  persistProgress({
                    rating: nextRating,
                    history: [],
                    autoAdjust,
                    difficultyId: nextDifficulty,
                  });
                }}
              >
                Reset rating
              </button>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 lg:w-1/3">
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Move list</h2>
            <ol className="space-y-2 text-sm text-slate-600">
              {movesForDisplay.length === 0 && <li>No moves yet. Make your first move!</li>}
              {movesForDisplay.map((move) => (
                <li key={move.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{move.moveNumber}</span>
                  <span className={`text-sm ${move.isPlayerMove ? "text-blue-700" : "text-rose-700"}`}>
                    {move.label ?? move.id}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Recent results</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              {savedHistory.length === 0 && <li>Play games to build your track record.</li>}
              {savedHistory.map((item) => {
                const level = difficultyById.get(item.difficultyId);
                const label = level ? level.label : item.difficultyId;
                const date = new Date(item.timestamp);
                return (
                  <li key={`${item.timestamp}-${item.difficultyId}`} className="flex flex-col rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {date.toLocaleString()}
                    </span>
                    <span>
                      {item.result === "draw" ? "Draw" : item.result === "win" ? "Win" : "Loss"} vs {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <GameFooter>
            Challenge Stockfish at tuned levels ranging from training wheels to tournament sharp. Your progress is saved locally so
            you can return to the difficulty that fits your groove.
          </GameFooter>
        </div>
      </div>

      {promotionOptions && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-xl">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Choose promotion</h3>
            <div className="grid grid-cols-4 gap-3">
              {["q", "r", "b", "n"].map((piece) => (
                <button
                  key={piece}
                  type="button"
                  className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-3xl text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                  onClick={() => selectPromotion(piece)}
                >
                  {PIECES[piece.toUpperCase()]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
