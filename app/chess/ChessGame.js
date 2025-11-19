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
  STOCKFISH_CDN_URLS,
  adjustRating,
  difficultyById,
  fenToBoard,
  moveDisplayList,
  boardOrientation,
  getSquareName,
  ratingToDifficultyId,
  sanitizeMovesList,
  capturedPieces,
  materialBalance,
  summarizeHistory,
} from "./utils";

const showSupportWidget = isGamePlayable("/chess");

const loadStockfishWorker = async () => {
  const attempts = [];
  for (const scriptUrl of STOCKFISH_CDN_URLS) {
    try {
      const response = await fetch(scriptUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const source = await response.text();
      const blob = new Blob([source], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      return { worker, url, source: "cdn", scriptUrl };
    } catch (error) {
      console.warn(`Failed to load Stockfish from ${scriptUrl}`, error);
      attempts.push({ url: scriptUrl, message: error instanceof Error ? error.message : String(error) });
    }
  }

  console.warn("Falling back to bundled engine after CDN attempts", attempts);

  try {
    const worker = new Worker(new URL("./stockfish.worker.js", import.meta.url), {
      type: "module",
    });
    return { worker, url: null, source: "local" };
  } catch (error) {
    const failure = new Error("Unable to initialise any chess engine");
    failure.cause = { attempts, error };
    throw failure;
  }
};

const historyEntry = (result, difficultyId) => ({
  result,
  difficultyId,
  timestamp: new Date().toISOString(),
});

export default function ChessGame() {
  const workerRef = useRef(null);
  const workerUrlRef = useRef(null);
  const requestQueueRef = useRef([]);
  const moveHistoryRef = useRef([]);
  const pendingBlackOpeningRef = useRef(false);
  const [position, setPosition] = useState({
    fen: INITIAL_FEN,
    board: fenToBoard(INITIAL_FEN),
    legalMoves: [],
    inCheck: false,
    turn: "w",
  });
  const [engineReady, setEngineReady] = useState(false);
  const [status, setStatus] = useState("Preparing chess engine...");
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [promotionOptions, setPromotionOptions] = useState(null);
  const [result, setResult] = useState(null);
  const [difficultyId, setDifficultyId] = useState(DEFAULT_DIFFICULTY_ID);
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [rating, setRating] = useState(DEFAULT_RATING);
  const [savedHistory, setSavedHistory] = useState([]);
  const [computerThinking, setComputerThinking] = useState(false);
  const [lastEngineMove, setLastEngineMove] = useState(null);
  const [engineSource, setEngineSource] = useState("loading");
  const [playerColor, setPlayerColor] = useState("w");

  const isPlayerTurn = position.turn === playerColor && !computerThinking && !result;

  const movesForDisplay = useMemo(
    () => moveDisplayList(moveHistoryRef.current, playerColor),
    [playerColor, position.fen, result]
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
        color: state.color ?? "w",
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
      color: playerColor,
    });
  }, [autoAdjust, difficultyId, persistProgress, playerColor, rating, savedHistory]);

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
        color: playerColor,
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
    [
      autoAdjust,
      currentDifficulty.minRating,
      difficultyId,
      persistProgress,
      playerColor,
      rating,
      savedHistory,
    ]
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
      let persistedColor = "w";
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
            if (parsed.color === "b" || parsed.color === "w") {
              persistedColor = parsed.color;
              setPlayerColor(parsed.color);
            }
          } catch {
            // ignore corrupted saves
          }
        }

        const { worker, url, source } = await loadStockfishWorker();
        if (!active) {
          worker.terminate();
          if (url) {
            URL.revokeObjectURL(url);
          }
          return;
        }
        workerRef.current = worker;
        workerUrlRef.current = url;
        setEngineSource(source ?? "cdn");
        if (source === "local") {
          setStatus("Loading offline engine...");
        }
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
        const readyMessage =
          source === "local"
            ? "Your move! Offline engine is ready."
            : "Your move! Select a piece to begin.";
        if (persistedColor === "b") {
          pendingBlackOpeningRef.current = true;
          setStatus("Stockfish is making the opening move...");
        } else {
          setStatus(readyMessage);
        }
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

  const enginePlayMove = useCallback(
    async (colorOverride) => {
      if (!workerRef.current) return;
      setComputerThinking(true);
      setStatus("Stockfish is thinking...");
      const { depth } = currentDifficulty;
      const best = await enqueueCommand(`go depth ${depth}`, "bestmove").catch(() => null);
      setComputerThinking(false);
      const activeColor = colorOverride === "b" || colorOverride === "w" ? colorOverride : playerColor;
      if (!best || best === "(none)") {
        const info = await updatePositionState(moveHistoryRef.current);
        if (info.legalMoves.length === 0) {
          endGame(info.inCheck ? "win" : "draw");
        } else {
          setStatus(activeColor === "w" ? "Your move as White." : "Your move as Black.");
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
      setStatus(activeColor === "w" ? "Your move as White." : "Your move as Black.");
    },
    [currentDifficulty, endGame, enqueueCommand, playerColor, updatePositionState]
  );

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
    if (!engineReady) return;
    if (!pendingBlackOpeningRef.current) return;
    if (!workerRef.current) return;
    pendingBlackOpeningRef.current = false;
    setStatus("Stockfish is making the opening move...");
    void enginePlayMove("b");
  }, [enginePlayMove, engineReady]);

  useEffect(() => {
    if (!autoAdjust) return;
    const suggested = ratingToDifficultyId(rating);
    setDifficultyId(suggested);
  }, [autoAdjust, rating]);

  const startNewGame = useCallback(
    async (color = playerColor) => {
      if (!workerRef.current) return;
      setResult(null);
      setComputerThinking(false);
      setSelectedSquare(null);
      setPromotionOptions(null);
      setLastEngineMove(null);
      pendingBlackOpeningRef.current = false;
      moveHistoryRef.current = [];
      workerRef.current.postMessage("ucinewgame");
      await waitReady();
      await updatePositionState([]);
      const label = color === "b" ? "Black" : "White";
      if (color === "b") {
        setStatus("Stockfish is making the opening move...");
        await enginePlayMove("b");
      } else {
        setStatus(`New game! You're playing ${label}.`);
      }
    },
    [enginePlayMove, playerColor, updatePositionState, waitReady]
  );

  const handleColorChange = useCallback(
    async (nextColor) => {
      if (nextColor === playerColor) return;
      setPlayerColor(nextColor);
      persistProgress({
        rating,
        history: savedHistory,
        autoAdjust,
        difficultyId,
        color: nextColor,
      });
      if (engineReady) {
        await startNewGame(nextColor);
      }
    },
    [autoAdjust, difficultyId, engineReady, persistProgress, playerColor, rating, savedHistory, startNewGame]
  );

  const handleAutoAdjustToggle = useCallback(() => {
    setAutoAdjust((previous) => {
      const next = !previous;
      const suggested = ratingToDifficultyId(rating);
      if (next) {
        setDifficultyId(suggested);
      }
      persistProgress({
        rating,
        history: savedHistory,
        autoAdjust: next,
        difficultyId: next ? suggested : difficultyId,
        color: playerColor,
      });
      return next;
    });
  }, [difficultyId, persistProgress, playerColor, rating, savedHistory]);

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

  const orientation = useMemo(() => boardOrientation(playerColor), [playerColor]);

  const coordinateFiles = useMemo(
    () => orientation.fileIndexes.map((fileIndex) => String.fromCharCode(97 + fileIndex)),
    [orientation.fileIndexes]
  );

  const coordinateRanks = useMemo(
    () => orientation.rankIndexes.map((rankIndex) => 8 - rankIndex),
    [orientation.rankIndexes]
  );

  const boardSquares = useMemo(() => {
    return orientation.rankIndexes.map((rankIndex) =>
      orientation.fileIndexes.map((fileIndex) => {
        const square = getSquareName(fileIndex, rankIndex);
        const piece = position.board[rankIndex]?.[fileIndex] ?? null;
        const isLight = (fileIndex + rankIndex) % 2 === 0;
        const isSelected = selectedSquare === square;
        const isTarget = legalTargets.has(square);
        const isLastMoveSquare =
          lastEngineMove &&
          (lastEngineMove.startsWith(square) || lastEngineMove.slice(2, 4) === square);
        return {
          key: square,
          square,
          piece,
          isLight,
          isSelected,
          isTarget,
          isLastMoveSquare,
        };
      })
    );
  }, [lastEngineMove, legalTargets, orientation.fileIndexes, orientation.rankIndexes, position.board, selectedSquare]);

  const computerLabel = useMemo(() => {
    const label = currentDifficulty.label;
    return autoAdjust ? `${label} (auto)` : label;
  }, [autoAdjust, currentDifficulty.label]);

  const playerColorLabel = useMemo(() => (playerColor === "w" ? "White" : "Black"), [playerColor]);

  const engineStatus = useMemo(() => {
    if (engineSource === "local") return "Offline engine";
    if (engineSource === "loading") return "Loading engine";
    return "Stockfish CDN";
  }, [engineSource]);

  const engineStatusDescription = useMemo(() => {
    if (engineSource === "local") {
      return "Using the bundled offline worker until the CDN comes back online.";
    }
    if (engineSource === "loading") {
      return "Connecting to Stockfish. This usually takes a second.";
    }
    return "Live Stockfish worker streamed from the CDN.";
  }, [engineSource]);

  const statusTone = useMemo(() => {
    if (result === "win") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (result === "loss") return "border-rose-200 bg-rose-50 text-rose-700";
    if (result === "draw") return "border-amber-200 bg-amber-50 text-amber-700";
    if (computerThinking) return "border-sky-200 bg-sky-50 text-sky-700";
    return "border-slate-200 bg-slate-50 text-slate-700";
  }, [computerThinking, result]);

  const movePalette = useMemo(
    () => ({
      player: playerColor === "w" ? "text-blue-700" : "text-emerald-600",
      engine: playerColor === "w" ? "text-rose-700" : "text-indigo-600",
    }),
    [playerColor]
  );

  const captures = useMemo(() => capturedPieces(position.board), [position.board]);
  const playerCaptures = useMemo(
    () => (playerColor === "w" ? captures.white : captures.black),
    [captures, playerColor]
  );
  const engineCaptures = useMemo(
    () => (playerColor === "w" ? captures.black : captures.white),
    [captures, playerColor]
  );

  const materialInfo = useMemo(() => materialBalance(captures, playerColor), [captures, playerColor]);
  const materialTone = useMemo(() => {
    if (materialInfo.advantage === "ahead") return "border-emerald-200 bg-emerald-50/80 text-emerald-800";
    if (materialInfo.advantage === "behind") return "border-rose-200 bg-rose-50/80 text-rose-800";
    return "border-slate-200 bg-white/70 text-slate-700";
  }, [materialInfo.advantage]);
  const materialDescription = useMemo(() => {
    if (materialInfo.advantage === "ahead") {
      return "You're up material—trade pieces or press the attack.";
    }
    if (materialInfo.advantage === "behind") {
      return "Stockfish has extra material. Hunt for counterplay.";
    }
    return "Material is level. Play the position you like.";
  }, [materialInfo.advantage]);
  const materialLabel = useMemo(() => {
    if (materialInfo.swing > 0) return `+${materialInfo.swing}`;
    if (materialInfo.swing < 0) return `${materialInfo.swing}`;
    return "0";
  }, [materialInfo.swing]);
  const materialProgress = useMemo(() => {
    const clamped = Math.max(-9, Math.min(9, materialInfo.swing));
    return ((clamped + 9) / 18) * 100;
  }, [materialInfo.swing]);

  const historyStats = useMemo(() => summarizeHistory(savedHistory), [savedHistory]);
  const streakLabel = useMemo(() => {
    const { currentStreak } = historyStats;
    if (!currentStreak.result || currentStreak.count === 0) return "No games yet";
    const label =
      currentStreak.result === "win"
        ? "Wins"
        : currentStreak.result === "loss"
        ? "Losses"
        : "Draws";
    return `${currentStreak.count} ${label}`;
  }, [historyStats]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 px-4 py-12">
      {showSupportWidget && <SupportWidget />}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-2 text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Stockfish training studio</span>
          <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">Immersive chess arena</h1>
          <p className="max-w-3xl self-center text-sm text-slate-600 sm:self-start sm:text-base">
            Pick a side, follow your momentum, and keep the engine in view with richer status cards, material insights, and a streamlined control board.
          </p>
        </header>
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_55px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Interactive board</p>
                <h2 className="text-2xl font-semibold text-slate-900">Play against Stockfish</h2>
                <p className="mt-1 max-w-xl text-sm text-slate-600">
                  The board now takes center stage while every control, stat, and insight lives in an expandable menu on the right.
                </p>
              </div>
              <div className="text-sm text-slate-600 sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Current session</p>
                <p className="text-base font-semibold text-slate-900">{computerLabel}</p>
                <p className="text-xs text-slate-500">You are playing as {playerColorLabel}.</p>
              </div>
            </div>
            <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
              <div className="flex-1">
                <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
                  <div
                    className={`w-full max-w-3xl rounded-2xl border px-4 py-3 text-sm shadow-inner ${statusTone}`}
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <p className="font-semibold">{status}</p>
                    {engineSource === "local" && (
                      <p className="mt-2 text-xs text-slate-600">
                        Stockfish CDN is unreachable, so the bundled engine is powering your game.
                      </p>
                    )}
                    {position.inCheck && !result && (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-600">Check! Protect your king.</p>
                    )}
                  </div>
                  <div className="relative mx-auto aspect-square w-full max-w-3xl sm:max-w-4xl xl:h-[720px] xl:max-w-[720px]">
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 flex justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {coordinateFiles.map((file) => (
                        <span key={file}>{file}</span>
                      ))}
                    </div>
                    <div className="pointer-events-none absolute inset-y-4 left-3 flex flex-col justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {coordinateRanks.map((rank) => (
                        <span key={rank}>{rank}</span>
                      ))}
                    </div>
                    <div className="grid h-full w-full grid-cols-8 overflow-hidden rounded-2xl border border-slate-200 shadow-[0_25px_45px_-30px_rgba(15,23,42,0.55)]">
                      {boardSquares.map((row) =>
                        row.map((square) => {
                          const { key, piece, isLight, isSelected, isTarget, isLastMoveSquare } = square;
                          const baseBg = isSelected
                            ? "bg-amber-200/80"
                            : isLastMoveSquare
                            ? "bg-emerald-200/70"
                            : isLight
                            ? "bg-slate-100/90"
                            : "bg-slate-500/40";
                          const ringClass = isSelected
                            ? "ring-2 ring-amber-400"
                            : isLastMoveSquare
                            ? "ring-2 ring-emerald-400/70"
                            : "";
                          const pieceTone = piece && piece === piece.toUpperCase() ? "text-slate-900" : "text-slate-700";
                          return (
                            <button
                              key={key}
                              type="button"
                              aria-label={key}
                              aria-pressed={isSelected}
                              className={`${baseBg} ${ringClass} relative flex items-center justify-center text-3xl font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
                              onClick={() => onSquareClick(key)}
                            >
                              {isTarget && (
                                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                  <span className="h-3 w-3 rounded-full bg-emerald-500/70 shadow" />
                                </span>
                              )}
                              {piece && <span className={`pointer-events-none text-4xl ${pieceTone}`}>{PIECES[piece] ?? ""}</span>}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <aside className="w-full xl:w-[360px] xl:shrink-0 xl:sticky xl:top-6">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-center shadow-inner">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Session menu</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">Expand to adjust the experience</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Every option now lives here so the game board stays centered. Open the sections you need.
                  </p>
                </div>
                <div className="mt-4 space-y-4">
                  <details open className="group rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                      Game setup
                      <svg
                        className="h-4 w-4 text-slate-400 transition group-open:-rotate-180"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <div className="mt-4 space-y-4 text-sm text-slate-600">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Choose side</p>
                          <p className="text-sm font-semibold text-slate-700">{playerColorLabel}</p>
                        </div>
                        <div className="inline-flex rounded-full bg-slate-100 p-1 shadow-inner">
                          {[
                            { id: "w", label: "White", icon: PIECES.P },
                            { id: "b", label: "Black", icon: PIECES.p },
                          ].map((option) => {
                            const isActive = option.id === playerColor;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                aria-pressed={isActive}
                                className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                                  isActive ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900"
                                }`}
                                onClick={() => void handleColorChange(option.id)}
                                disabled={!engineReady || computerThinking}
                              >
                                <span className="text-lg">{option.icon}</span>
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Switching colors flips the board, saves your preference, and starts a fresh game automatically.
                      </p>
                      <button
                        type="button"
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-700 shadow-sm transition ${
                          computerThinking ? "cursor-not-allowed opacity-60" : "hover:border-blue-300 hover:bg-blue-100"
                        }`}
                        onClick={() => void startNewGame()}
                        disabled={computerThinking}
                      >
                        Start new game
                      </button>
                    </div>
                  </details>
                  <details className="group rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                      Difficulty & rating
                      <svg
                        className="h-4 w-4 text-slate-400 transition group-open:-rotate-180"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <div className="mt-4 space-y-4 text-sm text-slate-600">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoAdjust}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                          autoAdjust ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                        onClick={handleAutoAdjustToggle}
                      >
                        <span>Auto adjust difficulty</span>
                        <span className={`inline-flex h-5 w-10 items-center rounded-full transition ${autoAdjust ? "bg-blue-500" : "bg-slate-400"}`}>
                          <span
                            className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-150 ${
                              autoAdjust ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </span>
                      </button>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Manual difficulty</label>
                        <select
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                          value={difficultyId}
                          onChange={(event) => {
                            const nextId = event.target.value;
                            setDifficultyId(nextId);
                            persistProgress({
                              rating,
                              history: savedHistory,
                              autoAdjust,
                              difficultyId: nextId,
                              color: playerColor,
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
                        <p className="mt-2 text-xs text-slate-500">
                          {autoAdjust
                            ? "Auto mode picks a level after each result."
                            : "Choose a level to stick with manual control."}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-100"
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
                            color: playerColor,
                          });
                        }}
                      >
                        Reset rating
                      </button>
                    </div>
                  </details>
                  <details className="group rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                      Captured material
                      <svg
                        className="h-4 w-4 text-slate-400 transition group-open:-rotate-180"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div>
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                          You ({playerColorLabel})
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-2xl text-slate-700">
                          {playerCaptures.length === 0 ? (
                            <span className="text-xs text-slate-400">None captured yet</span>
                          ) : (
                            playerCaptures.map((piece, index) => (
                              <span
                                key={`player-capture-${piece}-${index}`}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
                              >
                                {PIECES[piece] ?? piece}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Stockfish</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-2xl text-slate-700">
                          {engineCaptures.length === 0 ? (
                            <span className="text-xs text-slate-400">No material lost</span>
                          ) : (
                            engineCaptures.map((piece, index) => (
                              <span
                                key={`engine-capture-${piece}-${index}`}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
                              >
                                {PIECES[piece] ?? piece}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                  <details className="group rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                      Live insights
                      <svg
                        className="h-4 w-4 text-slate-400 transition group-open:-rotate-180"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <div className="mt-4 space-y-4 text-sm text-slate-600">
                      <div className={`rounded-2xl border p-4 shadow-inner ${materialTone}`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em]">Material balance</p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <p className="text-3xl font-semibold">{materialLabel}</p>
                          <span className="text-xs font-semibold uppercase tracking-[0.3em]">
                            {materialInfo.advantage === "ahead"
                              ? "In your favor"
                              : materialInfo.advantage === "behind"
                              ? "Stockfish ahead"
                              : "Level"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs">{materialDescription}</p>
                        <div className="mt-3 h-2 w-full rounded-full bg-white/50">
                          <span
                            className="block h-full rounded-full bg-slate-900/60"
                            style={{ width: `${materialProgress}%` }}
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Engine channel</p>
                        <p className="text-sm font-semibold text-slate-900">{engineStatus}</p>
                        <p className="mt-2 text-xs text-slate-500">{engineStatusDescription}</p>
                        <div className="mt-4 flex flex-wrap gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                            <span className={`h-2 w-2 rounded-full ${computerThinking ? "animate-pulse bg-sky-500" : "bg-emerald-500"}`} />
                            {computerThinking ? "Engine thinking" : "Engine ready"}
                          </span>
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{computerLabel}</span>
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{playerColorLabel}</span>
                        </div>
                      </div>
                    </div>
                  </details>
                  <details className="group rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                      Move list
                      <svg
                        className="h-4 w-4 text-slate-400 transition group-open:-rotate-180"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <ol className="mt-4 max-h-60 space-y-2 overflow-y-auto pr-1 text-sm text-slate-600">
                      {movesForDisplay.length === 0 && <li className="text-xs text-slate-400">No moves yet. Make your first move!</li>}
                      {movesForDisplay.map((move) => (
                        <li
                          key={move.id}
                          className="grid grid-cols-[auto,1fr] items-center gap-3 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 shadow-sm"
                        >
                          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">#{move.moveNumber}</span>
                          <span className={`text-sm font-medium ${move.isPlayerMove ? movePalette.player : movePalette.engine}`}>
                            {move.label ?? move.id}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </details>
                  <details className="group rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                      History & progress
                      <svg
                        className="h-4 w-4 text-slate-400 transition group-open:-rotate-180"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <div className="mt-4 space-y-4 text-sm text-slate-600">
                      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Rating estimate</p>
                            <p className="text-4xl font-semibold text-slate-900">{rating}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Current level</p>
                            <p className="text-sm font-semibold text-slate-700">{currentDifficulty.label}</p>
                          </div>
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 text-center">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Games</p>
                            <p className="text-2xl font-semibold text-slate-900">{historyStats.total}</p>
                            <p className="text-[0.6rem] text-slate-500">Last 30 tracked</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 text-center">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Win rate</p>
                            <p className="text-2xl font-semibold text-slate-900">{historyStats.winRate}%</p>
                            <p className="text-[0.6rem] text-slate-500">Wins + draws/2</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 text-center">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Streak</p>
                            <p className="text-2xl font-semibold text-slate-900">{historyStats.currentStreak.count || 0}</p>
                            <p className="text-[0.6rem] text-slate-500">{streakLabel}</p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em]">Wins</p>
                            <p className="text-lg font-semibold text-emerald-700">{historyStats.wins}</p>
                          </div>
                          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-3 py-2">
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em]">Draws</p>
                            <p className="text-lg font-semibold text-amber-700">{historyStats.draws}</p>
                          </div>
                          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-3 py-2">
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em]">Losses</p>
                            <p className="text-lg font-semibold text-rose-700">{historyStats.losses}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Recent results</h3>
                        <ul className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1 text-sm text-slate-600">
                          {savedHistory.length === 0 && <li className="text-xs text-slate-400">Play games to build your track record.</li>}
                          {savedHistory.map((item) => {
                            const level = difficultyById.get(item.difficultyId);
                            const label = level ? level.label : item.difficultyId;
                            const date = new Date(item.timestamp);
                            const outcomeTone =
                              item.result === "win" ? "text-emerald-600" : item.result === "loss" ? "text-rose-600" : "text-amber-600";
                            return (
                              <li
                                key={`${item.timestamp}-${item.difficultyId}`}
                                className="flex flex-col rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 shadow-sm"
                              >
                                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{date.toLocaleString()}</span>
                                <span className={`font-medium ${outcomeTone}`}>
                                  {item.result === "draw" ? "Draw" : item.result === "win" ? "Win" : "Loss"} vs {label}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <p className="text-xs text-slate-500">
                        Need to tweak opponents or reset your rating? Use the expandable session menu to change colors, difficulties, or wipe progress without leaving the board.
                      </p>
                    </div>
                  </details>
                </div>
              </aside>
            </div>
            <GameFooter>
              Challenge Stockfish at tuned levels ranging from training wheels to tournament sharp. Your progress is saved locally so
              you can return to the difficulty that fits your groove.
            </GameFooter>
          </div>
        </section>

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
