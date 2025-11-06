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
