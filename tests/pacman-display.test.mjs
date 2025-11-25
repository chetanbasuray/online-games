import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BOARD_WIDTH } from "../app/pacman/logic.js";
import {
  BOARD_GAP_PX,
  BOARD_TILE_SIZE,
  PELLET_SIZE,
  POWER_PELLET_SIZE,
  getBoardStyle,
  getPelletStyle,
} from "../app/pacman/display.js";

describe("Pac-Man display sizing", () => {
  it("uses a widened board tile size for visibility", () => {
    const boardStyle = getBoardStyle();

    assert.equal(boardStyle.width, BOARD_WIDTH * BOARD_TILE_SIZE);
    assert.equal(boardStyle.gridTemplateColumns, `repeat(${BOARD_WIDTH}, minmax(0, 1fr))`);
    assert.equal(boardStyle.gap, BOARD_GAP_PX);
  });

  it("keeps regular and power pellets distinctly visible", () => {
    const pellet = getPelletStyle(false);
    const powerPellet = getPelletStyle(true);

    assert.equal(pellet.width, PELLET_SIZE);
    assert.equal(pellet.height, PELLET_SIZE);
    assert.equal(powerPellet.width, POWER_PELLET_SIZE);
    assert.equal(powerPellet.height, POWER_PELLET_SIZE);
    assert(powerPellet.width > pellet.width);
  });
});
