import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import type { AssignmentBuilderController } from './useAssignmentBuilder';

/** Tab "Câu hỏi": tiêu đề, danh sách câu hỏi và nút thêm câu / tạo bằng AI. */
export const QuestionsTab: React.FC<{ builder: AssignmentBuilderController }> = ({ builder }) => {
  const { title, setTitle, description, setDescription, setShowAIModal, questions, addQuestion } = builder;

  return (
    <div className="space-y-6 pb-24">
      {/* Tên và mô tả bài tập */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-3">
        <label className="block">
          <span className="text-sm font-semibold text-slate-600">Tên bài tập</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full h-12 rounded-2xl border-2 border-slate-200 px-4 text-lg sm:text-xl font-black text-slate-900 focus:border-indigo-400 focus:outline-none placeholder:text-slate-300 placeholder:font-bold"
            placeholder="Vd: Ôn tập phân số"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-600">Hướng dẫn cho học sinh <span className="font-normal text-slate-400">(không bắt buộc)</span></span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-base text-slate-700 focus:border-indigo-400 focus:outline-none resize-y placeholder:text-slate-300"
            placeholder="Vd: Làm cẩn thận, ghi rõ đơn vị."
            rows={2}
          />
        </label>
        <p className="text-sm text-slate-500">{questions.length} câu hỏi · Tổng {questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0)} điểm</p>
      </div>

      {/* Questions List */}
      {questions.map((q, index) => (
        <QuestionCard key={q.id} builder={builder} q={q} index={index} />
      ))}

      {/* Add Question Button & AI Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={addQuestion}
          className="w-full sm:w-auto px-6 h-14 bg-white border-2 border-dashed border-indigo-300 rounded-2xl flex items-center justify-center gap-2 text-indigo-700 font-black hover:bg-indigo-50 transition-colors active:scale-95"
        >
          <Plus size={22} />
          Thêm câu hỏi
        </button>

        <button
          onClick={() => setShowAIModal(true)}
          className="w-full sm:w-auto px-6 h-14 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl flex items-center justify-center gap-3 font-black shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transition-all active:scale-95 border border-white/20 group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Sparkles size={20} className="animate-pulse" />
          <span>Tạo bằng AI ✨</span>
        </button>
      </div>
    </div>
  );
};
