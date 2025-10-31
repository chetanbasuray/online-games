const createBubbleConfigs = (count, area) =>
  Array.from({ length: count }, (_, index) => {
    const ratio = (index + 1) / count;
    const angle = ratio * Math.PI * 2;
    const topRange = area === "full" ? 90 : 18;
    const topOffset = area === "full" ? 0 : 41;

    const top = topOffset + (Math.sin(angle + index * 0.35) * 0.5 + 0.5) * topRange;
    const left = (Math.cos(angle * 0.9 + index * 0.5) * 0.5 + 0.5) * 100;
    const size = 3 + (Math.sin(angle * 1.7 + index) * 0.5 + 0.5) * 6;
    const duration = 7 + ((index % 5) + ratio) * 0.9;
    const delay = ((index % 7) * 0.45 + ratio * 0.6).toFixed(2);

    return {
      id: index,
      top,
      left,
      size,
      duration,
      delay,
    };
  });

export default function FloatingBubbles({ count = 15, area = "full", zIndex = 0 }) {
  const bubbles = createBubbleConfigs(count, area);

  return (
    <>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="cosmic-particle"
          style={{
            width: `${bubble.size}vmin`,
            height: `${bubble.size}vmin`,
            top: `${bubble.top}%`,
            left: `${bubble.left}%`,
            zIndex,
            "--bubble-duration": `${bubble.duration}s`,
            "--bubble-delay": `${bubble.delay}s`,
          }}
        />
      ))}
    </>
  );
}
