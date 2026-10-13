import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

const SYMBOLS = ['+', '−', '×', '÷', '=', 'π', '√', '%', '½', '∞', '△', '★'];

// Vị trí/tốc độ cố định để không nhảy lung tung mỗi lần render
const ITEMS = SYMBOLS.map((s, i) => ({
  s,
  left: `${(i * 37 + 7) % 92}%`,
  top: `${(i * 53 + 11) % 88}%`,
  size: 22 + ((i * 7) % 4) * 8,
  duration: 6 + (i % 5),
  delay: (i % 4) * 0.7,
}));

/** Nền trang trí: ký hiệu toán bay nhẹ (tắt chuyển động nếu máy đặt "giảm chuyển động"). */
export const FloatingSymbols: React.FC<{ className?: string }> = ({ className }) => {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}>
      {ITEMS.map((it) => (
        <motion.span
          key={it.s}
          className="absolute font-black text-white/15 select-none"
          style={{ left: it.left, top: it.top, fontSize: it.size }}
          animate={reduce ? undefined : { y: [0, -18, 0], rotate: [0, 10, 0] }}
          transition={{ duration: it.duration, delay: it.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          {it.s}
        </motion.span>
      ))}
    </div>
  );
};
