import test from "node:test";
import assert from "node:assert/strict";

import {
  BOARD_WIDTH,
  GHOST_STARTS,
  PACMAN_START,
  advanceGameState,
  buildBoardState,
  canMove,
  createGameState,
} from "../app/pacman/logic.js";

test("board builder prepares consistent maze", () => {
  const { board, pelletsRemaining } = buildBoardState();
  assert.ok(board.length > 0);
  board.forEach((row) => {
    assert.equal(row.length, BOARD_WIDTH);
  });
  const countedPellets = board.flat().filter((cell) => cell === "." || cell === "o").length;
  assert.equal(pelletsRemaining, countedPellets);
});

test("pacman cannot move through walls", () => {
  const { board } = createGameState();
  const startAgainstWall = { position: { x: 0, y: 0 } };
  assert.equal(canMove(board, startAgainstWall.position, "left"), false);
  assert.equal(canMove(board, startAgainstWall.position, "up"), false);
});

test("pellet consumption increases score and lowers remaining pellet count", () => {
  let state = createGameState();
  state = {
    ...state,
    pacman: { ...state.pacman, position: { x: 2, y: 1 }, direction: "left", pendingDirection: "left" },
  };
  const pelletsBefore = state.pelletsRemaining;
  const nextState = advanceGameState(state);
  assert.equal(nextState.score > state.score, true);
  assert.equal(nextState.pelletsRemaining, pelletsBefore - 1);
});

test("powered collisions reset ghosts and award bonus", () => {
  const base = createGameState();
  const ghost = base.ghosts[0];
  const state = {
    ...base,
    pacman: { ...base.pacman, position: { ...ghost.position }, direction: "stop", pendingDirection: "stop" },
    powerTimer: 5,
    score: 0,
  };

  const next = advanceGameState(state);
  assert.equal(next.score, 200);
  assert.equal(next.ghosts[0].position.x, GHOST_STARTS[0].x);
  assert.notDeepEqual(next.ghosts[0].position, state.pacman.position);
});

test("pacman loses lives on collisions without power", () => {
  const base = createGameState();
  const ghost = base.ghosts[1];
  const state = {
    ...base,
    pacman: { ...base.pacman, position: { ...ghost.position }, direction: "stop", pendingDirection: "stop" },
    powerTimer: 0,
    lives: 2,
  };

  const next = advanceGameState(state);
  assert.equal(next.lives, 1);
  assert.deepEqual(next.pacman.position, PACMAN_START);
});
