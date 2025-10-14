"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  ["#FFD7BA", "#FFE9BA", "#D3FFC9"],
  ["#BAF0FF", "#BABDFF", "#E9BAFF"],
  ["#FFC8DE", "#FFF2BA", "#BAFFD6"],
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
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
      {/* Bubbles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div key={i} className="absolute bg-white rounded-full opacity-30 pointer-events-none"
          style={{
            width: `${4 + Math.random() * 8}vmin`,
            height: `${4 + Math.random() * 8}vmin`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{ y: ["0%", "-20%", "0%"], x: ["0%", "5%", "0%"] }}
          transition={{ duration: 3 + Math.random() * 5, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Sudoku</h1>
      <div className="flex gap-4 mb-4">
        {["easy","medium","hard","evil"].map(d => (
          <button key={d} onClick={()=>setDifficulty(d)}
            className={`px-4 py-2 font-bold rounded ${difficulty===d?"bg-white text-purple-700":"bg-purple-200 text-white"}`}>
            {d.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Sudoku Board */}
      <div className="grid grid-cols-9 gap-1 bg-white rounded-lg p-2">
        {userBoard.map((row,r) =>
          row.map((num,c)=>{
            const isGiven = puzzle[r][c] !== 0;
            const blockColor = getBlockColor(r,c);
            const glow = getCellGlowStyle(r,c);
            return (
              <input key={`${r}-${c}`}
                type="text"
                maxLength={1}
                data-cell={`${r}-${c}`}
                value={num || ""}
                readOnly={isGiven}
                className={`${glow} text-center text-lg sm:text-xl w-12 h-12 sm:w-14 sm:h-14 rounded-md focus:outline-none`}
                style={{ backgroundColor: blockColor, color: isGiven ? "black" : "white" }}
              />
            );
          })
        )}
      </div>

      {message && <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.5}}
        className="mt-4 text-white font-bold text-lg">{message}</motion.p>}
    </div>
  );
}
