import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Clock, Flame, Star, Target } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { MascotCelebration } from '../../../components/mascot/MascotCelebration';
import { Confetti } from '../../../components/Confetti';
import { lessonPoints } from '../../../../shared/lesson';
import { formatDuration, resultTitle } from './lessonLogic';
import { BigButton } from './LessonParts';

/** Đếm số tăng dần cho sinh động */
const useCountUp = (target: number, delay: number) => {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / 800));
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, reduce]);
  return value;
};

const STAT_TONES = {
  amber: 'border-amber-400 bg-amber-400 text-amber-700',
  green: 'border-emerald-500 bg-emerald-500 text-emerald-700',
  blue: 'border-sky-500 bg-sky-500 text-sky-700',
  orange: 'border-orange-500 bg-orange-500 text-orange-700',
};

const StatCard: React.FC<{ label: string; tone: keyof typeof STAT_TONES; icon: React.ReactNode; delay: number; children: React.ReactNode }> = ({ label, tone, icon, delay, children }) => {
  const [border, bg, text] = STAT_TONES[tone].split(' ');
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 18 }}
      className={cn('rounded-2xl border-2 overflow-hidden', border)}
    >
      <p className={cn('text-white text-xs font-black uppercase tracking-wide text-center py-1', bg)}>{label}</p>
      <p className={cn('bg-white py-2.5 text-xl font-black flex items-center justify-center gap-1.5 tabular-nums', text)}>{icon}{children}</p>
    </motion.div>
  );
};

/** Màn hoàn thành bài học kiểu Duolingo: Dino nhảy múa, pháo giấy, các chỉ số đếm lên. */
export const LessonComplete: React.FC<{
  lessonTitle: string;
  percent: number;
  durationMs: number;
  bestCombo: number;
  /** Bài đã hoàn thành trước đây thì không cộng điểm nữa */
  alreadyCompleted: boolean;
  onContinue: () => void;
}> = ({ lessonTitle, percent, durationMs, bestCombo, alreadyCompleted, onContinue }) => {
  const points = alreadyCompleted ? 0 : lessonPoints(percent);
  const shownPoints = useCountUp(points, 700);
  const shownPercent = useCountUp(percent, 850);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden">
      <Confetti count={90} delay={0.3} />
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 pt-8 gap-2 text-center">
        <MascotCelebration confetti={false} className="w-60 h-60" />
        <motion.h1
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 14 }}
          className="text-3xl font-black text-amber-500"
        >
          {resultTitle(percent)}
        </motion.h1>
        <p className="text-slate-500 font-semibold">Bạn đã hoàn thành <b className="text-slate-700">{lessonTitle}</b></p>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
          <StatCard label={alreadyCompleted ? 'Ôn tập' : 'Điểm thưởng'} tone="amber" delay={0.5} icon={<Star size={20} className="fill-amber-400 text-amber-500" />}>
            {alreadyCompleted ? 'Đã học' : `+${shownPoints}`}
          </StatCard>
          <StatCard label="Chính xác" tone="green" delay={0.65} icon={<Target size={20} />}>{shownPercent}%</StatCard>
          <StatCard label="Thời gian" tone="blue" delay={0.8} icon={<Clock size={20} />}>{formatDuration(durationMs)}</StatCard>
          <StatCard label="Chuỗi đúng" tone="orange" delay={0.95} icon={<Flame size={20} className="fill-orange-400" />}>{bestCombo}</StatCard>
        </div>
      </div>
      <div className="p-4 border-t-2 border-slate-100">
        <BigButton tone="green" onClick={onContinue} autoFocus>Tiếp tục</BigButton>
      </div>
    </div>
  );
};
