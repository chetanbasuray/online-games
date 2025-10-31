"use client";
import { useState, useEffect } from "react";
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
  const [isWin, setIsWin] = useState(false);
  const [message, setMessage] = useState("");
  const [letterStatus, setLetterStatus] = useState({});

  // Pick random word
  const startNewGame = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setSolution(word);
    setGuesses([]);
    setCurrentGuess("");
    setFlippedTiles([]);
    setIsWin(false);
    setMessage("");
    setLetterStatus({});
  };

  useEffect(() => startNewGame(), []);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isWin) return;
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) addLetter(key);
      else if (key === "BACKSPACE") removeLetter();
      else if (key === "ENTER") submitGuess();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGuess, guesses, isWin]);

  const addLetter = (letter) => {
    if (currentGuess.length < WORD_LENGTH) setCurrentGuess((prev) => prev + letter);
  };
  const removeLetter = () => setCurrentGuess((prev) => prev.slice(0, -1));

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
    if (isWin) return;
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
    const guessUpper = currentGuess.toUpperCase();
    if (guessUpper.length !== WORD_LENGTH) return;
    if (!WORDS.includes(guessUpper)) {
      setMessage("Word not found!");
      const rowDiv = document.querySelector(`.grid > div:nth-child(${guesses.length + 1})`);
      if (rowDiv) rowDiv.classList.add("shake");
      setTimeout(() => { if (rowDiv) rowDiv.classList.remove("shake"); setMessage(""); }, 500);
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
    for (let i = 0; i < WORD_LENGTH; i++) {
      setTimeout(() => setFlippedTiles((prev) => [...prev, { row: guesses.length, col: i }]), i * 300);
    }

    setTimeout(async () => {
      const colors = getGuessColors(guessUpper, solution);
      if (colors.every((c) => c === "correct")) {
        setIsWin(true);
        setMessage("🎉 You guessed it!");
        const confettiModule = await import("canvas-confetti");
        confettiModule.default({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      } else if (newGuesses.length === MAX_GUESSES) {
        setMessage(`😞 The word was ${solution}`);
      }
    }, WORD_LENGTH * 300 + 50);
  };

  const guessesRemaining = Math.max(0, MAX_GUESSES - guesses.length);
  const gameStatus = isWin
    ? "Solved"
    : guesses.length === MAX_GUESSES
      ? "Ended"
      : "In progress";

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
              <div className="wordle-board" role="grid" aria-label="Wordle board">
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

              <Keyboard onKeyPress={handleVirtualKey} letterStatus={letterStatus} />

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={submitGuess}
                  className="rounded-full border border-transparent bg-gradient-to-r from-blue-100 via-sky-100 to-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-blue-800 shadow-sm transition hover:brightness-110"
                  type="button"
                >
                  Submit Guess
                </button>
                <button
                  onClick={removeLetter}
                  className="rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700"
                  type="button"
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
