"use client";
import React from "react";

export default function Cell({ size, row, col, data, setGrid }) {
  const { isMine, adjacentMines, revealed, flagged } = data;

  const handleLeftClick = (e) => {
    e.preventDefault();
    if (revealed || flagged) return;

    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((r) => r.map((c) => ({ ...c })));

      const reveal = (r, c) => {
        if (
          r < 0 ||
          r >= newGrid.length ||
          c < 0 ||
          c >= newGrid[0].length ||
          newGrid[r][c].revealed ||
          newGrid[r][c].flagged
        )
          return;

        newGrid[r][c].revealed = true;

        if (newGrid[r][c].adjacentMines === 0 && !newGrid[r][c].isMine) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr !== 0 || dc !== 0) reveal(r + dr, c + dc);
            }
          }
        }
      };

      reveal(row, col);

      return newGrid;
    });
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    if (revealed) return;

    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((r) => r.map((c) => ({ ...c })));
      newGrid[row][col].flagged = !newGrid[row][col].flagged;
      return newGrid;
    });
  };

  const getCellContent = () => {
    if (!revealed) return flagged ? "🚩" : "";
    if (isMine) return "💣";
    return adjacentMines > 0 ? adjacentMines : "";
  };

  return (
    <div
      onClick={handleLeftClick}
      onContextMenu={handleRightClick}
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: revealed ? "#ddd" : "#888",
        color: revealed && !isMine ? "black" : "white",
        fontWeight: "bold",
        border: "1px solid #555",
        userSelect: "none",
        fontSize: size * 0.6,
        cursor: "pointer",
      }}
    >
      {getCellContent()}
    </div>
  );
}
