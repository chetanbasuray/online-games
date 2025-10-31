"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import FloatingBubbles from "../components/FloatingBubbles";
import GameFooter from "../components/GameFooter";
import SupportWidget from "../components/SupportWidget";
import { isGamePlayable } from "../utils/gameAvailability";

// Sudoku Generator
const generateFullSolution = () => {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  const isValid = (b, row, col, num) => {
    for (let i = 0; i < 9; i++) {
      if (b[row][i] === num) return false;
      if (b[i][col] === num) return false;
      const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
      const boxCol = 3 * Math.floor(col / 3) + (i % 3);
      if (b[boxRow][boxCol] === num) return false;
    }
    return true;
  };

  const fillBoard = () => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (let num of nums) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (fillBoard()) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  fillBoard();
  return board;
};

const removeNumbers = (board, difficulty) => {
  let attempts;
  switch (difficulty) {
    case "easy": attempts = 35; break;
    case "medium": attempts = 45; break;
    case "hard": attempts = 55; break;
    case "evil": attempts = 60; break;
    default: attempts = 45;
  }
  const puzzle = board.map(r => [...r]);
  while (attempts > 0) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      attempts--;
    }
  }
  return puzzle;
};

// Color palette
const blockColors = [
  ["rgba(129, 140, 248, 0.28)", "rgba(244, 114, 182, 0.28)", "rgba(45, 212, 191, 0.28)"],
  ["rgba(244, 63, 94, 0.28)", "rgba(14, 165, 233, 0.28)", "rgba(250, 204, 21, 0.28)"],
  ["rgba(168, 85, 247, 0.28)", "rgba(56, 189, 248, 0.28)", "rgba(248, 113, 113, 0.28)"],
];
const showSupportWidget = isGamePlayable("/sudoku");

export default function SudokuPage() {
  const [solution, setSolution] = useState([]);
  const [puzzle, setPuzzle] = useState([]);
  const [userBoard, setUserBoard] = useState([]);
  const [difficulty, setDifficulty] = useState("easy");
  const [message, setMessage] = useState("");
  const [activeCell, setActiveCell] = useState(null);

  // Completion states
  const [completedRows, setCompletedRows] = useState([]);
  const [completedCols, setCompletedCols] = useState([]);
  const [completedBlocks, setCompletedBlocks] = useState([]);
  const [tempGlow, setTempGlow] = useState({}); // { "r-c": true }

  // Tone.js sounds
  const rowColSoundRef = useRef(null);
  const blockSoundRef = useRef(null);
  const combinedSoundRef = useRef(null);
  const completeSoundRef = useRef(null);
  const confettiRef = useRef(null);

  useEffect(() => {
    const full = generateFullSolution();
    const p = removeNumbers(full, difficulty);
    setSolution(full);
    setPuzzle(p);
    setUserBoard(p.map(r => [...r]));
    setCompletedRows([]);
    setCompletedCols([]);
    setCompletedBlocks([]);
    setMessage("");
    setTempGlow({});
    setActiveCell(null);
  }, [difficulty]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const loadEffects = async () => {
      try {
        const [{ Synth, MembraneSynth, FMSynth }, confettiModule] = await Promise.all([
          import("tone"),
          import("canvas-confetti"),
        ]);

        if (cancelled) return;

        rowColSoundRef.current = new Synth().toDestination();
        blockSoundRef.current = new MembraneSynth().toDestination();
        combinedSoundRef.current = new FMSynth().toDestination();
        completeSoundRef.current = new MembraneSynth().toDestination();
        confettiRef.current = confettiModule.default;
      } catch {
        // If audio libraries fail to load we can still play without sound/celebrations.
        rowColSoundRef.current = null;
        blockSoundRef.current = null;
        combinedSoundRef.current = null;
        completeSoundRef.current = null;
        confettiRef.current = null;
      }
    };

    const scheduleLoad = () => {
      void loadEffects();
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(scheduleLoad);
    } else {
      window.setTimeout(scheduleLoad, 0);
    }

    return () => {
      cancelled = true;
      rowColSoundRef.current?.dispose?.();
      blockSoundRef.current?.dispose?.();
      combinedSoundRef.current?.dispose?.();
      completeSoundRef.current?.dispose?.();
      rowColSoundRef.current = null;
      blockSoundRef.current = null;
      combinedSoundRef.current = null;
      completeSoundRef.current = null;
      confettiRef.current = null;
    };
  }, []);

  const checkCompletion = useCallback(
    (board, row, col) => {
      const rowSound = rowColSoundRef.current;
      const blockTone = blockSoundRef.current;
      const comboSound = combinedSoundRef.current;
      const finishSound = completeSoundRef.current;
      const confettiInstance = confettiRef.current;

      let rowDone = false;
      let colDone = false;
      let blockDone = false;

      // row
      if (board[row].every(n => n !== 0) && board[row].every((n, i) => n === solution[row][i])) {
        if (!completedRows.includes(row)) {
          rowDone = true;
          setCompletedRows(prev => [...prev, row]);
        }
      }

      // column
      const colVals = board.map(r => r[col]);
      const solutionCol = solution.map(r => r[col]);
      if (colVals.every(n => n !== 0) && colVals.every((n, i) => n === solutionCol[i])) {
        if (!completedCols.includes(col)) {
          colDone = true;
          setCompletedCols(prev => [...prev, col]);
        }
      }

      // block
      const startRow = Math.floor(row / 3) * 3;
      const startCol = Math.floor(col / 3) * 3;
      const blockVals = [];
      const solutionBlock = [];
      for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
          blockVals.push(board[r][c]);
          solutionBlock.push(solution[r][c]);
        }
      }
      const blockKey = `${startRow}-${startCol}`;
      if (blockVals.every(n => n !== 0) && blockVals.every((n, i) => n === solutionBlock[i])) {
        if (!completedBlocks.includes(blockKey)) {
          blockDone = true;
          setCompletedBlocks(prev => [...prev, blockKey]);
        }
      }

      // trigger temporary glow for affected cells
      const temp = {};
      for (let i = 0; i < 9; i++) {
        if (rowDone) temp[`${row}-${i}`] = true;
        if (colDone) temp[`${i}-${col}`] = true;
      }
      for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
          if (blockDone) temp[`${r}-${c}`] = true;
        }
      }
      setTempGlow(temp);
      setTimeout(() => setTempGlow({}), 800); // glow stops after 0.8s

      // Sounds and messages
      if (rowDone && colDone && blockDone) {
        if (comboSound) comboSound.triggerAttackRelease("C4", "8n");
        setMessage("Row, Column & Block completed!");
      } else if (rowDone && colDone) {
        if (comboSound) comboSound.triggerAttackRelease("D4", "8n");
        setMessage("Row & Column completed!");
      } else if (rowDone) {
        if (rowSound) rowSound.triggerAttackRelease("C4", "8n");
        setMessage(`Row ${row + 1} completed!`);
      } else if (colDone) {
        if (rowSound) rowSound.triggerAttackRelease("D4", "8n");
        setMessage(`Column ${col + 1} completed!`);
      } else if (blockDone) {
        if (blockTone) blockTone.triggerAttackRelease("E4", "8n");
        setMessage(`Block completed!`);
      }
      setTimeout(() => setMessage(""), 2000);

      // full board
      if (board.flat().every((n, i) => n === solution.flat()[i])) {
        if (finishSound) finishSound.triggerAttackRelease("C6", "1n");
        confettiInstance?.({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
        setMessage("🎉 Sudoku Completed!");
      }
    },
    [
      solution,
      completedRows,
      completedCols,
      completedBlocks,
    ]
  );

  const updateCellValue = useCallback(
    (row, col, value) => {
      if (puzzle[row][col] !== 0) return;
      setUserBoard(prev => {
        const next = prev.map(r => [...r]);
        next[row][col] = value;
        checkCompletion(next, row, col);
        return next;
      });
    },
    [puzzle, checkCompletion]
  );

  useEffect(() => {
    const handleKey = (e) => {
      if (!/[1-9]/.test(e.key) && e.key !== "Backspace") return;
      const cell = document.activeElement?.dataset?.cell;
      if (!cell) return;
      const [r, c] = cell.split("-").map(Number);
      if (e.key === "Backspace") {
        updateCellValue(r, c, 0);
      } else {
        updateCellValue(r, c, parseInt(e.key, 10));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [updateCellValue]);

  const handleCellChange = useCallback(
    (row, col, rawValue) => {
      const sanitized = rawValue.replace(/\D/g, "").slice(-1);
      if (!sanitized) {
        updateCellValue(row, col, 0);
        return;
      }
      const value = parseInt(sanitized, 10);
      if (value >= 1 && value <= 9) {
        updateCellValue(row, col, value);
      }
    },
    [updateCellValue]
  );

  const handlePadInput = useCallback(
    (value) => {
      if (!activeCell) return;
      const [row, col] = activeCell;
      updateCellValue(row, col, value);
    },
    [activeCell, updateCellValue]
  );

  const getBlockColor = (r, c) => blockColors[Math.floor(r / 3)][Math.floor(c / 3)];
  const getCellGlowStyle = (r, c) => {
    const key = `${r}-${c}`;
    if (tempGlow[key]) return "brightness-125 scale-105 transition-all duration-500";
    return "";
  };

  return (
    <div className="cosmic-page">
      <FloatingBubbles count={12} area="full" zIndex={1} />
      {showSupportWidget && <SupportWidget />}

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-12 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
        <div
          className="cosmic-panel fade-in-up flex w-full max-w-4xl flex-col gap-6 px-5 py-8 text-center sm:px-8 lg:max-w-3xl"
          style={{ "--fade-duration": "0.8s", "--fade-distance": "20px" }}
        >
          <div className="space-y-2">
            <h1 className="cosmic-heading text-3xl font-bold sm:text-4xl">Sudoku</h1>
            <p className="text-xs uppercase tracking-[0.5em] text-white/60">
              Sleek logic for focused play
            </p>
          </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          {["easy", "medium", "hard", "evil"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`cosmic-pill px-4 py-1.5 font-semibold uppercase tracking-[0.4em] text-white/70 transition-all ${
                difficulty === d
                  ? "bg-white/25 text-white shadow-[0_0_18px_rgba(255,255,255,0.22)]"
                  : "hover:bg-white/10"
              }`}
              aria-pressed={difficulty === d}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 shadow-inner shadow-indigo-500/10 sm:p-4">
          <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
            {userBoard.map((row, r) =>
              row.map((num, c) => {
                const isGiven = puzzle[r][c] !== 0;
                const blockColor = getBlockColor(r, c);
                const glow = getCellGlowStyle(r, c);
                const isActive = activeCell && activeCell[0] === r && activeCell[1] === c;
                return (
                  <input
                    key={`${r}-${c}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[1-9]*"
                    maxLength={1}
                    data-cell={`${r}-${c}`}
                    value={num || ""}
                    readOnly={isGiven}
                    onFocus={() => setActiveCell(isGiven ? null : [r, c])}
                    onChange={(e) => handleCellChange(r, c, e.target.value)}
                    className={`${glow} ${
                      isActive ? "ring-2 ring-offset-2 ring-offset-slate-900/60 ring-violet-400" : ""
                    } flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-center text-base font-semibold text-white shadow-[0_6px_16px_rgba(14,116,144,0.12)] transition focus:border-white/40 focus:bg-white/10 focus:shadow-[0_0_18px_rgba(168,85,247,0.32)] sm:h-12 sm:w-12 sm:text-lg`}
                    style={{
                      background: blockColor,
                      color: isGiven ? "rgba(248, 250, 252, 0.85)" : "#fdf4ff",
                      fontWeight: isGiven ? "600" : "700",
                    }}
                    aria-label={`Row ${r + 1}, Column ${c + 1}`}
                  />
                );
              })
            )}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePadInput(num)}
                className="cosmic-pill h-10 min-w-[2.5rem] px-4 text-sm font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!activeCell}
                aria-disabled={!activeCell}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePadInput(0)}
              className="cosmic-pill h-10 min-w-[2.5rem] px-4 text-sm font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!activeCell}
              aria-disabled={!activeCell}
            >
              Clear
            </button>
          </div>
        </div>

          {message && (
            <p className="fade-in text-sm font-semibold text-white/80" style={{ "--fade-duration": "0.5s" }}>
              {message}
            </p>
          )}
        </div>
        <GameFooter
          gameName="Sudoku"
          creator="Howard Garns, with modern popularity driven by Nikoli"
          moreInfo={{
            url: "https://en.wikipedia.org/wiki/Sudoku",
            label: "the Sudoku article on Wikipedia",
          }}
          className="w-full max-w-md lg:max-w-xs lg:self-start"
        />
      </div>
    </div>
  );
}
