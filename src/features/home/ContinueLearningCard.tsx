import React from 'react';
import { Play, PartyPopper } from 'lucide-react';

export interface NextLesson {
  id: number;
  title: string;
  topic: string;
  unitTitle: string;
  lessonIndex: number;
  lessonsInUnit: number;
  completedInUnit: number;
}

interface ContinueLearningCardProps {
  next: NextLesson | null;
  loading: boolean;
  onStart: (next: NextLesson) => void;
}

/** Thẻ lớn ở đầu trang chủ: bấm một lần là vào ngay bài học tiếp theo. */
export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({ next, loading, onStart }) => {
  if (loading) {
    return <div className="h-44 rounded-3xl bg-slate-200/70 animate-pulse" aria-label="Đang tải bài học" />;
  }

  if (!next) {
    return (
      <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 flex items-center gap-4">
        <PartyPopper size={40} className="shrink-0" />
        <div>
          <p className="text-lg font-black">Bạn đã học hết các bài!</p>
          <p className="text-sm font-medium text-white/90">Hãy vào Đối kháng để luyện thêm nhé.</p>
        </div>
      </div>
    );
  }

  const percent = Math.round((next.completedInUnit / next.lessonsInUnit) * 100);
  return (
    <div className="rounded-3xl p-5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
      <p className="text-sm font-semibold text-white/85">Tiếp tục học</p>
      <h2 className="text-2xl font-black leading-tight mt-0.5">{next.unitTitle}</h2>
      <p className="text-base font-semibold text-white/90 mt-1">
        Bài {next.lessonIndex} / {next.lessonsInUnit}
      </p>

      <div className="mt-3 h-3 bg-white/25 rounded-full overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.max(percent, 4)}%` }} />
      </div>
      <p className="text-xs font-semibold text-white/80 mt-1.5">Đã xong {next.completedInUnit} / {next.lessonsInUnit} bài của chương</p>

      <button
        onClick={() => onStart(next)}
        className="mt-4 w-full h-14 bg-white text-indigo-600 rounded-2xl text-lg font-black flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
      >
        <Play size={22} className="fill-indigo-600" />
        Học ngay
      </button>
    </div>
  );
};
