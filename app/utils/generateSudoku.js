// app/utils/generateSudoku.js
export function generateSudoku(difficulty = "easy") {
  // Simple backtracking generator
  const SIZE = 9;
  const BOARD = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

  function isSafe(board, row, col, num) {
    for (let x = 0; x < SIZE; x++) {
      if (board[row][x] === num || board[x][col] === num) return false;
    }
    const startRow = row - (row % 3), startCol = col - (col % 3);
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        if (board[startRow + r][startCol + c] === num) return false;
    return true;
  }

  function fillBoard(board) {
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        if (board[i][j] === 0) {
          let nums = shuffleArray([...Array(SIZE)].map((_, idx) => idx + 1));
          for (let num of nums) {
            if (isSafe(board, i, j, num)) {
              board[i][j] = num;
              if (fillBoard(board)) return true;
              board[i][j] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  fillBoard(BOARD);

  // Remove numbers based on difficulty
  let empties;
  switch (difficulty) {
    case "easy": empties = 35; break;
    case "medium": empties = 45; break;
    case "hard": empties = 55; break;
    case "evil": empties = 60; break;
    default: empties = 35;
  }

  const givenMask = Array.from({ length: SIZE }, () => Array(SIZE).fill(true));
  while (empties > 0) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (BOARD[r][c] !== 0) {
      BOARD[r][c] = 0;
      givenMask[r][c] = false;
      empties--;
    }
  }

  return { puzzle: BOARD, givenMask };
}
