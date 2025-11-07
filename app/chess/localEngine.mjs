const WHITE = 1;
const BLACK = -1;

const PIECE_TYPES = {
  PAWN: 1,
  KNIGHT: 2,
  BISHOP: 3,
  ROOK: 4,
  QUEEN: 5,
  KING: 6,
};

const PIECE_FROM_CHAR = {
  p: PIECE_TYPES.PAWN,
  n: PIECE_TYPES.KNIGHT,
  b: PIECE_TYPES.BISHOP,
  r: PIECE_TYPES.ROOK,
  q: PIECE_TYPES.QUEEN,
  k: PIECE_TYPES.KING,
};

const PIECE_CHAR_FROM_TYPE = Object.fromEntries(
  Object.entries(PIECE_FROM_CHAR).map(([char, type]) => [type, char]),
);

const PROMOTION_CHARS = {
  [PIECE_TYPES.QUEEN]: "q",
  [PIECE_TYPES.ROOK]: "r",
  [PIECE_TYPES.BISHOP]: "b",
  [PIECE_TYPES.KNIGHT]: "n",
};

const CASTLING = {
  WHITE_KING: 1 << 0,
  WHITE_QUEEN: 1 << 1,
  BLACK_KING: 1 << 2,
  BLACK_QUEEN: 1 << 3,
};

const MOVE_FLAGS = {
  CAPTURE: 1 << 0,
  PROMOTION: 1 << 1,
  EN_PASSANT: 1 << 2,
  CASTLE_KING: 1 << 3,
  CASTLE_QUEEN: 1 << 4,
  DOUBLE_PAWN: 1 << 5,
};

const KNIGHT_OFFSETS = [-33, -31, -18, -14, 14, 18, 31, 33];
const BISHOP_OFFSETS = [-17, -15, 15, 17];
const ROOK_OFFSETS = [-16, -1, 1, 16];
const KING_OFFSETS = [-17, -16, -15, -1, 1, 15, 16, 17];

const MATE_VALUE = 100000;

const PIECE_VALUES = {
  [PIECE_TYPES.PAWN]: 100,
  [PIECE_TYPES.KNIGHT]: 320,
  [PIECE_TYPES.BISHOP]: 330,
  [PIECE_TYPES.ROOK]: 500,
  [PIECE_TYPES.QUEEN]: 900,
  [PIECE_TYPES.KING]: 0,
};

const SQUARES = {
  a1: algebraicToSquare("a1"),
  h1: algebraicToSquare("h1"),
  e1: algebraicToSquare("e1"),
  a8: algebraicToSquare("a8"),
  h8: algebraicToSquare("h8"),
  e8: algebraicToSquare("e8"),
};

function isOnBoard(square) {
  return (square & 0x88) === 0;
}

function squareToAlgebraic(square) {
  const file = square & 7;
  const rank = 8 - (square >> 4);
  return String.fromCharCode(97 + file) + rank;
}

function algebraicToSquare(coord) {
  if (!/^[a-h][1-8]$/.test(coord)) {
    throw new Error(`Invalid square: ${coord}`);
  }
  const file = coord.charCodeAt(0) - 97;
  const rank = 8 - Number(coord[1]);
  return (rank << 4) | file;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createMove(from, to, promotion = 0, flags = 0) {
  const promotionChar = promotion ? PROMOTION_CHARS[promotion] ?? "" : "";
  return {
    from,
    to,
    promotion,
    flags,
    uci: squareToAlgebraic(from) + squareToAlgebraic(to) + promotionChar,
  };
}

function pieceColor(piece) {
  if (piece > 0) return WHITE;
  if (piece < 0) return BLACK;
  return 0;
}

function pieceType(piece) {
  return Math.abs(piece);
}

export class LocalEngine {
  constructor({ random = Math.random } = {}) {
    this.board = new Int8Array(128);
    this.sideToMove = WHITE;
    this.castling = 0;
    this.enPassant = -1;
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
    this.history = [];
    this.skill = 10;
    this.maxDepth = 4;
    this.noiseWindow = 0;
    this.random = random;
    this.reset();
  }

  reset() {
    this.loadFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  }

  loadFen(fen) {
    if (typeof fen !== "string") {
      throw new TypeError("FEN must be a string");
    }
    const parts = fen.trim().split(/\s+/);
    if (parts.length < 4) {
      throw new Error(`Invalid FEN: ${fen}`);
    }
    const [boardPart, sidePart, castlingPart, epPart, halfmovePart = "0", fullmovePart = "1"] = parts;

    this.board.fill(0);
    let rank = 0;
    let file = 0;
    for (const char of boardPart) {
      if (char === "/") {
        rank += 1;
        file = 0;
        continue;
      }
      if (/^[1-8]$/.test(char)) {
        file += Number(char);
        continue;
      }
      const lower = char.toLowerCase();
      const type = PIECE_FROM_CHAR[lower];
      if (!type) {
        throw new Error(`Invalid piece in FEN: ${char}`);
      }
      const color = char === lower ? BLACK : WHITE;
      const square = (rank << 4) | file;
      this.board[square] = color * type;
      file += 1;
    }

    this.sideToMove = sidePart === "w" ? WHITE : BLACK;

    let castlingMask = 0;
    if (castlingPart.includes("K")) castlingMask |= CASTLING.WHITE_KING;
    if (castlingPart.includes("Q")) castlingMask |= CASTLING.WHITE_QUEEN;
    if (castlingPart.includes("k")) castlingMask |= CASTLING.BLACK_KING;
    if (castlingPart.includes("q")) castlingMask |= CASTLING.BLACK_QUEEN;
    this.castling = castlingMask;

    this.enPassant = epPart === "-" ? -1 : algebraicToSquare(epPart);
    this.halfmoveClock = Number.parseInt(halfmovePart, 10) || 0;
    this.fullmoveNumber = Number.parseInt(fullmovePart, 10) || 1;
    this.history = [];
  }

  setSkillLevel(skill) {
    const normalized = clamp(Number(skill) || 0, 0, 20);
    this.skill = normalized;
    if (normalized <= 2) {
      this.maxDepth = 2;
      this.noiseWindow = 120;
    } else if (normalized <= 6) {
      this.maxDepth = 3;
      this.noiseWindow = 80;
    } else if (normalized <= 10) {
      this.maxDepth = 4;
      this.noiseWindow = 50;
    } else if (normalized <= 15) {
      this.maxDepth = 5;
      this.noiseWindow = 30;
    } else {
      this.maxDepth = 6;
      this.noiseWindow = 10;
    }
  }

  loadStartPosition() {
    this.reset();
  }

  applyMoves(moves) {
    if (!Array.isArray(moves)) return;
    for (const move of moves) {
      this.makeMoveFromUci(move);
    }
  }

  makeMoveFromUci(uci) {
    if (typeof uci !== "string" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) {
      throw new Error(`Invalid UCI move: ${uci}`);
    }
    const legal = this.generateLegalMoves();
    const match = legal.find((move) => move.uci === uci);
    if (!match) {
      throw new Error(`Illegal move attempted: ${uci}`);
    }
    this.makeMove(match);
  }

  makeMove(move) {
    const us = this.sideToMove;
    const piece = this.board[move.from];
    const record = {
      move,
      piece,
      captured: 0,
      capturedSquare: move.to,
      castling: this.castling,
      enPassant: this.enPassant,
      halfmoveClock: this.halfmoveClock,
      fullmoveNumber: this.fullmoveNumber,
      rookFrom: -1,
      rookTo: -1,
    };

    if ((move.flags & MOVE_FLAGS.EN_PASSANT) !== 0) {
      const capSquare = move.to + (us === WHITE ? 16 : -16);
      record.capturedSquare = capSquare;
      record.captured = this.board[capSquare];
      this.board[capSquare] = 0;
    } else {
      record.captured = this.board[move.to];
    }

    this.board[move.to] = this.board[move.from];
    this.board[move.from] = 0;

    if ((move.flags & MOVE_FLAGS.PROMOTION) !== 0 && move.promotion) {
      this.board[move.to] = us * move.promotion;
    }

    if ((move.flags & MOVE_FLAGS.CASTLE_KING) !== 0 || (move.flags & MOVE_FLAGS.CASTLE_QUEEN) !== 0) {
      if (move.to > move.from) {
        const rookFrom = move.to + 1;
        const rookTo = move.to - 1;
        record.rookFrom = rookFrom;
        record.rookTo = rookTo;
        this.board[rookTo] = this.board[rookFrom];
        this.board[rookFrom] = 0;
      } else {
        const rookFrom = move.to - 2;
        const rookTo = move.to + 1;
        record.rookFrom = rookFrom;
        record.rookTo = rookTo;
        this.board[rookTo] = this.board[rookFrom];
        this.board[rookFrom] = 0;
      }
    }

    this.updateCastlingRights(move.from, record.capturedSquare, piece);

    if ((move.flags & MOVE_FLAGS.DOUBLE_PAWN) !== 0) {
      this.enPassant = move.to + (us === WHITE ? 16 : -16);
    } else {
      this.enPassant = -1;
    }

    if (pieceType(piece) === PIECE_TYPES.PAWN || record.captured !== 0) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock += 1;
    }

    if (us === BLACK) {
      this.fullmoveNumber += 1;
    }

    this.sideToMove = -us;
    this.history.push(record);
  }

  undoMove() {
    const record = this.history.pop();
    if (!record) return false;
    this.sideToMove = -this.sideToMove;

    this.castling = record.castling;
    this.enPassant = record.enPassant;
    this.halfmoveClock = record.halfmoveClock;
    this.fullmoveNumber = record.fullmoveNumber;

    const { move, piece, captured, capturedSquare, rookFrom, rookTo } = record;

    if (rookFrom !== -1 && rookTo !== -1) {
      this.board[rookFrom] = this.board[rookTo];
      this.board[rookTo] = 0;
    }

    this.board[move.from] = piece;

    if ((move.flags & MOVE_FLAGS.PROMOTION) !== 0 && move.promotion) {
      this.board[move.from] = this.sideToMove * PIECE_TYPES.PAWN;
    }

    this.board[move.to] = 0;
    if (captured !== 0) {
      this.board[capturedSquare] = captured;
    }

    return true;
  }

  updateCastlingRights(from, captureSquare, piece) {
    const type = pieceType(piece);
    const color = pieceColor(piece);
    if (type === PIECE_TYPES.KING) {
      if (color === WHITE) {
        this.castling &= ~(CASTLING.WHITE_KING | CASTLING.WHITE_QUEEN);
      } else {
        this.castling &= ~(CASTLING.BLACK_KING | CASTLING.BLACK_QUEEN);
      }
    } else if (type === PIECE_TYPES.ROOK) {
      if (color === WHITE) {
        if (from === SQUARES.a1) this.castling &= ~CASTLING.WHITE_QUEEN;
        if (from === SQUARES.h1) this.castling &= ~CASTLING.WHITE_KING;
      } else {
        if (from === SQUARES.a8) this.castling &= ~CASTLING.BLACK_QUEEN;
        if (from === SQUARES.h8) this.castling &= ~CASTLING.BLACK_KING;
      }
    }

    if (captureSquare === SQUARES.a1) this.castling &= ~CASTLING.WHITE_QUEEN;
    if (captureSquare === SQUARES.h1) this.castling &= ~CASTLING.WHITE_KING;
    if (captureSquare === SQUARES.a8) this.castling &= ~CASTLING.BLACK_QUEEN;
    if (captureSquare === SQUARES.h8) this.castling &= ~CASTLING.BLACK_KING;
  }

  generatePseudoLegalMoves() {
    const moves = [];
    const us = this.sideToMove;
    for (let square = 0; square < 128; square += 1) {
      if (!isOnBoard(square)) {
        square += 7;
        continue;
      }
      const piece = this.board[square];
      if (piece === 0 || pieceColor(piece) !== us) continue;
      const type = pieceType(piece);
      switch (type) {
        case PIECE_TYPES.PAWN:
          this.addPawnMoves(square, moves, us);
          break;
        case PIECE_TYPES.KNIGHT:
          this.addLeaperMoves(square, moves, us, KNIGHT_OFFSETS);
          break;
        case PIECE_TYPES.BISHOP:
          this.addSliderMoves(square, moves, us, BISHOP_OFFSETS);
          break;
        case PIECE_TYPES.ROOK:
          this.addSliderMoves(square, moves, us, ROOK_OFFSETS);
          break;
        case PIECE_TYPES.QUEEN:
          this.addSliderMoves(square, moves, us, BISHOP_OFFSETS.concat(ROOK_OFFSETS));
          break;
        case PIECE_TYPES.KING:
          this.addLeaperMoves(square, moves, us, KING_OFFSETS);
          this.addCastlingMoves(square, moves, us);
          break;
        default:
          break;
      }
    }
    return moves;
  }

  addPawnMoves(square, moves, color) {
    const forward = color === WHITE ? -16 : 16;
    const startRank = color === WHITE ? 6 : 1;
    const promotionRank = color === WHITE ? 0 : 7;

    const oneForward = square + forward;
    if (isOnBoard(oneForward) && this.board[oneForward] === 0) {
      if ((oneForward >> 4) === promotionRank) {
        for (const promotionType of [PIECE_TYPES.QUEEN, PIECE_TYPES.ROOK, PIECE_TYPES.BISHOP, PIECE_TYPES.KNIGHT]) {
          moves.push(createMove(square, oneForward, promotionType, MOVE_FLAGS.PROMOTION));
        }
      } else {
        moves.push(createMove(square, oneForward));
      }
      if ((square >> 4) === startRank) {
        const twoForward = oneForward + forward;
        if (isOnBoard(twoForward) && this.board[twoForward] === 0) {
          moves.push(createMove(square, twoForward, 0, MOVE_FLAGS.DOUBLE_PAWN));
        }
      }
    }

    const captures = color === WHITE ? [-17, -15] : [15, 17];
    for (const offset of captures) {
      const target = square + offset;
      if (!isOnBoard(target)) continue;
      const targetPiece = this.board[target];
      if (targetPiece !== 0 && pieceColor(targetPiece) === -color) {
        if ((target >> 4) === promotionRank) {
          for (const promotionType of [PIECE_TYPES.QUEEN, PIECE_TYPES.ROOK, PIECE_TYPES.BISHOP, PIECE_TYPES.KNIGHT]) {
            moves.push(
              createMove(
                square,
                target,
                promotionType,
                MOVE_FLAGS.CAPTURE | MOVE_FLAGS.PROMOTION,
              ),
            );
          }
        } else {
          moves.push(createMove(square, target, 0, MOVE_FLAGS.CAPTURE));
        }
      }
      if (target === this.enPassant) {
        moves.push(createMove(square, target, 0, MOVE_FLAGS.CAPTURE | MOVE_FLAGS.EN_PASSANT));
      }
    }
  }

  addLeaperMoves(square, moves, color, offsets) {
    for (const offset of offsets) {
      const target = square + offset;
      if (!isOnBoard(target)) continue;
      const occupant = this.board[target];
      if (occupant === 0) {
        moves.push(createMove(square, target));
      } else if (pieceColor(occupant) === -color) {
        moves.push(createMove(square, target, 0, MOVE_FLAGS.CAPTURE));
      }
    }
  }

  addSliderMoves(square, moves, color, offsets) {
    for (const offset of offsets) {
      let target = square + offset;
      while (isOnBoard(target)) {
        const occupant = this.board[target];
        if (occupant === 0) {
          moves.push(createMove(square, target));
        } else {
          if (pieceColor(occupant) === -color) {
            moves.push(createMove(square, target, 0, MOVE_FLAGS.CAPTURE));
          }
          break;
        }
        target += offset;
      }
    }
  }

  addCastlingMoves(square, moves, color) {
    if (color === WHITE) {
      if (
        (this.castling & CASTLING.WHITE_KING) !== 0 &&
        this.board[square + 1] === 0 &&
        this.board[square + 2] === 0 &&
        !this.isSquareAttacked(square, BLACK) &&
        !this.isSquareAttacked(square + 1, BLACK) &&
        !this.isSquareAttacked(square + 2, BLACK)
      ) {
        moves.push(createMove(square, square + 2, 0, MOVE_FLAGS.CASTLE_KING));
      }
      if (
        (this.castling & CASTLING.WHITE_QUEEN) !== 0 &&
        this.board[square - 1] === 0 &&
        this.board[square - 2] === 0 &&
        this.board[square - 3] === 0 &&
        !this.isSquareAttacked(square, BLACK) &&
        !this.isSquareAttacked(square - 1, BLACK) &&
        !this.isSquareAttacked(square - 2, BLACK)
      ) {
        moves.push(createMove(square, square - 2, 0, MOVE_FLAGS.CASTLE_QUEEN));
      }
    } else {
      if (
        (this.castling & CASTLING.BLACK_KING) !== 0 &&
        this.board[square + 1] === 0 &&
        this.board[square + 2] === 0 &&
        !this.isSquareAttacked(square, WHITE) &&
        !this.isSquareAttacked(square + 1, WHITE) &&
        !this.isSquareAttacked(square + 2, WHITE)
      ) {
        moves.push(createMove(square, square + 2, 0, MOVE_FLAGS.CASTLE_KING));
      }
      if (
        (this.castling & CASTLING.BLACK_QUEEN) !== 0 &&
        this.board[square - 1] === 0 &&
        this.board[square - 2] === 0 &&
        this.board[square - 3] === 0 &&
        !this.isSquareAttacked(square, WHITE) &&
        !this.isSquareAttacked(square - 1, WHITE) &&
        !this.isSquareAttacked(square - 2, WHITE)
      ) {
        moves.push(createMove(square, square - 2, 0, MOVE_FLAGS.CASTLE_QUEEN));
      }
    }
  }

  generateLegalMoves() {
    const pseudo = this.generatePseudoLegalMoves();
    const legal = [];
    for (const move of pseudo) {
      this.makeMove(move);
      const inCheck = this.isKingInCheck(-this.sideToMove);
      this.undoMove();
      if (!inCheck) {
        legal.push(move);
      }
    }
    return legal;
  }

  isKingInCheck(color) {
    const kingSquare = this.findKing(color);
    if (kingSquare === -1) return false;
    return this.isSquareAttacked(kingSquare, -color);
  }

  findKing(color) {
    for (let square = 0; square < 128; square += 1) {
      if (!isOnBoard(square)) {
        square += 7;
        continue;
      }
      const piece = this.board[square];
      if (piece === color * PIECE_TYPES.KING) {
        return square;
      }
    }
    return -1;
  }

  isSquareAttacked(square, attackerColor) {
    const pawnOffsets = attackerColor === WHITE ? [17, 15] : [-17, -15];
    for (const offset of pawnOffsets) {
      const from = square + offset;
      if (isOnBoard(from) && this.board[from] === attackerColor * PIECE_TYPES.PAWN) {
        return true;
      }
    }

    for (const offset of KNIGHT_OFFSETS) {
      const from = square + offset;
      if (isOnBoard(from) && this.board[from] === attackerColor * PIECE_TYPES.KNIGHT) {
        return true;
      }
    }

    for (const offset of BISHOP_OFFSETS) {
      let from = square + offset;
      while (isOnBoard(from)) {
        const piece = this.board[from];
        if (piece !== 0) {
          const type = pieceType(piece);
          if (pieceColor(piece) === attackerColor && (type === PIECE_TYPES.BISHOP || type === PIECE_TYPES.QUEEN)) {
            return true;
          }
          break;
        }
        from += offset;
      }
    }

    for (const offset of ROOK_OFFSETS) {
      let from = square + offset;
      while (isOnBoard(from)) {
        const piece = this.board[from];
        if (piece !== 0) {
          const type = pieceType(piece);
          if (pieceColor(piece) === attackerColor && (type === PIECE_TYPES.ROOK || type === PIECE_TYPES.QUEEN)) {
            return true;
          }
          break;
        }
        from += offset;
      }
    }

    for (const offset of KING_OFFSETS) {
      const from = square + offset;
      if (isOnBoard(from) && this.board[from] === attackerColor * PIECE_TYPES.KING) {
        return true;
      }
    }

    return false;
  }

  checkingSquares() {
    const us = this.sideToMove;
    const kingSquare = this.findKing(us);
    if (kingSquare === -1) return [];
    const attackers = [];
    for (let square = 0; square < 128; square += 1) {
      if (!isOnBoard(square)) {
        square += 7;
        continue;
      }
      const piece = this.board[square];
      if (piece === 0 || pieceColor(piece) !== -us) continue;
      if (this.attacksSquare(square, kingSquare)) {
        attackers.push(squareToAlgebraic(square));
      }
    }
    return attackers;
  }

  attacksSquare(from, target) {
    const piece = this.board[from];
    const color = pieceColor(piece);
    const type = pieceType(piece);
    const delta = target - from;
    if (type === PIECE_TYPES.PAWN) {
      const offsets = color === WHITE ? [-17, -15] : [17, 15];
      return offsets.includes(delta);
    }
    if (type === PIECE_TYPES.KNIGHT) {
      return KNIGHT_OFFSETS.includes(delta);
    }
    if (type === PIECE_TYPES.BISHOP || type === PIECE_TYPES.ROOK || type === PIECE_TYPES.QUEEN) {
      const offsets = [];
      if (type !== PIECE_TYPES.ROOK) offsets.push(...BISHOP_OFFSETS);
      if (type !== PIECE_TYPES.BISHOP) offsets.push(...ROOK_OFFSETS);
      for (const offset of offsets) {
        let square = from + offset;
        while (isOnBoard(square)) {
          if (square === target) return true;
          if (this.board[square] !== 0) break;
          square += offset;
        }
      }
      return false;
    }
    if (type === PIECE_TYPES.KING) {
      return KING_OFFSETS.includes(delta);
    }
    return false;
  }

  getFen() {
    const rows = [];
    for (let rank = 0; rank < 8; rank += 1) {
      let row = "";
      let empty = 0;
      for (let file = 0; file < 8; file += 1) {
        const square = (rank << 4) | file;
        const piece = this.board[square];
        if (piece === 0) {
          empty += 1;
        } else {
          if (empty > 0) {
            row += String(empty);
            empty = 0;
          }
          const type = pieceType(piece);
          const char = PIECE_CHAR_FROM_TYPE[type];
          row += piece > 0 ? char.toUpperCase() : char;
        }
      }
      if (empty > 0) {
        row += String(empty);
      }
      rows.push(row);
    }
    const boardPart = rows.join("/");
    const sidePart = this.sideToMove === WHITE ? "w" : "b";
    let castlingPart = "";
    if ((this.castling & CASTLING.WHITE_KING) !== 0) castlingPart += "K";
    if ((this.castling & CASTLING.WHITE_QUEEN) !== 0) castlingPart += "Q";
    if ((this.castling & CASTLING.BLACK_KING) !== 0) castlingPart += "k";
    if ((this.castling & CASTLING.BLACK_QUEEN) !== 0) castlingPart += "q";
    if (!castlingPart) castlingPart = "-";
    const epPart = this.enPassant >= 0 ? squareToAlgebraic(this.enPassant) : "-";
    return `${boardPart} ${sidePart} ${castlingPart} ${epPart} ${this.halfmoveClock} ${this.fullmoveNumber}`;
  }

  getLegalMoves() {
    return this.generateLegalMoves().map((move) => move.uci);
  }

  evaluate() {
    let white = 0;
    let black = 0;
    for (let square = 0; square < 128; square += 1) {
      if (!isOnBoard(square)) {
        square += 7;
        continue;
      }
      const piece = this.board[square];
      if (piece === 0) continue;
      const type = pieceType(piece);
      const value = PIECE_VALUES[type];
      if (piece > 0) {
        white += value;
      } else {
        black += value;
      }
    }
    const material = white - black;
    return material * (this.sideToMove === WHITE ? 1 : -1);
  }

  search(depth, alpha, beta, ply) {
    if (depth === 0) {
      return this.evaluate();
    }
    const moves = this.generateLegalMoves();
    if (moves.length === 0) {
      if (this.isKingInCheck(this.sideToMove)) {
        return -MATE_VALUE + ply;
      }
      return 0;
    }

    const ordered = moves.slice().sort((a, b) => {
      const captureA = (a.flags & MOVE_FLAGS.CAPTURE) !== 0 ? 1 : 0;
      const captureB = (b.flags & MOVE_FLAGS.CAPTURE) !== 0 ? 1 : 0;
      const promoA = (a.flags & MOVE_FLAGS.PROMOTION) !== 0 ? 1 : 0;
      const promoB = (b.flags & MOVE_FLAGS.PROMOTION) !== 0 ? 1 : 0;
      return captureB - captureA || promoB - promoA;
    });

    let bestScore = -Infinity;
    for (const move of ordered) {
      this.makeMove(move);
      const score = -this.search(depth - 1, -beta, -alpha, ply + 1);
      this.undoMove();
      if (score > bestScore) {
        bestScore = score;
      }
      if (score > alpha) {
        alpha = score;
      }
      if (alpha >= beta) {
        break;
      }
    }
    return bestScore;
  }

  searchBestMove(depthLimit = 4) {
    const moves = this.generateLegalMoves();
    if (moves.length === 0) {
      return null;
    }
    const depth = Math.max(1, Math.min(this.maxDepth, depthLimit));
    const scoredMoves = [];
    let bestScore = -Infinity;
    for (const move of moves) {
      this.makeMove(move);
      const score = -this.search(depth - 1, -MATE_VALUE, MATE_VALUE, 1);
      this.undoMove();
      scoredMoves.push({ move, score });
      if (score > bestScore) {
        bestScore = score;
      }
    }

    scoredMoves.sort((a, b) => b.score - a.score);

    const threshold = bestScore - this.noiseWindow;
    const candidates = scoredMoves.filter((entry) => entry.score >= threshold);
    const selectionPool = candidates.length > 0 ? candidates : scoredMoves;

    const choice = selectionPool[Math.floor(this.random() * selectionPool.length)];
    const selected = choice?.move ?? scoredMoves[0].move;
    return selected?.uci ?? null;
  }
}

export function squareNameToIndex(square) {
  return algebraicToSquare(square);
}

export function indexToSquareName(index) {
  return squareToAlgebraic(index);
}

export const CONSTANTS = {
  WHITE,
  BLACK,
  PIECE_TYPES,
  MOVE_FLAGS,
  CASTLING,
};
