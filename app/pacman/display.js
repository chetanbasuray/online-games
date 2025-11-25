import { BOARD_WIDTH } from "./logic.js";

export const BOARD_TILE_SIZE = 30;
export const BOARD_GAP_PX = 3;
export const PELLET_SIZE = 8;
export const POWER_PELLET_SIZE = 14;

export function getBoardStyle(width = BOARD_WIDTH) {
  return {
    gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
    width: width * BOARD_TILE_SIZE,
    gap: BOARD_GAP_PX,
  };
}

export function getPelletStyle(power = false) {
  return {
    width: power ? POWER_PELLET_SIZE : PELLET_SIZE,
    height: power ? POWER_PELLET_SIZE : PELLET_SIZE,
  };
}
