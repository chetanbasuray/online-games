import test from "node:test";
import assert from "node:assert/strict";

import { LocalEngine } from "../app/chess/localEngine.mjs";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function createEngine() {
  const engine = new LocalEngine({ random: () => 0 });
  engine.setSkillLevel(20);
  engine.noiseWindow = 0;
  return engine;
}

test("LocalEngine starts from initial position", () => {
  const engine = createEngine();
  assert.equal(engine.getFen(), INITIAL_FEN);
  const legal = engine.getLegalMoves();
  assert.equal(legal.length, 20);
  assert.ok(legal.includes("e2e4"));
  assert.ok(legal.includes("g1f3"));
});

test("LocalEngine supports en passant captures", () => {
  const engine = createEngine();
  engine.applyMoves(["e2e4", "a7a6", "e4e5", "d7d5"]);
  const legal = engine.getLegalMoves();
  assert.ok(legal.includes("e5d6"));
  engine.makeMoveFromUci("e5d6");
  assert.equal(engine.getFen().split(" ")[0].includes("P"), true);
});

test("LocalEngine exposes castling when squares are clear", () => {
  const engine = createEngine();
  engine.applyMoves(["e2e4", "e7e5", "g1f3", "g8f6", "f1e2", "f8e7"]);
  const legal = engine.getLegalMoves();
  assert.ok(legal.includes("e1g1"));
  engine.makeMoveFromUci("e1g1");
  assert.equal(engine.castling & 3, 0);
});

test("LocalEngine finds checkmate in one", () => {
  const engine = createEngine();
  engine.applyMoves(["e2e4", "e7e5", "d1h5", "b8c6", "f1c4", "g8f6"]);
  const best = engine.searchBestMove(4);
  assert.equal(best, "h5f7");
});

test("LocalEngine detects stalemate", () => {
  const engine = createEngine();
  engine.loadFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
  const legal = engine.getLegalMoves();
  assert.equal(legal.length, 0);
  assert.equal(engine.isKingInCheck(engine.sideToMove), false);
  const best = engine.searchBestMove(3);
  assert.equal(best, null);
});
