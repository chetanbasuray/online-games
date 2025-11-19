"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import GameFooter from "../components/GameFooter";
import SupportWidget from "../components/SupportWidget";
import { isGamePlayable } from "../utils/gameAvailability";
import { ENGLISH_WORDS_3_TO_8 } from "../data/englishWords";
import { PUZZLES } from "./puzzles";

const LENGTH_SCORES = {
  3: 80,
  4: 120,
  5: 180,
  6: 260,
  7: 360,
  8: 500,
};

const MIN_WORD_LENGTH = 3;

const LEVELS = [
  {
    id: "relaxed",
    label: "Relaxed",
    description: "Gentle pace with slightly lower targets and steady scoring.",
    targetMultiplier: 0.85,
    scoreMultiplier: 1,
    bonusMultiplier: 1.05,
  },
  {
    id: "classic",
    label: "Classic",
    description: "Balanced targets that mirror the original Text Twist challenge.",
    targetMultiplier: 1,
    scoreMultiplier: 1.05,
    bonusMultiplier: 1.15,
  },
  {
    id: "expert",
    label: "Expert",
    description: "Steeper goals and juicier rewards for seasoned word hunters.",
    targetMultiplier: 1.4,
    scoreMultiplier: 1.12,
    bonusMultiplier: 1.28,
  },
];

const showSupportWidget = isGamePlayable("/lexitwist");

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

const sortFoundEntries = (entries) =>
  [...entries].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "core" ? -1 : 1;
    }
    if (a.word.length === b.word.length) {
      return a.word.localeCompare(b.word);
    }
    return a.word.length - b.word.length;
  });

const getWordScore = (word) => LENGTH_SCORES[word.length] ?? LENGTH_SCORES[8];

export default function LexiTwistGame() {
  const [levelId, setLevelId] = useState(LEVELS[1].id);
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
  const [dictionaryStatus, setDictionaryStatus] = useState("loading");
  const [dictionarySize, setDictionarySize] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [checkpointData, setCheckpointData] = useState(null);
  const [showCheckpoint, setShowCheckpoint] = useState(false);

  const successSynthRef = useRef(null);
  const missSynthRef = useRef(null);
  const toneStartRef = useRef(null);
  const dictionaryRef = useRef(null);

  const puzzle = PUZZLES[puzzleIndex];
  const activeLevel = useMemo(
    () => LEVELS.find((entry) => entry.id === levelId) ?? LEVELS[0],
    [levelId],
  );
  const letters = useMemo(
    () => puzzle.letters.toUpperCase().split(""),
    [puzzle.letters],
  );
  const letterMap = useMemo(() => buildLetterMap(letters), [letters]);
  const validWords = useMemo(
    () => new Set(puzzle.words.map((word) => word.toUpperCase())),
    [puzzle.words],
  );
  const fallbackDictionary = useMemo(
    () => new Set(ENGLISH_WORDS_3_TO_8.map((word) => word.toUpperCase())),
    [],
  );
  const activeTargetScore = useMemo(
    () => Math.round(puzzle.targetScore * activeLevel.targetMultiplier),
    [activeLevel.targetMultiplier, puzzle.targetScore],
  );
  const coreWordCount = useMemo(
    () => foundWords.filter((entry) => entry.type === "core").length,
    [foundWords],
  );
  const bonusWordCount = foundWords.length - coreWordCount;

  const checkpointFoundSet = useMemo(() => {
    if (!checkpointData) return null;
    return new Set(checkpointData.foundCoreWords ?? []);
  }, [checkpointData]);

  const checkpointMissedCount = useMemo(() => {
    if (!checkpointData) return 0;
    const foundSet = new Set(checkpointData.foundCoreWords ?? []);
    return checkpointData.coreWords.filter((word) => !foundSet.has(word)).length;
  }, [checkpointData]);

  const primaryPillClasses =
    "inline-flex items-center justify-center rounded-full border border-transparent bg-gradient-to-r from-sky-100 via-blue-100 to-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-blue-800 shadow-sm transition hover:brightness-110";
  const subtlePillClasses =
    "inline-flex items-center justify-center rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700";
  const disabledPillClasses =
    "inline-flex items-center justify-center rounded-full border border-slate-200/70 bg-slate-100/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 shadow-sm";

  const targetReached = roundScore >= activeTargetScore;
  const progress = Math.min(
    100,
    activeTargetScore === 0
      ? 0
      : Math.round((roundScore / activeTargetScore) * 100),
  );

  useEffect(() => {
    setShuffledLetters(shuffleArray(letters));
    setFoundWords([]);
    setRoundScore(0);
    setCurrentInput("");
    setFeedback(null);
    setStatusMessage(
      `Round ${puzzleIndex + 1} unlocked on ${activeLevel.label} mode. Reach ${activeTargetScore} points to continue.`,
    );
  }, [activeLevel.label, activeTargetScore, letters, puzzleIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const normalizeWords = (candidate) => {
      if (!candidate) return [];
      if (Array.isArray(candidate)) return candidate;
      if (Array.isArray(candidate.default)) return candidate.default;
      if (Array.isArray(candidate.words)) return candidate.words;
      if (candidate.default && Array.isArray(candidate.default.words)) {
        return candidate.default.words;
      }
      if (candidate.english && Array.isArray(candidate.english)) {
        return candidate.english;
      }
      if (
        candidate.languages &&
        candidate.languages.english &&
        Array.isArray(candidate.languages.english)
      ) {
        return candidate.languages.english;
      }
      return [];
    };

    const loadDictionary = async () => {
      try {
        setDictionaryStatus("loading");
        const module = await import("../data/lexiTwistDictionary.js");
        if (cancelled) return;
        const normalized = normalizeWords(module);
        if (normalized.length === 0) {
          throw new Error("Dictionary payload empty");
        }
        const filtered = normalized.filter(
          (word) => typeof word === "string" && word.length >= MIN_WORD_LENGTH,
        );
        const dictionary = new Set(
          filtered.map((word) => word.toUpperCase()),
        );
        if (dictionary.size === 0) {
          throw new Error("Dictionary did not contain uppercase entries");
        }
        dictionaryRef.current = dictionary;
        setDictionarySize(dictionary.size);
        setDictionaryStatus("ready");
      } catch {
        if (cancelled) return;
        dictionaryRef.current = fallbackDictionary;
        setDictionarySize(fallbackDictionary.size);
        setDictionaryStatus("fallback");
      }
    };

    dictionaryRef.current = fallbackDictionary;
    setDictionarySize(fallbackDictionary.size);
    setDictionaryStatus("fallback");

    const scheduleLoad = () => {
      void loadDictionary();
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(scheduleLoad);
    } else {
      window.setTimeout(scheduleLoad, 0);
    }

    return () => {
      cancelled = true;
    };
  }, [fallbackDictionary]);

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

  const handleLevelChange = useCallback(
    (id) => {
      if (id === levelId) return;
      const targetLevel = LEVELS.find((entry) => entry.id === id);
      if (!targetLevel) return;
      setLevelId(targetLevel.id);
      setPuzzleIndex(0);
      setTotalScore(0);
      setRoundScore(0);
      setFoundWords([]);
      setCurrentInput("");
      setFeedback(null);
      setRecentWord(null);
      setRoundsCompleted(0);
      setCheckpointData(null);
      setShowCheckpoint(false);
      const baseLetters = PUZZLES[0].letters.toUpperCase().split("");
      setShuffledLetters(shuffleArray(baseLetters));
      const recalculatedTarget = Math.round(
        PUZZLES[0].targetScore * targetLevel.targetMultiplier,
      );
      setStatusMessage(
        `Switched to ${targetLevel.label} mode. Reach ${recalculatedTarget} points to conquer round 1.`,
      );
    },
    [levelId],
  );

  const handleSubmit = useCallback(() => {
    const word = currentInput.toUpperCase();
    if (!word) {
      setFeedback("error");
      setStatusMessage("Type or tap letters to make a word.");
      playMiss();
      return;
    }
    if (word.length < MIN_WORD_LENGTH) {
      setFeedback("error");
      setStatusMessage(
        `Words must be at least ${MIN_WORD_LENGTH} letters long.`,
      );
      playMiss();
      return;
    }
    if (!isWordPossible(word)) {
      setFeedback("error");
      setStatusMessage("That word uses letters you don't have.");
      playMiss();
      return;
    }

    const dictionarySet = dictionaryRef.current ?? fallbackDictionary;
    const isCoreWord = validWords.has(word);
    const isDictionaryWord = dictionarySet?.has(word);

    if (!isCoreWord && !isDictionaryWord) {
      setFeedback("error");
      if (dictionaryStatus === "loading") {
        setStatusMessage(
          "Dictionary still loading—try that word again in a moment.",
        );
      } else {
        setStatusMessage(`${word} isn't recognized as a valid word.`);
      }
      playMiss();
      return;
    }

    if (foundWords.some((entry) => entry.word === word)) {
      setFeedback("error");
      setStatusMessage("You've already banked that word.");
      playMiss();
      return;
    }

    const basePoints = getWordScore(word);
    const difficultyMultiplier = activeLevel.scoreMultiplier;
    const bonusMultiplier = isCoreWord ? 1 : activeLevel.bonusMultiplier;
    const points = Math.round(
      basePoints * difficultyMultiplier * bonusMultiplier,
    );
    const entryType = isCoreWord ? "core" : "bonus";
    const updatedWords = sortFoundEntries([
      ...foundWords,
      { word, type: entryType, points },
    ]);
    setFoundWords(updatedWords);
    setRoundScore((prev) => prev + points);
    setTotalScore((prev) => prev + points);
    setCurrentInput("");
    setFeedback("success");
    setStatusMessage(
      isCoreWord
        ? `+${points} points for ${word}!`
        : `Bonus find! +${points} points for dictionary word ${word}.`,
    );
    setRecentWord(word);
    playSuccess();
  }, [
    activeLevel.bonusMultiplier,
    activeLevel.scoreMultiplier,
    currentInput,
    dictionaryStatus,
    fallbackDictionary,
    foundWords,
    isWordPossible,
    playMiss,
    playSuccess,
    validWords,
  ]);

  const advanceToNextPuzzle = useCallback(() => {
    setCheckpointData(null);
    setShowCheckpoint(false);
    setPuzzleIndex((prev) => (prev + 1) % PUZZLES.length);
    setRecentWord(null);
    setCurrentInput("");
  }, []);

  const handleNextRound = useCallback(() => {
    if (!targetReached) return;

    const nextRoundsCompleted = roundsCompleted + 1;
    const coreFoundSet = new Set(
      foundWords
        .filter((entry) => entry.type === "core")
        .map((entry) => entry.word),
    );
    const sortedCoreWords = [...puzzle.words]
      .map((word) => word.toUpperCase())
      .sort((a, b) =>
        a.length === b.length ? a.localeCompare(b) : a.length - b.length,
      );
    const summaryPayload = {
      roundNumber: puzzleIndex + 1,
      levelLabel: activeLevel.label,
      totalPoints: roundScore,
      coreWords: sortedCoreWords,
      foundCoreWords: Array.from(coreFoundSet),
      bonusWords: foundWords
        .filter((entry) => entry.type === "bonus")
        .map((entry) => entry.word),
    };

    if (nextRoundsCompleted % 4 === 0) {
      setCheckpointData(summaryPayload);
      setShowCheckpoint(true);
      setRoundsCompleted(nextRoundsCompleted);
      setStatusMessage(
        "Checkpoint reached! Review every possible word before continuing.",
      );
      return;
    }

    setRoundsCompleted(nextRoundsCompleted);
    setStatusMessage(
      `Round ${puzzleIndex + 1} cleared! Spinning up the next challenge...`,
    );
    advanceToNextPuzzle();
  }, [
    activeLevel.label,
    advanceToNextPuzzle,
    foundWords,
    puzzle.words,
    puzzleIndex,
    roundScore,
    roundsCompleted,
    setStatusMessage,
    targetReached,
  ]);

  const handleCheckpointContinue = useCallback(() => {
    setShowCheckpoint(false);
    setStatusMessage("Let's tackle a fresh wheel of letters!");
    advanceToNextPuzzle();
  }, [advanceToNextPuzzle]);

  const handleCheckpointStay = useCallback(() => {
    setShowCheckpoint(false);
    setCheckpointData(null);
    setRoundsCompleted((prev) => Math.max(0, prev - 1));
    setStatusMessage("Take your time—keep exploring this round for more words.");
  }, []);

  const handleResetGame = useCallback(() => {
    setPuzzleIndex(0);
    setTotalScore(0);
    setRoundScore(0);
    setFoundWords([]);
    setCurrentInput("");
    setFeedback(null);
    setRecentWord(null);
    setRoundsCompleted(0);
    setCheckpointData(null);
    setShowCheckpoint(false);
    const baseLetters = PUZZLES[0].letters.toUpperCase().split("");
    setShuffledLetters(shuffleArray(baseLetters));
    const resetTarget = Math.round(
      PUZZLES[0].targetScore * activeLevel.targetMultiplier,
    );
    setStatusMessage(
      `Game reset on ${activeLevel.label}! Reach ${resetTarget} points to conquer round 1 again.`,
    );
  }, [activeLevel.label, activeLevel.targetMultiplier]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 px-4 py-10 text-slate-900">
      {showSupportWidget && <SupportWidget />}

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
        <div className="w-full max-w-3xl space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
            <header className="flex flex-col items-center gap-4 text-center">
              <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm">
                Round {puzzleIndex + 1}/{PUZZLES.length} · {activeLevel.label} Mode
              </span>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">LexiTwist Challenge</h1>
              <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
                Inspired by the classic Text Twist formula: combine the letters to discover every possible word,
                rack up points, and unlock endless rounds.
              </p>
            </header>

            <div className="mt-6 space-y-3">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 sm:text-left">
                Choose Your Challenge
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {LEVELS.map((level) => {
                  const isActive = levelId === level.id;
                  return (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => handleLevelChange(level.id)}
                      aria-pressed={isActive}
                      className={`lexitwist-level-option ${isActive ? "lexitwist-level-option--active" : ""}`}
                    >
                      <span className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-700">
                        {level.label}
                      </span>
                      <span className="text-xs text-slate-600">{level.description}</span>
                      <span className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-slate-500">
                        Target ×{level.targetMultiplier.toFixed(2)} · Score ×{level.scoreMultiplier.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-slate-500 sm:text-left">
                {dictionaryStatus === "ready"
                  ? `Dictionary ready with ${dictionarySize.toLocaleString()} entries. Bonus finds earn extra multipliers.`
                  : dictionaryStatus === "loading"
                    ? "Loading extended dictionary for extra bonus words..."
                    : "Using the built-in fallback word list while the dictionary warms up."}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-sky-50/80 to-emerald-50/70 p-4 text-center shadow-sm">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Round Score</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {roundScore}
                  <span className="text-sm font-medium text-slate-500"> / {activeTargetScore}</span>
                </p>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/80 to-violet-50/70 p-4 text-center shadow-sm">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Total Score</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{totalScore}</p>
                <p className="mt-2 text-xs text-slate-600">Every round adds to your running tally.</p>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-amber-50/70 to-rose-50/60 p-4 text-center shadow-sm">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Words Discovered</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {coreWordCount}
                  <span className="text-sm font-medium text-slate-500"> / {puzzle.words.length}</span>
                </p>
                {bonusWordCount > 0 ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-600">+{bonusWordCount} bonus dictionary finds</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-600">Earn more by finding longer words.</p>
                )}
              </div>
            </div>
          </div>

          <div
            className={`rounded-3xl border border-slate-200/70 bg-white/90 p-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition sm:p-8 ${feedback === "success" ? "lexitwist-success" : ""} ${feedback === "error" ? "lexitwist-error" : ""}`}
          >
            <p className="min-h-[1.25rem] text-sm font-medium text-slate-600">{statusMessage}</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="flex min-h-[3rem] min-w-[10rem] items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 px-6 py-3 text-2xl font-semibold tracking-[0.35em] text-slate-900 shadow-inner">
                {currentInput || "\u2022\u2022\u2022"}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {shuffledLetters.map((letter, index) => (
                <button
                  key={`${letter}-${index}`}
                  type="button"
                  onClick={() => handleLetter(letter)}
                  className="lexitwist-letter focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <span>{letter}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <button type="button" onClick={handleShuffle} className={subtlePillClasses}>
                Shuffle
              </button>
              <button type="button" onClick={handleBackspace} className={subtlePillClasses}>
                Undo
              </button>
              <button type="button" onClick={handleClear} className={subtlePillClasses}>
                Clear
              </button>
              <button type="button" onClick={handleSubmit} className={primaryPillClasses}>
                Submit
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Tip: Use your keyboard. Enter to submit, Backspace to undo, Escape to clear.
            </p>
            <p className="text-xs text-slate-500">
              Bonus dictionary discoveries earn multiplier rewards—keep experimenting even after clearing the target.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Found Words</p>
                {foundWords.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">
                    The board is empty for now. Discover words to fill this log.
                  </p>
                ) : (
                  <ul className="mt-4 grid grid-cols-2 gap-3 text-left text-sm">
                    {foundWords.map((entry) => (
                      <li
                        key={entry.word}
                        className={`lexitwist-word flex items-center justify-between rounded-xl border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60 px-3 py-2 text-slate-700 shadow-sm ${recentWord === entry.word ? "lexitwist-word-celebrate" : ""} ${entry.type === "bonus" ? "lexitwist-word--bonus" : ""}`}
                      >
                        <span className="font-semibold tracking-[0.35em] text-slate-900">{entry.word}</span>
                        <span className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                          {entry.type === "bonus" ? <span className="lexitwist-word-badge">Bonus</span> : null}
                          +{entry.points}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Goals &amp; Controls</p>
                <div className="mt-3 space-y-3 text-sm text-slate-600">
                  <p>
                    Reach the target score to advance. You can keep hunting for more words even after the goal is met for bonus points.
                  </p>
                  <p>
                    Longer words award more points. Difficulty multipliers amplify every find, and dictionary discoveries stack extra bonuses.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleNextRound}
                    className={targetReached ? primaryPillClasses : disabledPillClasses}
                    disabled={!targetReached}
                  >
                    {targetReached ? "Next Round" : "Reach Target to Unlock"}
                  </button>
                  <button type="button" onClick={handleResetGame} className={subtlePillClasses}>
                    Reset Game
                  </button>
                </div>
                {targetReached ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">
                    Target cleared on {activeLevel.label}! Move on or keep scoring in this round.
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
          className="w-full max-w-md lg:max-w-xs lg:self-start"
        />
      </div>

      {showCheckpoint && checkpointData ? (
        <div
          className="lexitwist-checkpoint-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lexitwist-checkpoint-title"
        >
          <div className="lexitwist-checkpoint-panel">
            <div className="flex flex-col gap-3 text-left text-slate-700">
              <p
                id="lexitwist-checkpoint-title"
                className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-600"
              >
                Milestone Checkpoint
              </p>
              <h2 className="text-2xl font-bold tracking-[0.25em] text-slate-900">
                Round {checkpointData.roundNumber} Complete
              </h2>
              <p className="text-sm text-slate-600">
                You uncovered {checkpointData.coreWords.length - checkpointMissedCount} of the {checkpointData.coreWords.length} core words on {checkpointData.levelLabel}.
                Take a moment to review every possibility before diving into the next challenge.
              </p>
              <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-slate-600">
                <span className="lexitwist-checkpoint-pill">Level: {checkpointData.levelLabel}</span>
                <span className="lexitwist-checkpoint-pill">
                  Core Found: {checkpointData.coreWords.length - checkpointMissedCount}/{checkpointData.coreWords.length}
                </span>
                <span className="lexitwist-checkpoint-pill">
                  Round Score: {checkpointData.totalPoints.toLocaleString()}
                </span>
                {checkpointData.bonusWords.length > 0 ? (
                  <span className="lexitwist-checkpoint-pill">Bonus Finds: {checkpointData.bonusWords.length}</span>
                ) : null}
              </div>
            </div>

            <div className="lexitwist-summary-grid">
              {checkpointData.coreWords.map((word) => {
                const found = checkpointFoundSet?.has(word);
                return (
                  <div
                    key={word}
                    className={`lexitwist-summary-word ${found ? "lexitwist-summary-word--found" : "lexitwist-summary-word--missed"}`}
                  >
                    <span className="lexitwist-summary-word-label">{word}</span>
                    <span className="lexitwist-summary-word-status">{found ? "Found" : "Missed"}</span>
                  </div>
                );
              })}
            </div>

            {checkpointData.bonusWords.length > 0 ? (
              <div className="lexitwist-bonus-summary">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600">
                  Bonus Dictionary Finds
                </p>
                <p className="text-sm text-slate-600">
                  These extra words weren’t part of the puzzle list but still earned you bonus points:
                </p>
                <div className="lexitwist-bonus-list">
                  {checkpointData.bonusWords.map((word) => (
                    <span key={word} className="lexitwist-bonus-chip">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleCheckpointContinue} className={primaryPillClasses}>
                Start Next Round
              </button>
              <button type="button" onClick={handleCheckpointStay} className={subtlePillClasses}>
                Keep Exploring
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
