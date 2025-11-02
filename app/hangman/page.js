"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GameFooter from "../components/GameFooter";
import SupportWidget from "../components/SupportWidget";
import { isGamePlayable } from "../utils/gameAvailability";
import { HANGMAN_WORDS } from "./words";

const showSupportWidget = isGamePlayable("/hangman");

const EMPTY_SLOT = "   "; // figure spaces to keep emoji aligned

const HANGMAN_STAGES = [
  {
    art: [
      "🪵🪵🪵🪵🪵",
      "🪜   🪢",
      `🪜   ${EMPTY_SLOT}`,
      `🪜   ${EMPTY_SLOT}`,
      `🪜   ${EMPTY_SLOT}`,
      "🪨🪨🪨🪨🪨",
    ],
    mood: "😄",
    caption: "Fresh canvas! No misses yet.",
  },
  {
    art: [
      "🪵🪵🪵🪵🪵",
      "🪜   🪢",
      "🪜   🙂",
      `🪜   ${EMPTY_SLOT}`,
      `🪜   ${EMPTY_SLOT}`,
      "🪨🪨🪨🪨🪨",
    ],
    mood: "🙂",
    caption: "A gentle breeze rustles the rope…",
  },
  {
    art: [
      "🪵🪵🪵🪵🪵",
      "🪜   🪢",
      "🪜   😯",
      "🪜   │",
      `🪜   ${EMPTY_SLOT}`,
      "🪨🪨🪨🪨🪨",
    ],
    mood: "😯",
    caption: "Careful now—the torso is forming!",
  },
  {
    art: [
      "🪵🪵🪵🪵🪵",
      "🪜   🪢",
      "🪜   😟",
      "🪜  /│",
      `🪜   ${EMPTY_SLOT}`,
      "🪨🪨🪨🪨🪨",
    ],
    mood: "😟",
    caption: "One arm is out—guess wisely!",
  },
  {
    art: [
      "🪵🪵🪵🪵🪵",
      "🪜   🪢",
      "🪜   😣",
      "🪜  /│\\",
      `🪜   ${EMPTY_SLOT}`,
      "🪨🪨🪨🪨🪨",
    ],
    mood: "😣",
    caption: "Both arms flail for help!",
  },
  {
    art: [
      "🪵🪵🪵🪵🪵",
      "🪜   🪢",
      "🪜   😰",
      "🪜  /│\\",
      "🪜  /",
      "🪨🪨🪨🪨🪨",
    ],
    mood: "😰",
    caption: "A leg appears—time is running out!",
  },
  {
    art: [
      "🪵🪵🪵🪵🪵",
      "🪜   🪢",
      "🪜   💀",
      "🪜  /│\\",
      "🪜  / \\",
      "🪨🪨🪨🪨🪨",
    ],
    mood: "💀",
    caption: "Oh no! The hangman is complete.",
  },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_WRONG_GUESSES = HANGMAN_STAGES.length - 1;

const normalizeWord = (word) =>
  word
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s'-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const pickRandomWord = () => {
  if (!HANGMAN_WORDS || HANGMAN_WORDS.length === 0) {
    return "";
  }
  return HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
};

const getUniqueLetters = (word) => {
  const letters = new Set();
  word.split("").forEach((char) => {
    if (/[A-Z]/.test(char)) {
      letters.add(char);
    }
  });
  return letters;
};

const formatStage = (wrongGuesses) =>
  HANGMAN_STAGES[Math.min(wrongGuesses, HANGMAN_STAGES.length - 1)];

export default function HangmanPage() {
  const [mode, setMode] = useState("solo");
  const [gameState, setGameState] = useState("loading");
  const [secretWord, setSecretWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [message, setMessage] = useState("");
  const [customWordInput, setCustomWordInput] = useState("");
  const [showCustomWord, setShowCustomWord] = useState(false);

  const uniqueLetters = useMemo(
    () => getUniqueLetters(secretWord),
    [secretWord]
  );

  const wrongLetters = useMemo(
    () => guessedLetters.filter((letter) => !secretWord.includes(letter)),
    [guessedLetters, secretWord]
  );

  const guessesRemaining = MAX_WRONG_GUESSES - wrongGuesses;
  const currentStage = formatStage(wrongGuesses);

  const startSoloGame = () => {
    const randomWord = normalizeWord(pickRandomWord());
    if (!randomWord) {
      setSecretWord("");
      setGameState("idle");
      setMessage("No Hangman words are available right now. Please try again later.");
      return;
    }

    setSecretWord(randomWord);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameState("in-progress");
    setMessage("Guess the word before the hangman is complete!");
  };

  const resetForPassAndPlay = () => {
    setSecretWord("");
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameState("setup");
    setMessage("Enter a secret word for your friend to guess.");
    setCustomWordInput("");
    setShowCustomWord(false);
  };

  useEffect(() => {
    if (mode === "solo") {
      startSoloGame();
    } else {
      resetForPassAndPlay();
    }
  }, [mode]);

  const handleGuess = useCallback(
    (letter) => {
      if (gameState !== "in-progress") return;
      const upper = letter.toUpperCase();
      if (!/^[A-Z]$/.test(upper)) return;

      setGuessedLetters((previousGuesses) => {
        if (previousGuesses.includes(upper)) {
          return previousGuesses;
        }

        const nextGuesses = [...previousGuesses, upper];

        if (!secretWord.includes(upper)) {
          setWrongGuesses((prevWrong) => {
            const nextWrong = prevWrong + 1;
            if (nextWrong >= MAX_WRONG_GUESSES) {
              setGameState("lost");
              setMessage("Out of guesses! Want to try again?");
            }
            return nextWrong;
          });
          return nextGuesses;
        }

        const remainingLetters = new Set(uniqueLetters);
        nextGuesses.forEach((l) => remainingLetters.delete(l));

        if (remainingLetters.size === 0) {
          setGameState("won");
          setMessage("Great job! You saved the hangman.");
        }

        return nextGuesses;
      });
    },
    [gameState, secretWord, uniqueLetters]
  );

  useEffect(() => {
    if (gameState !== "in-progress") {
      return undefined;
    }

    const handleKeyDown = (event) => {
      const key = event.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        event.preventDefault();
        handleGuess(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, handleGuess]);

  const handleCustomWordStart = () => {
    const normalized = normalizeWord(customWordInput);
    if (!normalized) {
      setMessage("Please enter a word using letters, spaces, apostrophes, or hyphens.");
      return;
    }

    if (![...normalized].some((char) => /[A-Z]/.test(char))) {
      setMessage("Your secret word must include at least one letter.");
      return;
    }

    setSecretWord(normalized);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameState("in-progress");
    setMessage("Pass the screen to your friend and start guessing!");
    setCustomWordInput("");
    setShowCustomWord(false);
  };

  const handlePlayAgain = () => {
    if (mode === "solo") {
      startSoloGame();
    } else {
      resetForPassAndPlay();
    }
  };

  const handleModeChange = (nextMode) => {
    if (mode === nextMode) return;
    setMode(nextMode);
  };

  const renderWordTiles = () => {
    if (!secretWord) {
      return null;
    }

    return secretWord.split("").map((char, index) => {
      const isLetter = /[A-Z]/.test(char);
      if (!isLetter) {
        return (
          <span
            key={`${char}-${index}`}
            className="flex h-14 min-w-[2.75rem] items-center justify-center rounded-lg border-2 border-transparent text-xl font-medium text-slate-500 sm:h-16 sm:min-w-[3.25rem]"
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      }

      const shouldReveal =
        guessedLetters.includes(char) || gameState === "lost";

      return (
        <span
          key={`${char}-${index}`}
          className={`flex h-14 min-w-[2.75rem] items-center justify-center rounded-lg border-2 bg-white font-semibold uppercase tracking-wide sm:h-16 sm:min-w-[3.25rem] sm:text-2xl ${
            shouldReveal ? "border-blue-400 text-slate-900" : "border-slate-300 text-transparent"
          }`}
        >
          {shouldReveal ? char : "_"}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen px-4 py-10 text-slate-900">
      {showSupportWidget && <SupportWidget />}

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
        <div className="w-full max-w-3xl space-y-8">
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-sky-50/80 to-rose-50/60 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Hangman</h1>
                <p className="mt-2 text-sm text-slate-600 sm:text-base">
                  Guess letters to uncover the hidden word before the gallows is complete.
                </p>
              </div>
              <div className="flex gap-2 rounded-full bg-white/80 p-1">
                <button
                  type="button"
                  onClick={() => handleModeChange("solo")}
                  className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
                    mode === "solo"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-600 hover:bg-blue-100/70"
                  }`}
                >
                  Solo
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("pass")}
                  className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
                    mode === "pass"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-600 hover:bg-blue-100/70"
                  }`}
                >
                  Pass &amp; Play
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {gameState === "setup" ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Type a secret word using letters, spaces, apostrophes, or hyphens. We&rsquo;ll hide it once you start.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <input
                        type={showCustomWord ? "text" : "password"}
                        value={customWordInput}
                        onChange={(event) => setCustomWordInput(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Enter a secret word"
                        aria-label="Secret word"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustomWord((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {showCustomWord ? "Hide" : "Show"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleCustomWordStart}
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500"
                    >
                      Start Game
                    </button>
                  </div>
                </div>
              ) : null}

              {gameState !== "setup" ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="w-full max-w-[240px] rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-inner sm:max-w-[280px]">
                      <div className="space-y-1 font-mono text-lg leading-6 text-slate-800">
                        {currentStage.art.map((line) => (
                          <div key={line}>{line}</div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600">
                        <span className="text-2xl" aria-hidden>{currentStage.mood}</span>
                        <span>{currentStage.caption}</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4 text-center sm:text-left">
                      <div className="flex max-w-full flex-nowrap justify-center gap-2 overflow-x-auto pb-1 sm:justify-start">
                        {renderWordTiles()}
                      </div>
                      <p className="text-sm font-semibold text-slate-600">
                        Guesses remaining: <span className="text-blue-600">{Math.max(guessesRemaining, 0)}</span>
                      </p>
                      {wrongLetters.length > 0 ? (
                        <p className="text-sm text-slate-600">
                          Wrong letters: {wrongLetters.map((letter) => (
                            <span key={letter} className="px-1 font-semibold text-rose-500">
                              {letter}
                            </span>
                          ))}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500">No incorrect guesses yet.</p>
                      )}
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                        gameState === "won"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : gameState === "lost"
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      }`}
                    >
                      {message}
                      {gameState === "lost" && secretWord ? (
                        <span className="ml-1 font-bold text-rose-600">The word was {secretWord}.</span>
                      ) : null}
                    </div>
                  )}

                  <div className="grid grid-cols-7 gap-2 sm:grid-cols-9">
                    {ALPHABET.map((letter) => {
                      const isGuessed = guessedLetters.includes(letter);
                      const isCorrect = isGuessed && secretWord.includes(letter);
                      const isIncorrect = isGuessed && !secretWord.includes(letter);

                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => handleGuess(letter)}
                          disabled={isGuessed || gameState !== "in-progress"}
                          className={`flex h-10 items-center justify-center rounded-lg border text-sm font-semibold uppercase transition sm:h-12 ${
                            isCorrect
                              ? "border-emerald-400 bg-emerald-100 text-emerald-700"
                              : isIncorrect
                              ? "border-rose-300 bg-rose-100 text-rose-600"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                          } ${
                            gameState !== "in-progress" && !isGuessed
                              ? "cursor-not-allowed opacity-60"
                              : ""
                          }`}
                          aria-label={`Guess letter ${letter}`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 pt-2 sm:justify-start">
                    <button
                      type="button"
                      onClick={handlePlayAgain}
                      className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-5 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      {mode === "solo" ? "New Word" : gameState === "setup" ? "Reset" : "Set New Word"}
                    </button>
                    {mode === "solo" && gameState === "in-progress" ? (
                      <button
                        type="button"
                        onClick={startSoloGame}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-500"
                      >
                        Shuffle Word
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <GameFooter
          gameName="Hangman"
          creator="unknown Victorian-era puzzle enthusiasts"
          moreInfo={{
            url: "https://en.wikipedia.org/wiki/Hangman_(game)",
            label: "the Hangman entry on Wikipedia",
          }}
          className="w-full max-w-md lg:max-w-xs lg:self-start"
        />
      </div>
    </div>
  );
}
