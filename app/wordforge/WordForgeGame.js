"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import CosmicBackground from "../components/CosmicBackground";
import GameFooter from "../components/GameFooter";
import SupportWidget from "../components/SupportWidget";
import { isGamePlayable } from "../utils/gameAvailability";
import { PUZZLES } from "./puzzles";

const LENGTH_SCORES = {
  3: 80,
  4: 120,
  5: 180,
  6: 260,
  7: 360,
  8: 500,
};

const showSupportWidget = isGamePlayable("/wordforge");

const shuffleArray = (letters) => {
  const clone = [...letters];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};

const buildLetterMap = (letters) => {
  return letters.reduce((acc, letter) => {
    acc[letter] = (acc[letter] ?? 0) + 1;
    return acc;
  }, {});
};

const sortWords = (words) =>
  [...words].sort((a, b) => {
    if (a.length === b.length) {
      return a.localeCompare(b);
    }
    return a.length - b.length;
  });

const getWordScore = (word) => LENGTH_SCORES[word.length] ?? LENGTH_SCORES[8];

export default function WordForgeGame() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const initialLetters = useMemo(
    () => PUZZLES[0].letters.toUpperCase().split(""),
    [],
  );
  const [shuffledLetters, setShuffledLetters] = useState(() =>
    shuffleArray(initialLetters),
  );
  const [currentInput, setCurrentInput] = useState("");
  const [foundWords, setFoundWords] = useState([]);
  const [roundScore, setRoundScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Form a word with at least three letters to earn points.",
  );
  const [feedback, setFeedback] = useState(null);
  const [recentWord, setRecentWord] = useState(null);

  const successSynthRef = useRef(null);
  const missSynthRef = useRef(null);
  const toneStartRef = useRef(null);

  const puzzle = PUZZLES[puzzleIndex];
  const letters = useMemo(
    () => puzzle.letters.toUpperCase().split(""),
    [puzzle.letters],
  );
  const letterMap = useMemo(() => buildLetterMap(letters), [letters]);
  const validWords = useMemo(
    () => new Set(puzzle.words.map((word) => word.toUpperCase())),
    [puzzle.words],
  );

  const targetReached = roundScore >= puzzle.targetScore;
  const progress = Math.min(100, Math.round((roundScore / puzzle.targetScore) * 100));

  useEffect(() => {
    setShuffledLetters(shuffleArray(letters));
    setFoundWords([]);
    setRoundScore(0);
    setCurrentInput("");
    setFeedback(null);
    setStatusMessage(
      `Round ${puzzleIndex + 1} unlocked! Reach ${puzzle.targetScore} points to continue.`,
    );
  }, [letters, puzzle.targetScore, puzzleIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const loadTone = async () => {
      try {
        const toneModule = await import("tone");
        if (cancelled) return;

        const { PolySynth, Synth, MembraneSynth, start } = toneModule;
        successSynthRef.current = new PolySynth(Synth).toDestination();
        missSynthRef.current = new MembraneSynth().toDestination();
        toneStartRef.current = start;
      } catch {
        successSynthRef.current = null;
        missSynthRef.current = null;
        toneStartRef.current = null;
      }
    };

    const scheduleLoad = () => {
      void loadTone();
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(scheduleLoad);
    } else {
      window.setTimeout(scheduleLoad, 0);
    }

    return () => {
      cancelled = true;
      successSynthRef.current?.dispose?.();
      missSynthRef.current?.dispose?.();
      successSynthRef.current = null;
      missSynthRef.current = null;
      toneStartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!recentWord) return;
    const timer = window.setTimeout(() => setRecentWord(null), 700);
    return () => window.clearTimeout(timer);
  }, [recentWord]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 650);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const isWordPossible = useCallback(
    (word) => {
      const usage = {};
      for (const letter of word) {
        if (!letterMap[letter]) {
          return false;
        }
        usage[letter] = (usage[letter] ?? 0) + 1;
        if (usage[letter] > letterMap[letter]) {
          return false;
        }
      }
      return true;
    },
    [letterMap],
  );

  const playSuccess = useCallback(() => {
    const synth = successSynthRef.current;
    const start = toneStartRef.current;
    if (!synth) return;
    if (start) {
      void start();
    }
    synth.triggerAttackRelease(["C5", "E5", "A5"], "8n");
  }, []);

  const playMiss = useCallback(() => {
    const synth = missSynthRef.current;
    const start = toneStartRef.current;
    if (!synth) return;
    if (start) {
      void start();
    }
    synth.triggerAttackRelease("F2", "16n");
  }, []);

  const handleLetter = useCallback(
    (letter) => {
      const uppercase = letter.toUpperCase();
      setCurrentInput((prev) => {
        const candidate = `${prev}${uppercase}`;
        if (!isWordPossible(candidate)) {
          setFeedback("error");
          const count = letterMap[uppercase];
          if (count) {
            setStatusMessage(
              `Only ${count} ${uppercase}${count > 1 ? "s" : ""} available.`,
            );
          } else {
            setStatusMessage(`The letter ${uppercase} is not in this wheel.`);
          }
          return prev;
        }
        setFeedback(null);
        setStatusMessage("Keep building your word!");
        return candidate;
      });
    },
    [isWordPossible, letterMap],
  );

  const handleBackspace = useCallback(() => {
    setCurrentInput((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setCurrentInput("");
    setStatusMessage("Word cleared. Try a new combination.");
  }, []);

  const handleShuffle = useCallback(() => {
    setShuffledLetters(shuffleArray(letters));
    setStatusMessage("Letters shuffled for a fresh angle.");
  }, [letters]);

  const handleSubmit = useCallback(() => {
    const word = currentInput.toUpperCase();
    if (!word) {
      setFeedback("error");
      setStatusMessage("Type or tap letters to make a word.");
      playMiss();
      return;
    }
    if (word.length < 3) {
      setFeedback("error");
      setStatusMessage("Words must be at least three letters long.");
      playMiss();
      return;
    }
    if (!isWordPossible(word)) {
      setFeedback("error");
      setStatusMessage("That word uses letters you don't have.");
      playMiss();
      return;
    }
    if (!validWords.has(word)) {
      setFeedback("error");
      setStatusMessage(`${word} isn't on today's list. Keep experimenting!`);
      playMiss();
      return;
    }
    if (foundWords.includes(word)) {
      setFeedback("error");
      setStatusMessage("You've already banked that word.");
      playMiss();
      return;
    }

    const points = getWordScore(word);
    const updatedWords = sortWords([...foundWords, word]);
    setFoundWords(updatedWords);
    setRoundScore((prev) => prev + points);
    setTotalScore((prev) => prev + points);
    setCurrentInput("");
    setFeedback("success");
    setStatusMessage(`+${points} points for ${word}!`);
    setRecentWord(word);
    playSuccess();
  }, [currentInput, foundWords, isWordPossible, playMiss, playSuccess, validWords]);

  const handleNextRound = useCallback(() => {
    setPuzzleIndex((prev) => (prev + 1) % PUZZLES.length);
  }, []);

  const handleResetGame = useCallback(() => {
    setPuzzleIndex(0);
    setTotalScore(0);
    setRoundScore(0);
    setFoundWords([]);
    setCurrentInput("");
    setFeedback(null);
    setRecentWord(null);
    const baseLetters = PUZZLES[0].letters.toUpperCase().split("");
    setShuffledLetters(shuffleArray(baseLetters));
    setStatusMessage("Game reset! Start again from round one.");
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key;
      if (key === "Backspace") {
        event.preventDefault();
        handleBackspace();
        return;
      }
      if (key === "Enter") {
        event.preventDefault();
        handleSubmit();
        return;
      }
      if (key === "Escape") {
        event.preventDefault();
        handleClear();
        return;
      }
      if (/^[a-zA-Z]$/.test(key)) {
        const upper = key.toUpperCase();
        if (!letterMap[upper]) {
          setFeedback("error");
          setStatusMessage(`${upper} isn't part of this round.`);
          playMiss();
          return;
        }
        handleLetter(upper);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBackspace, handleClear, handleLetter, handleSubmit, letterMap, playMiss]);

  return (
    <div className="cosmic-body">
      {showSupportWidget && <SupportWidget />}
      <CosmicBackground />
      <div className="cosmic-page px-4 pb-16 pt-20">
        <div className="cosmic-panel relative w-full max-w-5xl overflow-hidden px-6 py-8 text-white shadow-[0_28px_75px_rgba(2,6,23,0.55)] sm:px-10 sm:py-12">
          <div className="absolute inset-x-12 top-10 h-1 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300 opacity-60" />
          <div className="relative z-10 flex flex-col items-center gap-10">
            <header className="flex flex-col items-center gap-4 text-center">
              <span className="cosmic-pill text-xs font-semibold uppercase tracking-[0.45em] text-white/70">
                Round {puzzleIndex + 1} of {PUZZLES.length}
              </span>
              <h1 className="cosmic-heading text-3xl font-semibold sm:text-4xl">
                Word Forge Challenge
              </h1>
              <p className="max-w-2xl text-sm text-white/70 sm:text-base">
                Inspired by the classic Text Twist formula: combine the glowing letters to
                discover every possible word, rack up points, and unlock endless rounds.
              </p>
            </header>

            <div className="grid w-full gap-4 sm:grid-cols-3">
              <div className="cosmic-card space-y-2 text-center">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/60">
                  Round Score
                </p>
                <p className="text-2xl font-bold text-sky-100">
                  {roundScore}
                  <span className="text-sm font-medium text-white/70">
                    {" "}/ {puzzle.targetScore}
                  </span>
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-200 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="cosmic-card space-y-2 text-center">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/60">
                  Total Score
                </p>
                <p className="text-2xl font-bold text-emerald-100">{totalScore}</p>
                <p className="text-xs text-white/60">
                  Every round adds to your running tally.
                </p>
              </div>

              <div className="cosmic-card space-y-2 text-center">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/60">
                  Words Discovered
                </p>
                <p className="text-2xl font-bold text-amber-100">
                  {foundWords.length}
                  <span className="text-sm font-medium text-white/70">
                    {" "}/ {puzzle.words.length}
                  </span>
                </p>
                <p className="text-xs text-white/60">Earn more by finding longer words.</p>
              </div>
            </div>

            <div
              className={`relative w-full max-w-2xl rounded-3xl border border-white/10 bg-white/10 px-6 py-6 text-center shadow-[0_22px_55px_rgba(2,6,23,0.5)] backdrop-blur-xl transition ${feedback === "success" ? "wordforge-success" : ""} ${feedback === "error" ? "wordforge-error" : ""}`}
            >
              <p className="min-h-[1.25rem] text-sm font-medium text-white/80">{statusMessage}</p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="flex min-h-[3rem] min-w-[10rem] items-center justify-center rounded-2xl border border-white/10 bg-slate-900/40 px-6 py-3 text-2xl font-semibold tracking-[0.35em] text-sky-100 shadow-inner">
                  {currentInput || "\u2022\u2022\u2022"}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {shuffledLetters.map((letter, index) => (
                  <button
                    key={`${letter}-${index}`}
                    type="button"
                    onClick={() => handleLetter(letter)}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-200/80 via-emerald-200/70 to-blue-200/60 text-2xl font-bold text-slate-800 shadow-[0_16px_35px_rgba(56,189,248,0.25)] transition-transform hover:-translate-y-1 hover:scale-105 hover:shadow-[0_20px_45px_rgba(56,189,248,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    <span className="drop-shadow-[0_4px_6px_rgba(14,116,144,0.3)]">{letter}</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="cosmic-pill px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80"
                >
                  Shuffle
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="cosmic-pill px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="cosmic-pill px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="cosmic-pill cosmic-pill--active px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                >
                  Submit
                </button>
              </div>
              <p className="mt-4 text-[0.65rem] text-white/50">
                Tip: Use your keyboard. Enter to submit, Backspace to undo, Escape to clear.
              </p>
            </div>

            <div className="grid w-full gap-6 sm:grid-cols-2">
              <div className="cosmic-card space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                  Found Words
                </p>
                {foundWords.length === 0 ? (
                  <p className="text-sm text-white/60">
                    The board is empty for now. Discover words to fill this log.
                  </p>
                ) : (
                  <ul className="grid grid-cols-2 gap-3 text-left text-sm">
                    {foundWords.map((word) => (
                      <li
                        key={word}
                        className={`wordforge-word flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white/80 shadow-[0_12px_28px_rgba(2,6,23,0.4)] backdrop-blur-xl ${recentWord === word ? "wordforge-word-celebrate" : ""}`}
                      >
                        <span className="font-semibold tracking-[0.35em] text-white/80">
                          {word}
                        </span>
                        <span className="text-xs font-medium text-emerald-200/80">
                          +{getWordScore(word)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="cosmic-card space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                  Goals & Controls
                </p>
                <div className="space-y-3 text-sm text-white/70">
                  <p>
                    Reach the target score to advance. You can keep hunting for more words even
                    after the goal is met for bonus points.
                  </p>
                  <p>
                    Longer words award more points. Eight-letter anagrams are worth a jackpot 500
                    points.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleNextRound}
                    className={`cosmic-pill px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] ${targetReached ? "text-white" : "text-white/40"}`}
                    disabled={!targetReached}
                  >
                    {targetReached ? "Next Round" : "Reach Target to Unlock"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetGame}
                    className="cosmic-pill px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80"
                  >
                    Reset Game
                  </button>
                </div>
                {targetReached ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
                    Target cleared! Move on or keep scoring in this round.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <GameFooter
          gameName="Text Twist"
          creator="GameHouse"
          moreInfo={{ url: "https://en.wikipedia.org/wiki/Text_Twist", label: "Text Twist on Wikipedia" }}
          className="mt-12"
          variant="cosmic"
        />
      </div>
    </div>
  );
}
