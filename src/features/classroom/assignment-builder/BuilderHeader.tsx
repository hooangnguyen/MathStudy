import React from 'react';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../../utils/utils';
import type { AssignmentBuilderController } from './useAssignmentBuilder';

/** Thanh tiêu đề: tên bài, lưu nháp, giao bài và chuyển tab. */
export const BuilderHeader: React.FC<{ builder: AssignmentBuilderController }> = ({ builder }) => {
  const { classId, initialDraft, onClose, activeTab, setActiveTab, title, dueDate, isSubmitting, isSavingDraft, selectedClassId, questions, handleAssign, handleSaveDraft, handleDeleteExistingDraft } = builder;

  return (
    <div className="bg-white border-b border-slate-200 shrink-0">
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={onClose} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">{initialDraft?.id ? 'Sửa bản nháp' : 'Soạn bài tập mới'}</p>
            <h1 className="text-lg font-black text-slate-900 truncate">{title.trim() || 'Bài tập chưa đặt tên'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end sm:justify-start">
          {initialDraft?.id && (
            <button
              onClick={handleDeleteExistingDraft}
              className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-[1rem] sm:rounded-2xl font-black shadow-sm active:scale-95 transition-all hover:bg-red-100 shrink-0"
              title="Xóa bản nháp"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft || !title.trim()}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-100 text-slate-600 rounded-[1rem] sm:rounded-2xl font-black shadow-sm disabled:opacity-50 active:scale-95 transition-all text-xs sm:text-sm hover:bg-slate-200 flex-1 sm:flex-none text-center"
          >
            {isSavingDraft ? 'Đang lưu...' : 'Lưu nháp'}
          </button>
          <button
            onClick={handleAssign}
            disabled={isSubmitting}
            className={cn(
              "px-4 sm:px-6 py-2 sm:py-2.5 flex-1 sm:flex-none rounded-[1rem] sm:rounded-2xl font-black transition-all text-xs sm:text-sm text-center",
              isSubmitting
                ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-[0_4px_0_#cbd5e1]"
                : (!title.trim() || !(classId || selectedClassId) || !dueDate || questions.length === 0)
                  ? "bg-slate-200 text-slate-400 shadow-[0_4px_0_#cbd5e1] translate-y-0"
                  : "bg-[#1cb0f6] text-white shadow-[0_4px_0_#1899d6] active:shadow-[0_0_0_#1899d6] active:translate-y-1 hover:bg-[#23beff]"
            )}
          >
            {isSubmitting ? 'Đợi...' : 'Giao bài'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-8 px-6">
        <button
          onClick={() => setActiveTab('questions')}
          className={cn(
            "pb-4 text-sm font-black transition-colors relative",
            activeTab === 'questions' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Câu hỏi
          {activeTab === 'questions' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "pb-4 text-sm font-black transition-colors relative",
            activeTab === 'settings' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Cài đặt
          {activeTab === 'settings' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
          )}
        </button>
      </div>
    </div>
  );
};
