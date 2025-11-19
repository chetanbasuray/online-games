import { LocalEngine } from "./localEngine.mjs";

const engine = new LocalEngine();

function respond(message) {
  self.postMessage(message);
}

function handlePosition(command) {
  const tokens = command.trim().split(/\s+/);
  if (tokens[1] === "startpos") {
    engine.loadStartPosition();
    const movesIndex = tokens.indexOf("moves");
    if (movesIndex !== -1) {
      const moves = tokens.slice(movesIndex + 1);
      engine.applyMoves(moves);
    }
    return;
  }
  const fenIndex = tokens.indexOf("fen");
  if (fenIndex !== -1) {
    const fenParts = tokens.slice(fenIndex + 1);
    const movesIndex = fenParts.indexOf("moves");
    const fen = fenParts.slice(0, movesIndex === -1 ? fenParts.length : movesIndex).join(" ");
    engine.loadFen(fen);
    if (movesIndex !== -1) {
      const moves = fenParts.slice(movesIndex + 1);
      engine.applyMoves(moves);
    }
  }
}

function handleGo(command) {
  const depthMatch = command.match(/depth\s+(\d+)/);
  const depth = depthMatch ? Number.parseInt(depthMatch[1], 10) : 4;
  const result = engine.searchBestMove(depth);
  respond(`bestmove ${result ?? "(none)"}`);
}

function handleDebug(command) {
  if (command.trim() !== "d") return;
  const fen = engine.getFen();
  const checkers = engine.isKingInCheck(engine.sideToMove)
    ? engine.checkingSquares().join(" ") || "-"
    : "-";
  const legalMoves = engine.getLegalMoves();
  respond(`Fen: ${fen}`);
  respond(`Checkers: ${checkers}`);
  respond(`Legal moves: ${legalMoves.join(" ")}`);
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (typeof data !== "string") return;
  const command = data.trim();

  if (command === "uci") {
    respond("id name Arcade Stockfish Fallback");
    respond("id author Online Games");
    respond("uciok");
    return;
  }

  if (command === "isready") {
    respond("readyok");
    return;
  }

  if (command.startsWith("setoption")) {
    const match = command.match(/name\s+Skill\s+Level\s+value\s+(\d+)/i);
    if (match) {
      engine.setSkillLevel(Number.parseInt(match[1], 10));
    }
    return;
  }

  if (command === "ucinewgame") {
    engine.loadStartPosition();
    return;
  }

  if (command.startsWith("position")) {
    handlePosition(command);
    return;
  }

  if (command.startsWith("go")) {
    handleGo(command);
    return;
  }

  if (command === "stop") {
    return;
  }

  if (command === "d") {
    handleDebug(command);
  }
});
