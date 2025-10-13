"use client";

const ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"]
];

export default function Keyboard({ onKeyPress, letterStatus = {} }) {

  const getKeyColor = (letter) => {
    const status = letterStatus[letter];
    switch(status) {
      case "correct": return "bg-green-600 text-white";
      case "present": return "bg-yellow-400 text-white";
      case "absent": return "bg-gray-400 text-white";
      default: return "bg-white text-black border border-gray-400";
    }
  };

  return (
    <div className="mt-4 flex flex-col items-center gap-1">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className={`px-3 py-2 rounded font-bold transition ${getKeyColor(key)}`}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
