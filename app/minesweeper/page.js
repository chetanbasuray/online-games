"use client";
import { useState, useEffect } from "react";
import DifficultySelector from "../components/DifficultySelector";
import Cell from "../components/Cell";

const DIFFICULTIES = {
  Easy: { rows: 8, cols: 8, mines: 10 },
  Medium: { rows: 16, cols: 16, mines: 40 },
  Hard: { rows: 16, cols: 30, mines: 99 },
};

// helper: generate empty grid
const generateEmptyGrid = (rows, cols) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      adjacentMines: 0,
      revealed: false,
      flagged: false,
    }))
  );

// helper: place mines randomly
const placeMines = (grid, numMines) => {
  const rows = grid.length;
  const cols = grid[0].length;
  let placed = 0;
  while (placed < numMines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!grid[r][c].isMine) {
      grid[r][c].isMine = true;
      placed++;
    }
  }
  return grid;
};

// helper: calculate adjacent mines
const calculateAdjacent = (grid) => {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr,
            nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].isMine)
            count++;
        }
      }
      grid[r][c].adjacentMines = count;
    }
  }
  return grid;
};

export default function MinesweeperPage() {
  const [difficulty, setDifficulty] = useState("Easy");
  const [grid, setGrid] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);

  const { rows, cols, mines } = DIFFICULTIES[difficulty];

  // Initialize or load game
  useEffect(() => {
    const saved = localStorage.getItem(`minesweeper-${difficulty}`);
    if (saved) setGrid(JSON.parse(saved));
    else startNewGame();
  }, [difficulty]);

  const startNewGame = () => {
    if (!confirm("Current game will be lost. Do you accept?")) return;
    let newGrid = generateEmptyGrid(rows, cols);
    newGrid = placeMines(newGrid, mines);
    newGrid = calculateAdjacent(newGrid);
    setGrid(newGrid);
    setGameOver(false);
    setVictory(false);
    localStorage.setItem(`minesweeper-${difficulty}`, JSON.stringify(newGrid));
  };

  // Save grid on each change
  useEffect(() => {
    if (grid.length) localStorage.setItem(`minesweeper-${difficulty}`, JSON.stringify(grid));
  }, [grid]);

  // Check victory
  useEffect(() => {
    if (!grid.length) return;
    const allRevealed = grid.flat().every(
      (cell) => cell.revealed || cell.isMine
    );
    if (allRevealed && !gameOver) {
      setVictory(true);
      new Audio("/sounds/victory.mp3").play();
    }
  }, [grid]);

  const handleGameOver = () => {
    setGameOver(true);
    new Audio("/sounds/explosion.mp3").play();
    // reveal all mines
    setGrid((prev) =>
      prev.map((row) =>
        row.map((cell) => (cell.isMine ? { ...cell, revealed: true } : cell))
      )
    );
  };

  // Responsive cell size
  const gridWidth = window.innerWidth * 0.95 || 800;
  const gridHeight = window.innerHeight * 0.7 || 600;
  const scaleX = gridWidth / cols;
  const scaleY = gridHeight / rows;
  const cellSize = Math.min(scaleX, scaleY);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4">
      <DifficultySelector difficulty={difficulty} setDifficulty={setDifficulty} />
      <div style={{ marginTop: "10px" }}>
        <button
          onClick={startNewGame}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition mr-2"
        >
          New Game
        </button>
        <span className="text-sm ml-2 text-gray-200">
          All games are stored locally. Clearing browser data will reset progress.
        </span>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap: "1px",
          marginTop: "20px",
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <Cell
              key={`${r}-${c}`}
              size={cellSize}
              row={r}
              col={c}
              data={cell}
              setGrid={(newGrid) => {
                setGrid(newGrid);
                if (newGrid[r][c].isMine && !newGrid[r][c].revealed)
                  handleGameOver();
              }}
            />
          ))
        )}
      </div>

      {/* Game Over / Victory message */}
      {gameOver && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-60 flex items-center justify-center text-4xl font-bold text-red-500">
          💥 Game Over
        </div>
      )}
      {victory && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-60 flex items-center justify-center text-4xl font-bold text-green-400">
          🎉 You Win!
        </div>
      )}
    </div>
  );
}
