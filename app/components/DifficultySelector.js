"use client";

export default function DifficultySelector({ difficulty, setDifficulty }) {
  return (
    <div className="mb-4">
      <label className="text-white mr-2">Select Difficulty:</label>
      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        className="px-2 py-1 rounded"
      >
        <option value="Easy">Easy (9x9)</option>
        <option value="Medium">Medium (16x16)</option>
        <option value="Hard">Hard (24x24)</option>
      </select>
    </div>
  );
}
