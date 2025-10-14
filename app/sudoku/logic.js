// app/sudoku/logic.js
// Sudoku generator + solver (backtracking). Exports generateSudoku(difficulty).

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isValid(board, row, col, num) {
  // check row / col
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  // check 3x3
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[boxRow + r][boxCol + c] === num) return false;
    }
  }
  return true;
}

// Count solutions with early exit when count > limit
function countSolutions(board, limit = 2) {
  let count = 0;
  function backtrack() {
    if (count >= limit) return;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(board, r, c, n)) {
              board[r][c] = n;
              backtrack();
              board[r][c] = 0;
              if (count >= limit) return;
            }
          }
          return;
        }
      }
    }
    // reached full board -> found solution
    count++;
  }
  backtrack();
  return count;
}

// generate a full valid board via randomized backtracking
function generateFullBoard() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  function fill(cell = 0) {
    if (cell === 81) return true;
    const r = Math.floor(cell / 9);
    const c = cell % 9;
    // try numbers in random order
    const nums = shuffle([1,2,3,4,5,6,7,8,9].slice());
    for (const n of nums) {
      if (isValid(board, r, c, n)) {
        board[r][c] = n;
        if (fill(cell + 1)) return true;
        board[r][c] = 0;
      }
    }
    return false;
  }

  fill(0);
  return board;
}

function deepCopy(board) {
  return board.map((r) => r.slice());
}

/**
 * generateSudoku(difficulty)
 * difficulty: 'easy' | 'medium' | 'hard'
 * returns { puzzle, solution } where both are 9x9 arrays (0 for empty)
 */
export function generateSudoku(difficulty = "medium") {
  // clues indicates how many filled cells remain (higher = easier)
  const cluesByDifficulty = {
    easy: 36,
    medium: 32,
    hard: 28,
  };
  const clues = cluesByDifficulty[difficulty] || 32;

  // 1. Generate full board
  const solution = generateFullBoard();

  // 2. Remove cells until we have desired number of clues, ensuring uniqueness
  const puzzle = deepCopy(solution);
  // positions list
  const positions = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) positions.push([r,c]);
  shuffle(positions);

  // target removals
  const targetRemovals = 81 - clues;
  let removals = 0;
  for (const [r,c] of positions) {
    if (removals >= targetRemovals) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    // Check uniqueness; copy board and count solutions up to 2
    const copy = deepCopy(puzzle);
    const solCount = countSolutions(copy, 2);

    if (solCount !== 1) {
      // revert - keep the number
      puzzle[r][c] = backup;
    } else {
      removals++;
    }
  }

  // If uniqueness loop didn't remove enough (rare), continue removing without uniqueness check
  if (removals < targetRemovals) {
    for (const [r,c] of positions) {
      if (removals >= targetRemovals) break;
      if (puzzle[r][c] !== 0) {
        puzzle[r][c] = 0;
        removals++;
      }
    }
  }

  return { puzzle, solution };
}
