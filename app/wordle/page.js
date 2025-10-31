"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FloatingBubbles from "../components/FloatingBubbles";
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
    if (!guess) return "bg-slate-900/60 border border-white/10 text-white/80";
    const colors = getGuessColors(guess, solution);
    switch (colors[index]) {
      case "correct":
        return "bg-emerald-500/90 text-white border border-emerald-200/60 glow-correct";
      case "present":
        return "bg-amber-400/90 text-white border border-amber-200/60 glow-present";
      default:
        return "bg-slate-700/70 text-white/70 border border-white/10";
    }
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

  return (
    <div className="cosmic-page">
      <FloatingBubbles count={10} area="full" zIndex={1} />
      {showSupportWidget && <SupportWidget />}

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-12 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="cosmic-panel flex w-full max-w-4xl flex-col items-center gap-8 px-8 py-12 lg:max-w-3xl"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="cosmic-heading text-4xl font-bold"
          >
            Wordle
          </motion.h1>

        <p className="text-center text-sm uppercase tracking-[0.6em] text-white/60">
          Decode the daily word in six stellar guesses
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-rows-6 gap-3"
        >
          {Array.from({ length: MAX_GUESSES }).map((_, row) => {
            const guess = guesses[row] || (row === guesses.length ? currentGuess : "");
            const isCurrentRow = row === guesses.length;
            return (
              <div key={row} className="grid-row flex flex-wrap justify-center gap-3">
                {Array.from({ length: WORD_LENGTH }).map((_, col) => {
                  const letter = guess[col] || "";
                  const bgColor =
                    !isCurrentRow && guess
                      ? getTileColor(letter, col, guess)
                      : "bg-slate-900/60 border border-white/10 text-white/80";
                  const flipped = flippedTiles.some((t) => t.row === row && t.col === col);

                  return (
                    <motion.div
                      key={col}
                      className={`tile flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-bold sm:h-12 sm:w-12 ${bgColor} ${
                        flipped ? "flipped" : ""
                      }`}
                      style={{ transitionDelay: `${col * 300}ms` }}
                      animate={!isCurrentRow && guess ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {letter}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </motion.div>

        <Keyboard guessedLetters={Object.keys(letterStatus)} onKeyPress={addLetter} letterStatus={letterStatus} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <button
            onClick={submitGuess}
            className="cosmic-pill px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white/80"
          >
            Enter
          </button>
          <button
            onClick={removeLetter}
            className="cosmic-pill px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white/80"
          >
            Backspace
          </button>
          {isWin && (
            <button
              onClick={startNewGame}
              className="cosmic-pill px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white/80"
            >
              New Game
            </button>
          )}
        </motion.div>

        {message && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-base font-semibold text-white/80"
          >
            {message}
          </motion.p>
        )}
        </motion.div>
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
