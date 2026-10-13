import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#facc15'];

/** Pháo giấy rơi một lần (không lặp). Tắt khi máy đặt "giảm chuyển động". */
export const Confetti: React.FC<{ count?: number; delay?: number }> = ({ count = 60, delay = 0 }) => {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
      round: i % 3 === 0,
      drift: (Math.random() - 0.5) * 160,
      spin: (Math.random() - 0.5) * 720,
      duration: 2.4 + Math.random() * 1.8,
      wait: delay + Math.random() * 0.8,
    })),
    [count, delay]
  );
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {pieces.map((c, i) => (
        <motion.span
          key={i}
          className="absolute top-0"
          style={{ left: `${c.left}%`, width: c.size, height: c.round ? c.size : c.size * 0.45, background: c.color, borderRadius: c.round ? '50%' : 2 }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', x: c.drift, rotate: c.spin, opacity: [1, 1, 0.8] }}
          transition={{ duration: c.duration, delay: c.wait, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
};
