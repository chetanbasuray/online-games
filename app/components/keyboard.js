"use client";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export default function Keyboard({ onKeyPress, letterStatus = {} }) {

  const getKeyColor = (letter) => {
    const status = letterStatus[letter];
    switch (status) {
      case "correct":
        return "cosmic-key--correct";
      case "present":
        return "cosmic-key--present";
      case "absent":
        return "cosmic-key--absent";
      default:
        return "";
    }
  };

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-2">
          {row.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onKeyPress(key)}
              className={`cosmic-key ${getKeyColor(key)}`}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
