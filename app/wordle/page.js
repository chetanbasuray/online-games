"use client";
import { useState, useEffect, useRef } from "react";
import { WORDS } from "./words";
import Keyboard from "../components/keyboard";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const confetti = dynamic(() => import("canvas-confetti"), { ssr: false });

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Wordle() {
  const [solution, setSolution] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [flippedTiles, setFlippedTiles] = useState([]);
  const [isWin, setIsWin] = useState(false);
  const [message, setMessage] = useState("");
  const [letterStatus, setLetterStatus] = useState({});
  const [floatingLetters, setFloatingLetters] = useState([]);
  const hasGeneratedLetters = useRef(false);

  // pick random word on mount
  useEffect(() => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setSolution(word);
  }, []);

  // generate subtle background floating letters once
  useEffect(() => {
    if (hasGeneratedLetters.current) return;
    const lettersArray = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 3 + Math.random() * 4,
      duration: 10 + Math.random() * 8,
      delay: Math.random() * 3,
    }));
    setFloatingLetters(lettersArray);
    hasGeneratedLetters.current = true;
  }, []);

  // physical keyboard
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
    const guessLetters = guess.split("");
    const letterCount = {};
    solutionLetters.forEach((l) => { letterCount[l] = (letterCount[l] || 0) + 1; });

    guessLetters.forEach((l, i) => {
      if (solutionLetters[i] === l) {
        result[i] = "correct";
        letterCount[l] -= 1;
      }
    });

    guessLetters.forEach((l, i) => {
      if (result[i] === "correct") return;
      if (letterCount[l] > 0) {
        result[i] = "present";
        letterCount[l] -= 1;
      }
    });

    return result;
  };

  const getTileColor = (letter, index, guess) => {
    if (!guess) return "bg-white border-gray-400 text-black";
    const colors = getGuessColors(guess, solution);
    switch (colors[index]) {
      case "correct": return "bg-green-600 text-white border-green-700";
      case "present": return "bg-yellow-400 text-white border-yellow-500";
      default: return "bg-gray-400 text-white border-gray-500";
    }
  };

  const submitGuess = () => {
    const guessUpper = currentGuess.toUpperCase();
    if (guessUpper.length !== WORD_LENGTH) return;

    if (!WORDS.includes(guessUpper)) {
      setMessage("Word not found!");
      const rowDiv = document.querySelector(`.grid > div:nth-child(${guesses.length + 1})`);
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

    for (let i = 0; i < WORD_LENGTH; i++) {
      setTimeout(() => {
        setFlippedTiles((prev) => [...prev, { row: guesses.length, col: i }]);
      }, i * 300);
    }

    if (guessUpper === solution) {
      setIsWin(true);
      setMessage("🎉 You guessed it!");
      setTimeout(() => {
        import("canvas-confetti").then((module) => {
          module.default({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        });
      }, WORD_LENGTH * 300);
    } else if (newGuesses.length === MAX_GUESSES) {
      setMessage(`😞 The word was ${solution}`);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* floating subtle letters */}
      {floatingLetters.map((f) => (
        <motion.div
          key={f.id}
          className="absolute text-white/15 font-bold select-none"
          style={{
            fontSize: `${f.size}vmin`,
            top: `${f.top}%`,
            left: `${f.left}%`,
          }}
          animate={{ y: ["0%", "-10%", "0%"] }}
          transition={{
            duration: f.duration,
            repeat: Infinity,
            delay: f.delay,
            ease: "easeInOut",
          }}
        >
          {f.letter}
        </motion.div>
      ))}

      {/* title */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl font-bold text-white mb-6 z-10"
      >
        Wordle
      </motion.h1>

      {/* grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="grid grid-rows-6 gap-2 z-10"
      >
        {Array.from({ length: MAX_GUESSES }).map((_, row) => {
          const guess = guesses[row] || (row === guesses.length ? currentGuess : "");
          const isCurrentRow = row === guesses.length;
          const isWinningRow = isWin && row === guesses.length - 1;

          return (
            <div key={row} className="flex gap-2 justify-center flex-wrap">
              {Array.from({ length: WORD_LENGTH }).map((_, col) => {
                const letter = guess[col] || "";
                const bgColor =
                  !isCurrentRow && guess
                    ? getTileColor(letter, col, guess)
                    : "bg-white border-gray-400 text-black";
                const flipped = flippedTiles.some((t) => t.row === row && t.col === col);

                return (
                  <motion.div
                    key={col}
                    className={`w-14 h-14 sm:w-12 sm:h-12 flex items-center justify-center text-2xl font-bold rounded border tile ${
                      flipped ? "flipped" : ""
                    } ${bgColor}`}
                    style={{ transitionDelay: `${col * 300}ms` }}
                    animate={isWinningRow ? { scale: [1, 1.2, 1] } : {}}
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

      {/* keyboard */}
      <Keyboard guessedLetters={Object.keys(letterStatus)} onKeyPress={addLetter} letterStatus={letterStatus} />

      {/* buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="mt-4 flex gap-2 z-10"
      >
        <button
          onClick={submitGuess}
          className="px-4 py-2 sm:px-3 sm:py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
        >
          Enter
        </button>
        <button
          onClick={removeLetter}
          className="px-4 py-2 sm:px-3 sm:py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition"
        >
          Backspace
        </button>
      </motion.div>

      {message && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 text-lg font-semibold text-white z-10"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
