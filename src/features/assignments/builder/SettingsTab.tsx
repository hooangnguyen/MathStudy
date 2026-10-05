import React from 'react';
import { Settings, Calendar, Target } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { AssignmentBuilderController } from './useAssignmentBuilder';

/** Tab "Cài đặt": lớp được giao, hạn nộp và tuỳ chọn. */
export const SettingsTab: React.FC<{ builder: AssignmentBuilderController }> = ({ builder }) => {
  const { classId, dueDate, setDueDate, shuffleQuestions, setShuffleQuestions, showScoreImmediate, setShowScoreImmediate, teacherClasses, selectedClassId, setSelectedClassId } = builder;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 space-y-8">
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Target className="text-indigo-500" /> Đối tượng giao bài
          </h3>
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Chọn lớp</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {teacherClasses.map(c => (
                <label key={c.id} className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors",
                  (classId === c.id || selectedClassId === c.id)
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-100 hover:border-indigo-500"
                )}>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    checked={classId === c.id || selectedClassId === c.id}
                    onChange={() => !classId && setSelectedClassId(c.id)}
                    disabled={!!classId}
                  />
                  <span className="text-sm font-black text-slate-700">{c.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div>
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Calendar className="text-indigo-500" /> Thời gian
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Hạn chót nộp bài</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div>
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Settings className="text-indigo-500" /> Tùy chọn khác
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-slate-200 transition-colors">
              <div>
                <p className="text-sm font-black text-slate-700">Trộn câu hỏi</p>
                <p className="text-xs font-bold text-slate-400 mt-1">Thứ tự câu hỏi sẽ thay đổi với mỗi học sinh</p>
              </div>
              <div className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", shuffleQuestions ? "bg-indigo-600" : "bg-slate-200")}>
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="peer sr-only"
                />
                <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", shuffleQuestions ? "translate-x-6" : "translate-x-1")} />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-slate-200 transition-colors">
              <div>
                <p className="text-sm font-black text-slate-700">Hiển thị điểm ngay</p>
                <p className="text-xs font-bold text-slate-400 mt-1">Học sinh thấy điểm ngay sau khi nộp bài</p>
              </div>
              <div className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", showScoreImmediate ? "bg-indigo-600" : "bg-slate-200")}>
                <input
                  type="checkbox"
                  checked={showScoreImmediate}
                  onChange={(e) => setShowScoreImmediate(e.target.checked)}
                  className="peer sr-only"
                />
                <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", showScoreImmediate ? "translate-x-6" : "translate-x-1")} />
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
