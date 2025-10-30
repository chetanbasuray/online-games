"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FloatingBubbles from "../components/FloatingBubbles";
import * as Tone from "tone";
import confetti from "canvas-confetti";

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

export default function SudokuPage() {
  const [solution, setSolution] = useState([]);
  const [puzzle, setPuzzle] = useState([]);
  const [userBoard, setUserBoard] = useState([]);
  const [difficulty, setDifficulty] = useState("easy");
  const [message, setMessage] = useState("");

  // Completion states
  const [completedRows, setCompletedRows] = useState([]);
  const [completedCols, setCompletedCols] = useState([]);
  const [completedBlocks, setCompletedBlocks] = useState([]);
  const [tempGlow, setTempGlow] = useState({}); // { "r-c": true }

  // Tone.js sounds
  const [rowColSound, setRowColSound] = useState(null);
  const [blockSound, setBlockSound] = useState(null);
  const [combinedSound, setCombinedSound] = useState(null);
  const [completeSound, setCompleteSound] = useState(null);

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
  }, [difficulty]);

  useEffect(() => {
    setRowColSound(new Tone.Synth().toDestination());
    setBlockSound(new Tone.MembraneSynth().toDestination());
    setCombinedSound(new Tone.FMSynth().toDestination());
    setCompleteSound(new Tone.MembraneSynth().toDestination());
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (!/[1-9]/.test(e.key) && e.key !== "Backspace") return;
      const cell = document.activeElement.dataset.cell;
      if (!cell) return;
      const [r, c] = cell.split("-").map(Number);
      if (puzzle[r][c] !== 0) return;
      const newBoard = userBoard.map(row => [...row]);
      if (e.key === "Backspace") newBoard[r][c] = 0;
      else newBoard[r][c] = parseInt(e.key);
      setUserBoard(newBoard);
      checkCompletion(newBoard, r, c);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [userBoard, puzzle, completedRows, completedCols, completedBlocks]);

  const checkCompletion = (board, row, col) => {
    let rowDone = false, colDone = false, blockDone = false;

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
      if (combinedSound) combinedSound.triggerAttackRelease("C4", "8n");
      setMessage("Row, Column & Block completed!");
    } else if (rowDone && colDone) {
      if (combinedSound) combinedSound.triggerAttackRelease("D4", "8n");
      setMessage("Row & Column completed!");
    } else if (rowDone) {
      if (rowColSound) rowColSound.triggerAttackRelease("C4", "8n");
      setMessage(`Row ${row + 1} completed!`);
    } else if (colDone) {
      if (rowColSound) rowColSound.triggerAttackRelease("D4", "8n");
      setMessage(`Column ${col + 1} completed!`);
    } else if (blockDone) {
      if (blockSound) blockSound.triggerAttackRelease("E4", "8n");
      setMessage(`Block completed!`);
    }
    setTimeout(() => setMessage(""), 2000);

    // full board
    if (board.flat().every((n, i) => n === solution.flat()[i])) {
      if (completeSound) completeSound.triggerAttackRelease("C6", "1n");
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
      setMessage("🎉 Sudoku Completed!");
    }
  };

  const getBlockColor = (r, c) => blockColors[Math.floor(r / 3)][Math.floor(c / 3)];
  const getCellGlowStyle = (r, c) => {
    const key = `${r}-${c}`;
    if (tempGlow[key]) return "brightness-125 scale-105 transition-all duration-500";
    return "";
  };

  return (
    <div className="cosmic-page">
      <FloatingBubbles count={12} area="full" zIndex={1} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="cosmic-panel relative z-10 flex w-full max-w-5xl flex-col items-center gap-8 px-6 py-10 text-center lg:px-12"
      >
        <div className="space-y-3">
          <h1 className="cosmic-heading text-4xl font-bold sm:text-5xl">Sudoku</h1>
          <p className="text-sm uppercase tracking-[0.5em] text-white/60">
            Logic illuminated by neon focus
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {["easy", "medium", "hard", "evil"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`cosmic-pill px-6 py-2 text-xs font-semibold uppercase tracking-[0.45em] text-white/70 ${
                difficulty === d ? "bg-white/25 text-white shadow-[0_0_20px_rgba(255,255,255,0.25)]" : ""
              }`}
              aria-pressed={difficulty === d}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40 p-3 shadow-inner shadow-indigo-500/20 sm:p-6">
          <div className="grid grid-cols-9 gap-[0.35rem] sm:gap-2">
            {userBoard.map((row, r) =>
              row.map((num, c) => {
                const isGiven = puzzle[r][c] !== 0;
                const blockColor = getBlockColor(r, c);
                const glow = getCellGlowStyle(r, c);
                return (
                  <input
                    key={`${r}-${c}`}
                    type="text"
                    maxLength={1}
                    data-cell={`${r}-${c}`}
                    value={num || ""}
                    readOnly={isGiven}
                    className={`${glow} flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-center text-lg font-semibold text-white shadow-[0_8px_20px_rgba(14,116,144,0.12)] transition focus:border-white/40 focus:bg-white/10 focus:shadow-[0_0_22px_rgba(168,85,247,0.35)] sm:h-14 sm:w-14 sm:text-xl`}
                    style={{
                      background: blockColor,
                      color: isGiven ? "rgba(248, 250, 252, 0.85)" : "#fdf4ff",
                      fontWeight: isGiven ? "600" : "700",
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-base font-semibold text-white/80"
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
