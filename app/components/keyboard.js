"use client";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DELETE"],
];

export default function Keyboard({ onKeyPress, letterStatus = {}, className = "", style, disabled = false }) {
  const getKeyStatus = (letter) => {
    const status = letterStatus[letter];
    if (status === "correct" || status === "present" || status === "absent") {
      return status;
    }
    return "unused";
  };

  const handlePress = (value) => {
    if (disabled) return;
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
            const status = getKeyStatus(key);
            const label = getLabel(key);

            return (
              <button
                key={key}
                type="button"
                onClick={() => handlePress(key)}
                className={`wordle-key ${isWide ? "wordle-key--wide" : ""}`.trim()}
                data-wide={isWide ? "true" : undefined}
                data-status={status}
                aria-label={
                  key === "DELETE"
                    ? "Delete letter"
                    : key === "ENTER"
                    ? "Submit guess"
                    : `Letter ${label}`
                }
                disabled={disabled}
                aria-disabled={disabled ? "true" : undefined}
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
