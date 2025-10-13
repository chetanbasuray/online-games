"use client";
import { useState, useEffect } from "react";
import { WORDS } from "./words";
import Keyboard from "../components/keyboard";
import dynamic from "next/dynamic";

const confetti = dynamic(() => import("canvas-confetti"), { ssr: false });

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

export default function Wordle() {
  const [solution, setSolution] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [flippedTiles, setFlippedTiles] = useState([]);
  const [isWin, setIsWin] = useState(false);
  const [message, setMessage] = useState("");
  const [letterStatus, setLetterStatus] = useState({}); // for keyboard

  // Pick a random word on mount
  useEffect(() => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setSolution(word);
  }, []);

  // Physical keyboard
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

  // Helper for repeated letters
  const getGuessColors = (guess, solution) => {
    const result = Array(guess.length).fill("absent");
    const solutionLetters = solution.split("");
    const guessLetters = guess.split("");
    const letterCount = {};
    solutionLetters.forEach((l) => { letterCount[l] = (letterCount[l] || 0) + 1; });

    // 1️⃣ Green pass
    guessLetters.forEach((l, i) => {
      if (solutionLetters[i] === l) {
        result[i] = "correct";
        letterCount[l] -= 1;
      }
    });

    // 2️⃣ Yellow pass
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

    // Not in list → shake row
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

    // Update keyboard
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
      setTimeout(() => {
        setFlippedTiles((prev) => [...prev, { row: guesses.length, col: i }]);
      }, i * 300);
    }

    // Win / lose
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Wordle</h1>

      {/* Grid */}
      <div className="grid grid-rows-6 gap-2">
        {Array.from({ length: MAX_GUESSES }).map((_, row) => {
          const guess = guesses[row] || (row === guesses.length ? currentGuess : "");
          const isCurrentRow = row === guesses.length;

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
                  <div
                    key={col}
                    className={`w-14 h-14 sm:w-12 sm:h-12 flex items-center justify-center text-2xl font-bold rounded border tile ${
                      flipped ? "flipped" : ""
                    } ${bgColor}`}
                    style={{ transitionDelay: `${col * 300}ms` }}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Keyboard */}
      <Keyboard guessedLetters={Object.keys(letterStatus)} onKeyPress={addLetter} letterStatus={letterStatus} />

      {/* Enter / Backspace */}
      <div className="mt-4 flex gap-2">
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
      </div>

      {message && <p className="mt-6 text-lg font-semibold text-gray-900">{message}</p>}
    </div>
  );
}
