"use client";

import { useMemo } from "react";

const ORBIT_COUNT = 3;

function createSparkleStyle(index) {
  const angle = (index / 24) * Math.PI * 2;
  const radius = 36 + (index % 5) * 4;
  const x = 50 + Math.cos(angle) * radius;
  const y = 50 + Math.sin(angle) * (radius * 0.6);

  return {
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${index * 0.8}s`,
    animationDuration: `${5 + (index % 4)}s`,
  };
}

export default function CosmicBackground() {
  const sparkles = useMemo(() => Array.from({ length: 24 }), []);
  const orbits = useMemo(() => Array.from({ length: ORBIT_COUNT }), []);

  return (
    <div className="cosmic-background" aria-hidden>
      <div className="cosmic-gradient cosmic-gradient-1" />
      <div className="cosmic-gradient cosmic-gradient-2" />
      <div className="cosmic-gradient cosmic-gradient-3" />
      <div className="cosmic-dust" />
      <div className="cosmic-grid" />

      {orbits.map((_, index) => (
        <div key={`orbit-${index}`} className={`cosmic-orbit cosmic-orbit-${index + 1}`} />
      ))}

      {sparkles.map((_, index) => (
        <div key={`sparkle-${index}`} className="cosmic-sparkle" style={createSparkleStyle(index)} />
      ))}
    </div>
  );
}
