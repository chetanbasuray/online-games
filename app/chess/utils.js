const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const DIFFICULTIES = [
  {
    id: "beginner",
    label: "Beginner (~800 ELO)",
    description: "Gentle skill level with short search depth for learning the basics.",
    skill: 1,
    depth: 6,
    minRating: 0,
  },
  {
    id: "intermediate",
    label: "Intermediate (~1100 ELO)",
    description: "Balanced search settings suited for casual club play.",
    skill: 5,
    depth: 8,
    minRating: 950,
  },
  {
    id: "advanced",
    label: "Advanced (~1400 ELO)",
    description: "Sharper replies that challenge strong hobbyists.",
    skill: 10,
    depth: 12,
    minRating: 1250,
  },
  {
    id: "expert",
    label: "Expert (~1750 ELO)",
    description: "Deeper calculations for seasoned tournament players.",
    skill: 15,
    depth: 16,
    minRating: 1600,
  },
  {
    id: "master",
    label: "Master (~2100 ELO)",
    description: "Maximum strength settings approaching titled play.",
    skill: 20,
    depth: 18,
    minRating: 1950,
  },
];

export const PIECES = {
  p: "♟",
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  P: "♙",
  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔",
};

export const DEFAULT_RATING = 1200;
export const LOCAL_STORAGE_KEY = "online-games-chess-progress";
export const DEFAULT_DIFFICULTY_ID = DIFFICULTIES[1]?.id ?? DIFFICULTIES[0].id;

export const STOCKFISH_CDN_URLS = [
  "https://cdn.jsdelivr.net/npm/stockfish@16.1.0/dist/stockfish.js",
  "https://cdn.jsdelivr.net/npm/stockfish@16.1.0/src/stockfish.js",
  "https://cdn.jsdelivr.net/npm/stockfish@16.1.0/stockfish.js",
  "https://unpkg.com/stockfish@16.1.0/dist/stockfish.js",
];

export const fenToBoard = (fen) => {
  if (typeof fen !== "string") {
    throw new TypeError("FEN must be a string");
  }
  const [boardSection] = fen.split(" ");
  return boardSection.split("/").map((rank) => {
    const squares = [];
    for (const char of rank) {
      if (/^[1-8]$/.test(char)) {
        const emptySquares = Number(char);
        for (let i = 0; i < emptySquares; i += 1) {
          squares.push(null);
        }
      } else {
        squares.push(char);
      }
    }
    return squares;
  });
};

export const getSquareName = (fileIndex, rankIndex) => {
  if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) {
    throw new RangeError("Square coordinates out of bounds");
  }
  const file = FILES[fileIndex];
  const rank = 8 - rankIndex;
  return `${file}${rank}`;
};

export const parseSquare = (square) => {
  if (!/^[a-h][1-8]$/.test(square)) {
    throw new Error("Invalid square");
  }
  const fileIndex = FILES.indexOf(square[0]);
  const rankIndex = 8 - Number(square[1]);
  return { fileIndex, rankIndex };
};

export const ratingToDifficultyId = (rating) => {
  const normalized = Number.isFinite(rating) ? rating : DEFAULT_RATING;
  const sorted = [...DIFFICULTIES].sort((a, b) => a.minRating - b.minRating);
  let selected = sorted[0];
  for (const level of sorted) {
    if (normalized >= level.minRating) {
      selected = level;
    }
  }
  return selected.id;
};

export const adjustRating = (currentRating, opponentRating, result) => {
  const player = Number.isFinite(currentRating) ? currentRating : DEFAULT_RATING;
  const opponent = Number.isFinite(opponentRating) ? opponentRating : player;
  const expected = 1 / (1 + 10 ** ((opponent - player) / 400));
  const score = result === "win" ? 1 : result === "draw" ? 0.5 : 0;
  const K = 32;
  return Math.round(player + K * (score - expected));
};

export const difficultyById = new Map(DIFFICULTIES.map((level) => [level.id, level]));

export const sanitizeMovesList = (moves) => {
  if (!Array.isArray(moves)) return [];
  return moves.filter((move) => typeof move === "string" && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move));
};

export const bestMoveToAlgebraic = (move) => {
  if (!move || move === "(none)" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
    return null;
  }
  const from = move.slice(0, 2);
  const to = move.slice(2, 4);
  const promo = move.slice(4);
  return promo ? `${from} → ${to} (${promo.toUpperCase()})` : `${from} → ${to}`;
};

export const moveDisplayList = (moves) =>
  sanitizeMovesList(moves).map((move, index) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const isPlayerMove = index % 2 === 0;
    const label = bestMoveToAlgebraic(move);
    return {
      id: `${index}-${move}`,
      moveNumber,
      label,
      isPlayerMove,
    };
  });

