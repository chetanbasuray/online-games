"use client";

import { useMemo } from "react";

function generateBlobStyles(index) {
  const hues = [285, 200, 150, 320];
  const hue = hues[index % hues.length];
  const delay = index * 4;
  const duration = 18 + index * 2;

  return {
    background: `radial-gradient(circle at 30% 30%, hsla(${hue}, 95%, 65%, 0.7), transparent 55%)`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };
}

export default function AuroraBackground({ blobCount = 5 }) {
  const blobs = useMemo(() => Array.from({ length: blobCount }), [blobCount]);

  return (
    <div className="aurora-background" aria-hidden>
      {blobs.map((_, index) => (
        <div
          key={index}
          className={`aurora-blob aurora-blob-${index + 1}`}
          style={generateBlobStyles(index)}
        />
      ))}
      <div className="aurora-grid" />
    </div>
  );
}
