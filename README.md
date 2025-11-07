# Online Games Arcade

A polished Next.js arcade that bundles bite-sized logic games in a neon-inspired interface. Sharpen your mind with daily Wordle challenges and breezy Sudoku boards without leaving the same tab.

## ✨ Features

- **Compact Sudoku board** with glowing feedback for completed rows, columns, and blocks.
- **Daily Wordle** experience with celebratory animations for correct guesses.
- **Reactive audiovisuals** powered by handcrafted CSS animations, Tone.js, and canvas-confetti for a futuristic vibe.
- **Responsive layout** that keeps the games playable on phones, tablets, and desktops.

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to launch the arcade.

## 🧩 Available Games

| Game   | Path       | Highlights |
| ------ | ---------- | ---------- |
| Wordle | `/`        | Classic five-letter guessing with hints and streak tracking. |
| Sudoku | `/sudoku`  | Adjustable difficulty, keyboard controls, and celebratory effects when you solve a board. |
| Chess  | `/chess`   | Face Stockfish with adaptive strength, local rating tracking, optional auto-adjusted opponents, and an offline-ready fallback engine. |

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/) App Router
- [Tailwind CSS](https://tailwindcss.com/) for styling
- Custom CSS animations for page and component transitions
- [Tone.js](https://tonejs.github.io/) and [canvas-confetti](https://www.kirilv.com/canvas-confetti/) for sound and celebration effects

## 🧠 Credits

- [Stockfish](https://stockfishchess.org/) via the [stockfish.js build](https://github.com/official-stockfish/Stockfish) powers the computer opponent on the chess board when a network connection is available. Stockfish is licensed under the GNU General Public License v3.0.
- The arcade ships a bundled fallback engine that mirrors the Stockfish UCI interface so chess remains playable even without CDN access.

## 🤝 Contributing

1. Fork the repo and create a branch for your feature or bugfix.
2. Run `npm run lint` to ensure the code follows the project's standards.
3. Open a pull request describing the changes and screenshots when the UI is affected.

