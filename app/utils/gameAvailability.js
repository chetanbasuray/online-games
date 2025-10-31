import { GAMES } from "../data/games";

export const isGamePlayable = (path) =>
  GAMES.find((game) => game.path === path)?.isPlayable ?? false;

export const hasPlayableGame = () => GAMES.some((game) => game.isPlayable);
