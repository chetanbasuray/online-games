"use client";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export default function Keyboard({ onKeyPress, letterStatus = {} }) {

  const getKeyColor = (letter) => {
    const status = letterStatus[letter];
    switch(status) {
      case "correct":
        return "border border-emerald-200/60 bg-emerald-500/90 text-white shadow-[0_0_16px_rgba(74,222,128,0.35)]";
      case "present":
        return "border border-amber-200/60 bg-amber-400/90 text-white shadow-[0_0_16px_rgba(250,204,21,0.35)]";
      case "absent":
        return "border border-white/10 bg-slate-800/70 text-white/70";
      default:
        return "border border-white/10 bg-indigo-950/40 text-white/80 hover:border-white/30";
    }
  };

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-2">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className={`min-w-[2.5rem] rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white transition ${getKeyColor(key)}`}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
