import ChessGame from "./ChessGame";

export const metadata = {
  title: "Chess | Online Games",
  description: "Play chess against Stockfish with adaptive difficulty levels and saved progress.",
};

export default function ChessPage() {
  return <ChessGame />;
}
