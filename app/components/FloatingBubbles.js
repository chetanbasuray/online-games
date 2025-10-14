"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function FloatingBubbles({ count = 15, area = "full", zIndex = 0 }) {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    const bubbleArray = Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 3 + Math.random() * 8,
      top: area === "full" ? Math.random() * 100 : 40 + Math.random() * 20, // button area for 'button'
      left: Math.random() * 100,
      duration: 3 + Math.random() * 5,
      delay: Math.random() * 5,
    }));
    setBubbles(bubbleArray);
  }, [count, area]);

  return (
    <>
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          className="absolute bg-white rounded-full opacity-20"
          style={{
            width: `${b.size}vmin`,
            height: `${b.size}vmin`,
            top: `${b.top}%`,
            left: `${b.left}%`,
            zIndex,
          }}
          animate={{ y: ["0%", "-20%", "0%"], x: ["0%", "5%", "0%"] }}
          transition={{ duration: b.duration, repeat: Infinity, delay: b.delay, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}
