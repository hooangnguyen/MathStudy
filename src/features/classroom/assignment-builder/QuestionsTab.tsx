import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import type { AssignmentBuilderController } from './useAssignmentBuilder';

/** Tab "Câu hỏi": tiêu đề, danh sách câu hỏi và nút thêm câu / tạo bằng AI. */
export const QuestionsTab: React.FC<{ builder: AssignmentBuilderController }> = ({ builder }) => {
  const { title, setTitle, description, setDescription, setShowAIModal, questions, addQuestion } = builder;

  return (
    <div className="space-y-6 pb-24">
      {/* Title Card */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border-t-8 border-t-indigo-500 border-x border-b border-slate-200">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-3xl font-black text-slate-900 bg-transparent border-none outline-none mb-4 placeholder:text-slate-300"
          placeholder="Tiêu đề bài tập"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full text-sm font-bold text-slate-500 bg-transparent border-none outline-none resize-none placeholder:text-slate-300"
          placeholder="Mô tả bài tập (không bắt buộc)"
          rows={2}
        />
      </div>

      {/* Questions List */}
      {questions.map((q, index) => (
        <QuestionCard key={q.id} builder={builder} q={q} index={index} />
      ))}

      {/* Add Question Button & AI Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={addQuestion}
          className="w-full sm:w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all active:scale-95 group"
          title="Thêm câu hỏi thủ công"
        >
          <Plus size={24} className="group-hover:scale-110 transition-transform" />
          <span className="sm:hidden font-black ml-2">Thêm câu hỏi mới</span>
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
