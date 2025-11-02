"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GameFooter from "../components/GameFooter";
import SupportWidget from "../components/SupportWidget";
import { isGamePlayable } from "../utils/gameAvailability";
import { HANGMAN_WORDS } from "./words";

const showSupportWidget = isGamePlayable("/hangman");

const FIGURE_STEPS = [
  {
    wrong: 0,
    mood: "😄",
    caption: "Fresh start! The rope sways in the breeze.",
  },
  {
    wrong: 1,
    mood: "🙂",
    caption: "A curious head appears, still hopeful.",
  },
  {
    wrong: 2,
    mood: "😯",
    caption: "The body drops in. Keep those guesses sharp!",
  },
  {
    wrong: 3,
    mood: "😟",
    caption: "One arm reaches for help—choose wisely.",
  },
  {
    wrong: 4,
    mood: "😣",
    caption: "Both arms are tense. The pressure is on!",
  },
  {
    wrong: 5,
    mood: "😰",
    caption: "A leg dangles anxiously. Almost out of time!",
  },
  {
    wrong: 6,
    mood: "😱",
    caption: "The figure is complete. One more miss spells doom!",
  },
];

const MAX_WRONG_GUESSES = FIGURE_STEPS[FIGURE_STEPS.length - 1].wrong;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const getFigureStage = (wrongGuesses) => {
  const clamped = Math.max(0, Math.min(wrongGuesses, MAX_WRONG_GUESSES));
  let stage = FIGURE_STEPS[0];
  for (let index = 0; index < FIGURE_STEPS.length; index += 1) {
    const step = FIGURE_STEPS[index];
    if (clamped >= step.wrong) {
      stage = step;
    } else {
      break;
    }
  }
  return stage;
};

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

const HangmanFigure = ({ wrongGuesses, gameState }) => {
  const showFullFigure = gameState === "won" || gameState === "lost";
  const headVisible = showFullFigure || wrongGuesses >= 1;
  const bodyVisible = showFullFigure || wrongGuesses >= 2;
  const leftArmVisible = showFullFigure || wrongGuesses >= 3;
  const rightArmVisible = showFullFigure || wrongGuesses >= 4;
  const leftLegVisible = showFullFigure || wrongGuesses >= 5;
  const rightLegVisible = showFullFigure || wrongGuesses >= 6;

  let expression = "calm";
  if (gameState === "won") {
    expression = "happy";
  } else if (gameState === "lost") {
    expression = "defeated";
  } else if (wrongGuesses >= 5) {
    expression = "panicked";
  } else if (wrongGuesses >= 3) {
    expression = "worried";
  } else if (wrongGuesses >= 1) {
    expression = "curious";
  }

  const mouthPathByExpression = {
    calm: "M142 82 Q150 88 158 82",
    curious: "M142 82 Q150 78 158 82",
    worried: "M142 84 Q150 74 158 84",
    panicked: "M142 85 Q150 95 158 85",
    defeated: "M142 86 Q150 70 158 86",
    happy: "M142 78 Q150 92 158 78",
  };

  const eyebrowRotation = {
    calm: 0,
    curious: -5,
    worried: -12,
    panicked: -18,
    defeated: -25,
    happy: 10,
  };

  const figureStateClass =
    gameState === "won"
      ? "is-won"
      : gameState === "lost"
      ? "is-lost"
      : "";

  return (
    <div className={`hangman-figure ${figureStateClass}`}>
      <svg viewBox="0 0 220 260" role="img" aria-label="Hangman gallows and figure">
        <g className="gallows">
          <line x1="30" y1="220" x2="190" y2="220" />
          <line x1="60" y1="220" x2="60" y2="40" />
          <line x1="60" y1="40" x2="150" y2="40" />
          <line x1="100" y1="40" x2="60" y2="80" />
          <line x1="150" y1="40" x2="150" y2="72" className="rope" />
        </g>

        <g className="character">
          <circle
            className={`part head ${headVisible ? "visible" : ""}`}
            cx="150"
            cy="90"
            r="20"
          />

          <g className={`part face ${headVisible ? "visible" : ""}`}>
            {expression === "defeated" ? (
              <>
                <line x1="142" y1="84" x2="146" y2="88" className="eye-line" />
                <line x1="146" y1="84" x2="142" y2="88" className="eye-line" />
                <line x1="154" y1="84" x2="158" y2="88" className="eye-line" />
                <line x1="158" y1="84" x2="154" y2="88" className="eye-line" />
              </>
            ) : (
              <>
                <circle cx="144" cy="84" r={expression === "panicked" ? 4 : 3} className="eye" />
                <circle cx="156" cy="84" r={expression === "panicked" ? 4 : 3} className="eye" />
              </>
            )}
            <path className={`mouth ${expression}`} d={mouthPathByExpression[expression]} />
            <g
              className={`brows ${expression}`}
              style={{ transform: `rotate(${eyebrowRotation[expression]}deg)`, transformOrigin: "150px 80px" }}
            >
              <line x1="142" y1="80" x2="148" y2="78" />
              <line x1="152" y1="78" x2="158" y2="80" />
            </g>
          </g>

          <line
            className={`part body ${bodyVisible ? "visible" : ""}`}
            x1="150"
            y1="110"
            x2="150"
            y2="160"
          />
          <line
            className={`part limb left-arm ${leftArmVisible ? "visible" : ""}`}
            x1="150"
            y1="125"
            x2="128"
            y2="140"
          />
          <line
            className={`part limb right-arm ${rightArmVisible ? "visible" : ""}`}
            x1="150"
            y1="125"
            x2="172"
            y2="140"
          />
          <line
            className={`part limb left-leg ${leftLegVisible ? "visible" : ""}`}
            x1="150"
            y1="160"
            x2="132"
            y2="190"
          />
          <line
            className={`part limb right-leg ${rightLegVisible ? "visible" : ""}`}
            x1="150"
            y1="160"
            x2="168"
            y2="190"
          />
        </g>
      </svg>

      <style jsx>{`
        .hangman-figure {
          position: relative;
          width: 100%;
          max-width: 240px;
          margin: 0 auto;
        }

        .hangman-figure svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .gallows line {
          stroke: #334155;
          stroke-width: 8px;
          stroke-linecap: round;
        }

        .gallows .rope {
          stroke-width: 5px;
          stroke: #f59e0b;
        }

        .character .part {
          opacity: 0;
          transition: opacity 0.4s ease, transform 0.4s ease;
          stroke: #1e293b;
          stroke-width: 6px;
          stroke-linecap: round;
          transform: translateY(-8px);
        }

        .character .part.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .head {
          fill: #f8fafc;
          stroke: #1e293b;
        }

        .face {
          transition: opacity 0.3s ease;
        }

        .face .eye {
          fill: #0f172a;
        }

        .face .eye-line {
          stroke: #0f172a;
          stroke-width: 4px;
          stroke-linecap: round;
        }

        .face .mouth {
          fill: none;
          stroke: #0f172a;
          stroke-width: 4px;
          stroke-linecap: round;
        }

        .face .brows line {
          stroke: #0f172a;
          stroke-width: 4px;
          stroke-linecap: round;
        }

        .limb {
          transform-origin: 150px 110px;
        }

        .hangman-figure.is-won .character {
          animation: hangman-celebrate 1.6s ease-in-out infinite;
        }

        .hangman-figure.is-won .mouth.happy {
          stroke: #16a34a;
        }

        .hangman-figure.is-won .head {
          stroke: #16a34a;
        }

        .hangman-figure.is-lost .character {
          transform-origin: 150px 72px;
          animation: hangman-sway 1.8s ease-in-out infinite;
        }

        .hangman-figure.is-lost .mouth.defeated {
          stroke: #dc2626;
        }

        .hangman-figure.is-lost .head {
          stroke: #dc2626;
        }

        @keyframes hangman-celebrate {
          0% {
            transform: translateY(0px);
          }
          35% {
            transform: translateY(-16px);
          }
          55% {
            transform: translateY(-4px);
          }
          70% {
            transform: translateY(-12px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        @keyframes hangman-sway {
          0% {
            transform: rotate(6deg);
          }
          50% {
            transform: rotate(-4deg);
          }
          100% {
            transform: rotate(6deg);
          }
        }
      `}</style>
    </div>
  );
};

export default function HangmanPage() {
  const [mode, setMode] = useState("solo");
  const [gameState, setGameState] = useState("loading");
  const [secretWord, setSecretWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [message, setMessage] = useState("");
  const [customWordInput, setCustomWordInput] = useState("");
  const [showCustomWord, setShowCustomWord] = useState(false);

  const letterCount = useMemo(
    () => secretWord.replace(/[^A-Z]/g, "").length,
    [secretWord]
  );

  const longestSegmentLength = useMemo(() => {
    if (!secretWord) return 0;
    return secretWord
      .split(/\s+/)
      .reduce((longest, segment) => {
        const cleaned = segment.replace(/[^A-Z]/g, "");
        return Math.max(longest, cleaned.length);
      }, 0);
  }, [secretWord]);

  const tileDimensions = useMemo(() => {
    if (!secretWord) {
      return {
        width: 3.25,
        height: 3.5,
        fontSize: 1.5,
        spacerWidth: 2.3,
      };
    }

    if (longestSegmentLength > 18 || letterCount > 26) {
      return { width: 2, height: 2.8, fontSize: 1.15, spacerWidth: 1.6 };
    }
    if (longestSegmentLength > 16 || letterCount > 22) {
      return { width: 2.2, height: 3, fontSize: 1.25, spacerWidth: 1.8 };
    }
    if (longestSegmentLength > 14 || letterCount > 18) {
      return { width: 2.4, height: 3.1, fontSize: 1.35, spacerWidth: 1.95 };
    }
    if (longestSegmentLength > 12 || letterCount > 14) {
      return { width: 2.7, height: 3.3, fontSize: 1.4, spacerWidth: 2.15 };
    }

    return { width: 3.05, height: 3.45, fontSize: 1.5, spacerWidth: 2.35 };
  }, [letterCount, longestSegmentLength, secretWord]);

  const shouldStackFigure = useMemo(() => {
    if (!secretWord) return false;
    return longestSegmentLength > 11 || letterCount > 16;
  }, [letterCount, longestSegmentLength, secretWord]);

  const uniqueLetters = useMemo(
    () => getUniqueLetters(secretWord),
    [secretWord]
  );

  const wrongLetters = useMemo(
    () => guessedLetters.filter((letter) => !secretWord.includes(letter)),
    [guessedLetters, secretWord]
  );

  const guessesRemaining = MAX_WRONG_GUESSES - wrongGuesses;
  const currentStage = useMemo(
    () => getFigureStage(wrongGuesses),
    [wrongGuesses]
  );
  const stageMood =
    gameState === "won"
      ? "🥳"
      : gameState === "lost"
      ? "💀"
      : currentStage.mood;
  const stageCaption =
    gameState === "won"
      ? "The figure celebrates your victory!"
      : gameState === "lost"
      ? "The figure hangs limp. Better luck next time."
      : currentStage.caption;

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
            className="flex items-center justify-center rounded-lg border-2 border-transparent text-xl font-medium text-slate-500"
            style={{
              height: `${tileDimensions.height}rem`,
              minWidth: `${tileDimensions.spacerWidth}rem`,
            }}
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
          className={`flex items-center justify-center rounded-lg border-2 bg-white font-semibold uppercase tracking-wide ${
            shouldReveal ? "border-blue-400 text-slate-900" : "border-slate-300 text-transparent"
          }`}
          style={{
            height: `${tileDimensions.height}rem`,
            minWidth: `${tileDimensions.width}rem`,
            fontSize: `${tileDimensions.fontSize}rem`,
          }}
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
                  <div
                    className={`flex w-full flex-col items-center gap-6 ${
                      shouldStackFigure
                        ? "sm:flex-col"
                        : "sm:flex-row sm:items-start sm:justify-between"
                    }`}
                  >
                    <div className="w-full max-w-[260px] flex-shrink-0 rounded-2xl border border-slate-200 bg-white px-5 py-6 text-center shadow-inner sm:max-w-[300px]">
                      <HangmanFigure wrongGuesses={wrongGuesses} gameState={gameState} />
                      <div className="mt-4 flex flex-col items-center gap-2 text-sm font-semibold text-slate-600">
                        <div className="flex items-center justify-center gap-2 text-center">
                          <span className="text-2xl" aria-hidden>
                            {stageMood}
                          </span>
                          <span>{stageCaption}</span>
                        </div>
                        {gameState === "in-progress" ? (
                          <span className="text-xs font-medium text-slate-500">
                            Incorrect parts assemble as you miss letters.
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-4 text-center sm:w-full sm:text-left">
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
