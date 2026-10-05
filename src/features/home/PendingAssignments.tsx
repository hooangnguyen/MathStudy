import React from 'react';
import { BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/utils';
import type { PendingAssignment } from '../../services/assignmentService';

interface PendingAssignmentsProps {
  items: PendingAssignment[] | null; // null = đang tải
  onOpen: (item: PendingAssignment) => void;
}

const DAY = 24 * 60 * 60 * 1000;

/** Nhãn hạn nộp dễ hiểu: "Hôm nay", "Ngày mai", "Còn 3 ngày", "Quá hạn". */
export const dueLabel = (due: Date | null, now = new Date()): { text: string; tone: 'red' | 'amber' | 'slate' } => {
  if (!due) return { text: 'Không có hạn', tone: 'slate' };
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.floor((new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() - startOfToday) / DAY);
  if (due.getTime() < now.getTime()) return { text: 'Quá hạn', tone: 'red' };
  if (days === 0) return { text: 'Hạn hôm nay', tone: 'red' };
  if (days === 1) return { text: 'Hạn ngày mai', tone: 'amber' };
  if (days <= 3) return { text: `Còn ${days} ngày`, tone: 'amber' };
  return { text: `Còn ${days} ngày`, tone: 'slate' };
};

const toneClass = {
  red: 'bg-rose-100 text-rose-700',
  amber: 'bg-amber-100 text-amber-800',
  slate: 'bg-slate-100 text-slate-600',
};

/** Danh sách bài tập chưa nộp, hạn gần nhất lên đầu; bấm vào là mở bài để làm. */
export const PendingAssignments: React.FC<PendingAssignmentsProps> = ({ items, onOpen }) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-black text-slate-900">Bài tập cần làm</h2>
        {items && items.length > 0 && (
          <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">{items.length} bài</span>
        )}
      </div>

      {items === null ? (
        <div className="space-y-2">
          <div className="h-[72px] rounded-2xl bg-slate-200/70 animate-pulse" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-100 p-4 flex items-center gap-3">
          <CheckCircle2 size={28} className="text-emerald-500 shrink-0" />
          <p className="text-base font-semibold text-slate-700">Không có bài tập nào phải làm. Giỏi lắm!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 3).map((item) => {
            const due = dueLabel(item.dueDate);
            return (
              <li key={`${item.classId}/${item.assignmentId}`}>
                <button
                  onClick={() => onOpen(item)}
                  className="w-full text-left rounded-2xl bg-white border border-slate-100 shadow-sm p-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', toneClass[due.tone])}>{due.text}</span>
                      <span className="text-xs font-semibold text-slate-500 truncate">{item.className}</span>
                    </div>
                  </div>
                  <ChevronRight size={22} className="text-slate-400 shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
