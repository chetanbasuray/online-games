"use client";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DELETE"],
];

export default function Keyboard({ onKeyPress, letterStatus = {}, className = "", style }) {
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

  const handlePress = (value) => {
    if (typeof onKeyPress === "function") {
      onKeyPress(value);
    }
  };

  const getLabel = (key) => {
    if (key === "DELETE") return "⌫";
    if (key === "ENTER") return "Enter";
    return key;
  };

  return (
    <div className={`wordle-keyboard ${className}`.trim()} style={style}>
      {ROWS.map((row, index) => (
        <div key={index} className="wordle-keyboard-row">
          {row.map((key) => {
            const isWide = key === "ENTER" || key === "DELETE";
            const statusClass = getKeyColor(key);
            const label = getLabel(key);

            return (
              <button
                key={key}
                type="button"
                onClick={() => handlePress(key)}
                className={`cosmic-key ${statusClass}`.trim()}
                data-wide={isWide ? "true" : undefined}
                aria-label={
                  key === "DELETE"
                    ? "Delete letter"
                    : key === "ENTER"
                    ? "Submit guess"
                    : `Letter ${label}`
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
