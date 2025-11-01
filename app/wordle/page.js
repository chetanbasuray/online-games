"use client";
import { useState, useEffect, useRef } from "react";
import Keyboard from "../components/keyboard";
import GameFooter from "../components/GameFooter";
import SupportWidget from "../components/SupportWidget";
import { isGamePlayable } from "../utils/gameAvailability";
import { WORDS } from "./words";

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const showSupportWidget = isGamePlayable("/wordle");

export default function WordlePage() {
  const [solution, setSolution] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [flippedTiles, setFlippedTiles] = useState([]);
  const [gameId, setGameId] = useState(0);
  const [gameState, setGameState] = useState("idle");
  const [message, setMessage] = useState("");
  const [letterStatus, setLetterStatus] = useState({});
  const flipTimeoutsRef = useRef([]);
  const resultTimeoutRef = useRef(null);
  const currentGameRef = useRef(0);
  const previousSolutionRef = useRef(null);

  const clearFlipTimeouts = () => {
    flipTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    flipTimeoutsRef.current = [];
  };

  const clearResultTimeout = () => {
    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = null;
    }
  };

  // Pick random word
  const pickNextSolution = () => {
    if (!WORDS || WORDS.length === 0) {
      return "";
    }

    if (WORDS.length === 1) {
      return WORDS[0];
    }

    let candidate = previousSolutionRef.current;
    while (candidate === previousSolutionRef.current) {
      candidate = WORDS[Math.floor(Math.random() * WORDS.length)];
    }

    return candidate;
  };

  const startNewGame = () => {
    clearFlipTimeouts();
    clearResultTimeout();
    const nextGameId = currentGameRef.current + 1;
    currentGameRef.current = nextGameId;
    setGameId(nextGameId);
    const word = pickNextSolution();
    if (!word) {
      previousSolutionRef.current = null;
      setSolution("");
      setGuesses([]);
      setCurrentGuess("");
      setFlippedTiles([]);
      setLetterStatus({});
      setMessage("No Wordle puzzles are available right now. Please try again later.");
      setGameState("idle");
      return;
    }

    const normalizedWord = word.toUpperCase();
    previousSolutionRef.current = normalizedWord;
    setSolution(normalizedWord);
    setGuesses([]);
    setCurrentGuess("");
    setFlippedTiles([]);
    setMessage("");
    setLetterStatus({});
    setGameState("in-progress");
  };

  useEffect(() => startNewGame(), []);

  useEffect(() => () => {
    clearFlipTimeouts();
    clearResultTimeout();
  }, []);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== "in-progress") return;
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) addLetter(key);
      else if (key === "BACKSPACE") removeLetter();
      else if (key === "ENTER") submitGuess();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGuess, guesses, gameState]);

  const addLetter = (letter) => {
    if (gameState !== "in-progress") return;
    if (currentGuess.length < WORD_LENGTH) setCurrentGuess((prev) => prev + letter);
  };
  const removeLetter = () => {
    if (gameState !== "in-progress") return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  const getGuessColors = (guess, solution) => {
    const result = Array(guess.length).fill("absent");
    const solutionLetters = solution.split("");
    const letterCount = {};
    solutionLetters.forEach((l) => (letterCount[l] = (letterCount[l] || 0) + 1));

    guess.split("").forEach((l, i) => {
      if (solutionLetters[i] === l) {
        result[i] = "correct";
        letterCount[l]--;
      }
    });
    guess.split("").forEach((l, i) => {
      if (result[i] === "correct") return;
      if (letterCount[l] > 0) {
        result[i] = "present";
        letterCount[l]--;
      }
    });
    return result;
  };

  const getTileColor = (letter, index, guess) => {
    if (!guess) return "border border-slate-300 bg-slate-50 text-slate-900";
    const colors = getGuessColors(guess, solution);
    switch (colors[index]) {
      case "correct":
        return "border-green-500 bg-green-500 text-white";
      case "present":
        return "border-amber-400 bg-amber-400 text-white";
      default:
        return "border-slate-400 bg-slate-400 text-white";
    }
  };

  const handleVirtualKey = (key) => {
    if (gameState !== "in-progress") return;
    if (key === "ENTER") {
      submitGuess();
      return;
    }
    if (key === "DELETE") {
      removeLetter();
      return;
    }
    addLetter(key);
  };

  const submitGuess = async () => {
    if (gameState !== "in-progress") return;
    const guessUpper = currentGuess.toUpperCase();
    if (guessUpper.length !== WORD_LENGTH) return;
    if (!solution) return;
    if (guesses.length >= MAX_GUESSES) return;
    if (!WORDS.includes(guessUpper)) {
      setMessage("Word not found!");
      const boardSelector = `[data-game-id="wordle-${gameId}"]`;
      const boardElement = typeof document !== "undefined" ? document.querySelector(boardSelector) : null;
      const rowDiv = boardElement?.querySelector(`.wordle-row:nth-child(${guesses.length + 1})`);
      if (rowDiv) rowDiv.classList.add("shake");
      setTimeout(() => {
        if (rowDiv) rowDiv.classList.remove("shake");
        setMessage("");
      }, 500);
      return;
    }

    const newGuesses = [...guesses, guessUpper];
    setGuesses(newGuesses);
    setCurrentGuess("");

    const newStatus = { ...letterStatus };
    guessUpper.split("").forEach((letter, i) => {
      if (solution[i] === letter) newStatus[letter] = "correct";
      else if (solution.includes(letter)) {
        if (newStatus[letter] !== "correct") newStatus[letter] = "present";
      } else {
        if (!newStatus[letter]) newStatus[letter] = "absent";
      }
    });
    setLetterStatus(newStatus);

    // Flip animation
    const rowIndex = newGuesses.length - 1;
    const activeGameId = currentGameRef.current;

    for (let i = 0; i < WORD_LENGTH; i++) {
      const timeoutId = setTimeout(() => {
        if (currentGameRef.current === activeGameId) {
          setFlippedTiles((prev) => [...prev, { row: rowIndex, col: i }]);
        }
        flipTimeoutsRef.current = flipTimeoutsRef.current.filter((id) => id !== timeoutId);
      }, i * 300);
      flipTimeoutsRef.current.push(timeoutId);
    }

    resultTimeoutRef.current = setTimeout(async () => {
      if (currentGameRef.current !== activeGameId) {
        resultTimeoutRef.current = null;
        return;
      }
      const colors = getGuessColors(guessUpper, solution);
      if (colors.every((c) => c === "correct")) {
        setMessage("🎉 You guessed it!");
        setGameState("won");
        const confettiModule = await import("canvas-confetti");
        confettiModule.default({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      } else if (newGuesses.length === MAX_GUESSES) {
        setMessage(`😞 The word was ${solution}`);
        setGameState("lost");
      }
      resultTimeoutRef.current = null;
    }, WORD_LENGTH * 300 + 50);
  };

  const guessesRemaining = Math.max(0, MAX_GUESSES - guesses.length);
  const statusLabels = {
    idle: "Loading",
    "in-progress": "In progress",
    won: "Solved",
    lost: "Ended",
  };
  const gameStatus = statusLabels[gameState] || "In progress";
  const isGameActive = gameState === "in-progress";
  const hasSolution = solution.length === WORD_LENGTH;
  const isSubmitDisabled = !isGameActive || currentGuess.length !== WORD_LENGTH;
  const isDeleteDisabled = !isGameActive || currentGuess.length === 0;
  const keyboardDisabled = !isGameActive || !hasSolution;
  const boardDataId = `wordle-${gameId}`;

  return (
    <div className="min-h-screen px-4 py-10 text-slate-900">
      {showSupportWidget && <SupportWidget />}

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
        <div className="w-full max-w-3xl space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-sky-50/80 to-emerald-50/60 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Wordle</h1>
              <p className="text-sm text-slate-600">
                Guess the hidden five-letter word in six tries. After each guess, the tile colors show how close you are.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
              <div className="rounded-md border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 px-3 py-2 shadow-sm">
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Guesses Left</p>
                <p className="text-lg font-semibold text-slate-900">{guessesRemaining}</p>
              </div>
              <div className="rounded-md border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 px-3 py-2 shadow-sm">
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Word Length</p>
                <p className="text-lg font-semibold text-slate-900">{WORD_LENGTH}</p>
              </div>
              <div className="rounded-md border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 px-3 py-2 shadow-sm">
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Status</p>
                <p className="text-lg font-semibold text-slate-900">{gameStatus}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-sky-50/80 to-rose-50/60 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col items-center gap-6">
              <div
                key={gameId}
                className="wordle-board"
                role="grid"
                aria-label="Wordle board"
                data-game-id={boardDataId}
              >
                {Array.from({ length: MAX_GUESSES }).map((_, row) => {
                  const guess = guesses[row] || (row === guesses.length ? currentGuess : "");
                  const isCurrentRow = row === guesses.length;

                  return (
                    <div key={row} className="wordle-row" role="row">
                      {Array.from({ length: WORD_LENGTH }).map((_, col) => {
                        const letter = guess[col] || "";
                        const bgColor =
                          !isCurrentRow && guess
                            ? getTileColor(letter, col, guess)
                            : "border border-slate-300/70 bg-gradient-to-br from-white via-blue-50 to-white text-slate-900";
                        const flipped = flippedTiles.some((t) => t.row === row && t.col === col);
                        const tileClasses = [
                          "tile wordle-tile flex items-center justify-center rounded-lg font-bold",
                          bgColor,
                          flipped ? "tile--flipped" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <div
                            key={col}
                            className={tileClasses}
                            style={{ "--flip-delay": `${col * 0.3}s` }}
                            role="gridcell"
                            aria-label={letter ? `Letter ${letter}` : "Empty"}
                          >
                            {letter}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <Keyboard onKeyPress={handleVirtualKey} letterStatus={letterStatus} disabled={keyboardDisabled} />

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={submitGuess}
                  className="rounded-full border border-transparent bg-gradient-to-r from-blue-100 via-sky-100 to-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-blue-800 shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
                  type="button"
                  disabled={isSubmitDisabled}
                >
                  Submit Guess
                </button>
                <button
                  onClick={removeLetter}
                  className="rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-300 disabled:hover:bg-white/80 disabled:hover:text-slate-600"
                  type="button"
                  disabled={isDeleteDisabled}
                >
                  Delete Letter
                </button>
                <button
                  onClick={startNewGame}
                  className="rounded-full border border-transparent bg-gradient-to-r from-emerald-100 via-green-100 to-blue-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700 shadow-sm transition hover:brightness-110"
                  type="button"
                >
                  New Game
                </button>
              </div>

              {message && (
                <p className="text-center text-sm font-semibold text-slate-600" role="status" aria-live="polite">
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
        <GameFooter
          gameName="Wordle"
          creator="Josh Wardle"
          moreInfo={{
            url: "https://www.nytimes.com/games/wordle/index.html",
            label: "The New York Times Wordle page",
          }}
          className="w-full max-w-md lg:max-w-xs lg:self-start"
        />
      </div>
    </div>
  );
}
