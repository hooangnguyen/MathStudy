import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';
import { Mascot } from './Mascot';
import { Confetti } from '../Confetti';

const STARS = [
  { x: '8%', y: '18%', size: 26, delay: 0.2 },
  { x: '84%', y: '10%', size: 32, delay: 0.6 },
  { x: '88%', y: '62%', size: 22, delay: 1.0 },
  { x: '2%', y: '66%', size: 20, delay: 1.4 },
];

const Star: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <path d="M12 1.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 8.7l7.1-.6z" fill="#facc15" stroke="#ca8a04" strokeWidth={1.2} strokeLinejoin="round" />
  </svg>
);

/**
 * Hoạt cảnh ăn mừng kiểu Duolingo: tia sáng xoay phía sau, Dino nhảy múa
 * (bật lên, lắc lư, thỉnh thoảng xoay một vòng), sao lấp lánh và pháo giấy.
 * Thiết bị đặt "giảm chuyển động" thì chỉ hiện hình tĩnh.
 */
export const MascotCelebration: React.FC<{ className?: string; confetti?: boolean }> = ({ className, confetti = true }) => {
  const reduce = useReducedMotion();
  return (
    <div className={cn('relative w-64 h-64', className)} role="img" aria-label="Dino nhảy múa ăn mừng">
      {/* tia sáng */}
      <motion.div
        aria-hidden
        className="absolute inset-[-12%] rounded-full"
        style={{
          background: 'repeating-conic-gradient(from 0deg, rgba(250,204,21,0.28) 0deg 12deg, transparent 12deg 30deg)',
          maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
        }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />
      <div aria-hidden className="absolute inset-[18%] rounded-full bg-amber-100/70 blur-2xl" />

      {/* sao lấp lánh */}
      {STARS.map((s, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="absolute"
          style={{ left: s.x, top: s.y }}
          initial={{ scale: 0, rotate: -30 }}
          animate={reduce ? { scale: 1 } : { scale: [0, 1.2, 1, 0], rotate: [-30, 0, 15, 30] }}
          transition={{ duration: 1.8, delay: s.delay, repeat: Infinity, repeatDelay: 0.8 }}
        >
          <Star size={s.size} />
        </motion.div>
      ))}

      {/* Dino nhảy múa: 2 cú bật + lắc lư (nén/giãn ở chân), rồi 1 cú xoay vòng quanh tâm */}
      <motion.div
        className="absolute inset-[8%]"
        style={{ originY: 1 }}
        animate={reduce ? undefined : {
          y: [0, -30, 0, -30, 0, -46, 0, 0],
          scaleX: [1, 0.92, 1.12, 0.92, 1.12, 0.94, 1.1, 1],
          scaleY: [1, 1.1, 0.86, 1.1, 0.86, 1.08, 0.9, 1],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.14, 0.28, 0.42, 0.56, 0.72, 0.88, 1] }}
      >
        <motion.div
          className="w-full h-full"
          animate={reduce ? undefined : { rotate: [0, -10, 0, 10, 0, 360, 360, 360] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.14, 0.28, 0.42, 0.56, 0.8, 0.88, 1] }}
        >
          <Mascot mood="celebrate" still className="w-full h-full" />
        </motion.div>
      </motion.div>

      {confetti && <Confetti count={70} delay={0.2} />}
    </div>
  );
};
