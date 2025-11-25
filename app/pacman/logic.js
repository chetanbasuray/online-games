export const BOARD_TEMPLATE = [
  "###############",
  "#.....#.....#.#",
  "#.###.#.###.#.#",
  "#o###.#.###.#o#",
  "#.............#",
  "#.###.#.#.###.#",
  "#.....#.#.....#",
  "###.#.#.#.#.###",
  "#.....#.#.....#",
  "#.###.#.#.###.#",
  "#o###.#.###.#o#",
  "#.............#",
  "#.###.#.###.#.#",
  "#.....#.....#.#",
  "###############",
];

export const BOARD_WIDTH = BOARD_TEMPLATE[0].length;
export const BOARD_HEIGHT = BOARD_TEMPLATE.length;

export const PACMAN_START = { x: 7, y: 11 };
export const GHOST_STARTS = [
  { x: 5, y: 7, direction: "left" },
  { x: 9, y: 7, direction: "right" },
];

export const POWER_DURATION = 32;
export const GHOST_SCORE = 200;

export const DIRECTION_OFFSETS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  stop: { x: 0, y: 0 },
};

export const DIRECTION_ORDER = ["up", "left", "down", "right"];

export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

export function buildBoardState() {
  let pelletCount = 0;

  const initialGrid = BOARD_TEMPLATE.map((row) => row.split(""));
  initialGrid.forEach((row) => {
    row.forEach((cell) => {
      if (cell === "." || cell === "o") {
        pelletCount += 1;
      }
    });
  });

  const cleanGrid = initialGrid.map((row, y) =>
    row.map((cell, x) => {
      const isStart =
        (x === PACMAN_START.x && y === PACMAN_START.y) ||
        GHOST_STARTS.some((ghost) => ghost.x === x && ghost.y === y);

      if (isStart && (cell === "." || cell === "o")) {
        pelletCount -= 1;
        return " ";
      }

      return cell;
    }),
  );

  return {
    board: cleanGrid,
    pelletsRemaining: pelletCount,
  };
}

export function createGameState() {
  const { board, pelletsRemaining } = buildBoardState();

  return {
    board,
    pelletsRemaining,
    pacman: {
      position: { ...PACMAN_START },
      direction: "left",
      pendingDirection: "left",
    },
    ghosts: GHOST_STARTS.map((ghost) => ({
      position: { x: ghost.x, y: ghost.y },
      direction: ghost.direction,
    })),
    score: 0,
    lives: 3,
    powerTimer: 0,
    status: "playing",
  };
}

export function isWall(board, position) {
  return board[position.y]?.[position.x] === "#";
}

export function applyDirection(position, direction) {
  const offset = DIRECTION_OFFSETS[direction] ?? DIRECTION_OFFSETS.stop;
  return { x: position.x + offset.x, y: position.y + offset.y };
}

export function canMove(board, position, direction) {
  const target = applyDirection(position, direction);
  const withinBounds =
    target.x >= 0 && target.x < BOARD_WIDTH && target.y >= 0 && target.y < BOARD_HEIGHT;
  if (!withinBounds) return false;
  return !isWall(board, target);
}

export function getAvailableDirections(board, position) {
  return DIRECTION_ORDER.filter((direction) => canMove(board, position, direction));
}

export function oppositeDirection(direction) {
  switch (direction) {
    case "up":
      return "down";
    case "down":
      return "up";
    case "left":
      return "right";
    case "right":
      return "left";
    default:
      return "stop";
  }
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function chooseGhostDirection(ghost, pacmanPosition, board, frightened) {
  const available = getAvailableDirections(board, ghost.position);
  const options = available.filter((direction) => {
    if (ghost.direction === "stop") return true;
    return direction !== oppositeDirection(ghost.direction) || available.length === 1;
  });

  const candidates = options.length > 0 ? options : available;

  if (candidates.length === 0) {
    return ghost.direction;
  }

  const compare = frightened ? Math.max : Math.min;
  const bestScore = compare(...candidates.map((direction) => {
    const next = applyDirection(ghost.position, direction);
    return distance(next, pacmanPosition);
  }));

  return candidates.find((direction) => {
    const next = applyDirection(ghost.position, direction);
    return distance(next, pacmanPosition) === bestScore;
  });
}

export function consumeTile(board, position) {
  const tile = board[position.y][position.x];
  let gainedScore = 0;
  let gainedPower = 0;
  let consumed = false;

  if (tile === ".") {
    gainedScore = 10;
    consumed = true;
  } else if (tile === "o") {
    gainedScore = 50;
    gainedPower = POWER_DURATION;
    consumed = true;
  }

  if (!consumed) {
    return { board, score: gainedScore, power: gainedPower, pelletDelta: 0 };
  }

  const nextBoard = cloneBoard(board);
  nextBoard[position.y][position.x] = " ";

  return { board: nextBoard, score: gainedScore, power: gainedPower, pelletDelta: -1 };
}

export function movePacman(state) {
  const { board, pacman } = state;
  const desiredDirection = pacman.pendingDirection;
  const activeDirection = canMove(board, pacman.position, desiredDirection)
    ? desiredDirection
    : pacman.direction;

  const nextPosition = canMove(board, pacman.position, activeDirection)
    ? applyDirection(pacman.position, activeDirection)
    : pacman.position;

  const { board: nextBoard, score, power, pelletDelta } = consumeTile(board, nextPosition);

  return {
    ...state,
    board: nextBoard,
    score: state.score + score,
    powerTimer: Math.max(state.powerTimer + power, 0),
    pelletsRemaining: state.pelletsRemaining + pelletDelta,
    pacman: {
      position: nextPosition,
      direction: activeDirection,
      pendingDirection: activeDirection,
    },
  };
}

export function moveGhosts(state) {
  const frightened = state.powerTimer > 0;
  const ghosts = state.ghosts.map((ghost) => {
    const direction = chooseGhostDirection(ghost, state.pacman.position, state.board, frightened);
    const target = canMove(state.board, ghost.position, direction)
      ? applyDirection(ghost.position, direction)
      : ghost.position;

    return {
      position: target,
      direction,
    };
  });

  return { ...state, ghosts };
}

export function resolveCollisions(state) {
  let score = state.score;
  let lives = state.lives;
  let status = state.status;
  let powerTimer = state.powerTimer;

  const ghosts = state.ghosts.map((ghost, index) => {
    if (
      ghost.position.x === state.pacman.position.x &&
      ghost.position.y === state.pacman.position.y
    ) {
      if (state.powerTimer > 0) {
        score += GHOST_SCORE;
        return {
          position: { x: GHOST_STARTS[index].x, y: GHOST_STARTS[index].y },
          direction: GHOST_STARTS[index].direction,
        };
      }

      lives -= 1;
      status = lives <= 0 ? "over" : "playing";
      powerTimer = 0;
      return {
        position: { x: GHOST_STARTS[index].x, y: GHOST_STARTS[index].y },
        direction: GHOST_STARTS[index].direction,
      };
    }

    return ghost;
  });

  let pacman = state.pacman;
  if (lives !== state.lives && status !== "over") {
    pacman = {
      position: { ...PACMAN_START },
      direction: "left",
      pendingDirection: "left",
    };
  }

  return {
    ...state,
    score,
    lives,
    status,
    powerTimer,
    ghosts,
    pacman,
  };
}

export function checkWinCondition(state) {
  if (state.pelletsRemaining <= 0 && state.status === "playing") {
    return { ...state, status: "won" };
  }
  return state;
}

export function advanceGameState(state) {
  if (state.status !== "playing") return state;

  let nextState = movePacman(state);
  nextState = resolveCollisions(nextState);
  nextState = moveGhosts(nextState);
  nextState = resolveCollisions(nextState);
  nextState = { ...nextState, powerTimer: Math.max(nextState.powerTimer - 1, 0) };
  nextState = checkWinCondition(nextState);

  return nextState;
}

export function getTickInterval(score) {
  const baseInterval = 240;
  const minimumInterval = 120;
  const thresholdStep = 150;
  const stepDecrease = 15;

  const completedSteps = Math.floor(score / thresholdStep);
  const decreased = completedSteps * stepDecrease;
  const interval = baseInterval - decreased;

  return Math.max(interval, minimumInterval);
}
