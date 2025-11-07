import test from "node:test";
import assert from "node:assert/strict";

import {
  adjustRating,
  DEFAULT_DIFFICULTY_ID,
  DIFFICULTIES,
  fenToBoard,
  ratingToDifficultyId,
  sanitizeMovesList,
  getSquareName,
  parseSquare,
  bestMoveToAlgebraic,
  moveDisplayList,
  STOCKFISH_CDN_URLS,
  boardOrientation,
} from "../app/chess/utils.js";

const BOARD_FEN = "rnbqkbnr/ppp2ppp/4p3/3p4/3P4/5N2/PPP1PPPP/RNBQKB1R w KQkq d6 0 3";

test("fenToBoard parses 8x8 grid", () => {
  const board = fenToBoard(BOARD_FEN);
  assert.equal(board.length, 8);
  board.forEach((rank) => assert.equal(rank.length, 8));
  assert.equal(board[0][0], "r");
  assert.equal(board[7][7], "R");
  assert.equal(board[5][2], null);
});

test("ratingToDifficultyId chooses progressive levels", () => {
  const ordered = DIFFICULTIES.map((level) => level.minRating);
  const baseline = ratingToDifficultyId(ordered[0]);
  assert.equal(typeof baseline, "string");
  assert.ok(DIFFICULTIES.some((level) => level.id === baseline));

  const high = ratingToDifficultyId(2500);
  assert.equal(high, DIFFICULTIES[DIFFICULTIES.length - 1].id);

  const mid = ratingToDifficultyId(1300);
  const expected = DIFFICULTIES.filter((level) => 1300 >= level.minRating).pop().id;
  assert.equal(mid, expected);
});

test("adjustRating responds to outcomes", () => {
  const opponent = 1400;
  const win = adjustRating(1200, opponent, "win");
  const draw = adjustRating(1200, opponent, "draw");
  const loss = adjustRating(1200, opponent, "loss");
  assert.ok(win > draw);
  assert.ok(draw > loss);
});

test("sanitizeMovesList keeps only valid UCI moves", () => {
  const sanitized = sanitizeMovesList(["e2e4", "b7b8q", "foo", 123, "e9e5"]);
  assert.deepEqual(sanitized, ["e2e4", "b7b8q"]);
});

test("square helpers round-trip", () => {
  const coord = parseSquare("e4");
  const square = getSquareName(coord.fileIndex, coord.rankIndex);
  assert.equal(square, "e4");
});

test("default difficulty id is part of catalog", () => {
  assert.ok(DIFFICULTIES.some((level) => level.id === DEFAULT_DIFFICULTY_ID));
});

test("bestMoveToAlgebraic formats UCI moves", () => {
  assert.equal(bestMoveToAlgebraic("e2e4"), "e2 → e4");
  assert.equal(bestMoveToAlgebraic("a7a8q"), "a7 → a8 (Q)");
  assert.equal(bestMoveToAlgebraic("(none)"), null);
  assert.equal(bestMoveToAlgebraic("bad"), null);
});

test("moveDisplayList annotates move order", () => {
  const display = moveDisplayList(["e2e4", "e7e5", "g1f3"]);
  assert.equal(display.length, 3);
  assert.equal(display[0].moveNumber, 1);
  assert.equal(display[1].moveNumber, 1);
  assert.equal(display[2].moveNumber, 2);
  assert.equal(display[0].isPlayerMove, true);
  assert.equal(display[1].isPlayerMove, false);
  assert.equal(display[2].label, "g1 → f3");
});

test("moveDisplayList respects player color", () => {
  const display = moveDisplayList(["e2e4", "g8f6", "d2d4"], "b");
  assert.equal(display[0].isPlayerMove, false);
  assert.equal(display[1].isPlayerMove, true);
  assert.equal(display[2].isPlayerMove, false);
});

test("boardOrientation mirrors axes for black perspective", () => {
  const white = boardOrientation("w");
  const black = boardOrientation("b");
  assert.deepEqual(white.fileIndexes, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(white.rankIndexes, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(black.fileIndexes, [7, 6, 5, 4, 3, 2, 1, 0]);
  assert.deepEqual(black.rankIndexes, [7, 6, 5, 4, 3, 2, 1, 0]);
});

test("Stockfish CDN list stays HTTPS", () => {
  assert.ok(Array.isArray(STOCKFISH_CDN_URLS));
  assert.ok(STOCKFISH_CDN_URLS.length >= 2);
  STOCKFISH_CDN_URLS.forEach((url) => {
    assert.equal(typeof url, "string");
    assert.ok(url.startsWith("https://"));
  });
});
