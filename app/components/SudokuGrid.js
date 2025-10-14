// app/components/SudokuGrid.js
"use client";
import { useState, useEffect } from "react";
import * as Tone from "tone";
import { motion, AnimatePresence } from "framer-motion";

export default function SudokuGrid({ puzzleData, givenMask, onComplete }) {
  const SIZE = 9;
  const [board, setBoard] = useState(puzzleData.map(r => [...r]));
  const [selected, setSelected] = useState([0, 0]);
  const [completedRows, setCompletedRows] = useState(new Set());
  const [completedCols, setCompletedCols] = useState(new Set());
  const [completedBlocks, setCompletedBlocks] = useState(new Set());
  const [highlightCells, setHighlightCells] = useState([]); // cells to animate

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      const [row, col] = selected;
      if (givenMask[row][col]) return; // Cannot edit given numbers
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = num;
        setBoard(newBoard);
        checkCompletion(newBoard);
      } else if (e.key === "Backspace") {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = 0;
        setBoard(newBoard);
      } else if (e.key === "ArrowUp") setSelected([row > 0 ? row - 1 : row, col]);
      else if (e.key === "ArrowDown") setSelected([row < 8 ? row + 1 : row, col]);
      else if (e.key === "ArrowLeft") setSelected([row, col > 0 ? col - 1 : col]);
      else if (e.key === "ArrowRight") setSelected([row, col < 8 ? col + 1 : col]);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, board]);

  // Completion checks
  const checkCompletion = (newBoard) => {
    const newHighlights = [];

    // Rows
    newBoard.forEach((rowArr, r) => {
      if (rowArr.every(v => v !== 0) && !completedRows.has(r)) {
        setCompletedRows(prev => new Set(prev).add(r));
        playTone();
        for (let c = 0; c < SIZE; c++) newHighlights.push([r, c]);
      }
    });

    // Columns
    for (let c = 0; c < SIZE; c++) {
      if (newBoard.every(row => row[c] !== 0) && !completedCols.has(c)) {
        setCompletedCols(prev => new Set(prev).add(c));
        playTone();
        for (let r = 0; r < SIZE; r++) newHighlights.push([r, c]);
      }
    }

    // 3x3 blocks
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const blockId = `${br}-${bc}`;
        if (!completedBlocks.has(blockId)) {
          let complete = true;
          for (let r = br * 3; r < br * 3 + 3; r++)
            for (let c = bc * 3; c < bc * 3 + 3; c++)
              if (newBoard[r][c] === 0) complete = false;
          if (complete) {
            setCompletedBlocks(prev => new Set(prev).add(blockId));
            playTone();
            for (let r = br * 3; r < br * 3 + 3; r++)
              for (let c = bc * 3; c < bc * 3 + 3; c++)
                newHighlights.push([r, c]);
          }
        }
      }
    }

    if (newHighlights.length > 0) {
      setHighlightCells(newHighlights);
      setTimeout(() => setHighlightCells([]), 600); // remove highlight after animation
    }

    // Full board completion
    if (newBoard.flat().every(v => v !== 0)) {
      playTone(true);
      onComplete && onComplete();
    }
  };

  const playTone = (victory = false) => {
    const synth = new Tone.Synth().toDestination();
    if (victory) synth.triggerAttackRelease("C6", "0.5");
    else synth.triggerAttackRelease("C4", "0.2");
  };

  return (
    <div className="grid grid-rows-9 gap-0.5">
      {board.map((rowArr, r) => (
        <div key={r} className="grid grid-cols-9 gap-0.5">
          {rowArr.map((num, c) => {
            const blockColor = (Math.floor(r/3) + Math.floor(c/3)) % 2 === 0 ? "bg-purple-200" : "bg-purple-400";
            const textColor = givenMask[r][c] ? "text-black font-bold" : "text-white font-semibold";
            const isSelected = selected[0] === r && selected[1] === c;
            const isHighlighted = highlightCells.some(([hr, hc]) => hr === r && hc === c);

            return (
              <motion.div
                key={c}
                onClick={() => setSelected([r, c])}
                initial={{ scale: 1 }}
                animate={isHighlighted ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.4 }}
                className={`w-12 h-12 flex items-center justify-center cursor-pointer ${blockColor} ${textColor} ${isSelected ? "ring-2 ring-yellow-400" : ""}`}
              >
                {num !== 0 ? num : ""}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
