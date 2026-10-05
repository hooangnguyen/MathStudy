import React from 'react';
import { Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../utils/utils';
import { MathSymbolPicker } from '../../../components/common/MathSymbolPicker';
import { MathEquationEditor } from '../../../components/common/MathEquationEditor';
import type { AssignmentBuilderController } from './useAssignmentBuilder';

/** Một câu hỏi trong trình soạn: nội dung, loại câu, đáp án và điểm. */
export const QuestionCard: React.FC<{ builder: AssignmentBuilderController; q: AssignmentBuilderController['questions'][number]; index: number }> = ({ builder, q, index }) => {
  const { activePicker, setActivePicker, showQuestionTypeDropdown, setShowQuestionTypeDropdown, questionTypeDropdownRefs, questionMathRefs, optionMathRefs, updateQuestion, addOption, updateOption, removeOption, removeQuestion, duplicateQuestion, handleSymbolSelect } = builder;

  return (
    <div key={q.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 space-y-6 relative group transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4">
        {/* Question Text with MathLive Input */}
        <div className="flex-1 relative min-w-0">
          <MathEquationEditor
            ref={(el: any) => { if (el) questionMathRefs.current.set(q.id, el); }}
            value={q.text}
            onChange={(latex) => updateQuestion(q.id, 'text', latex)}
            placeholder="Câu hỏi"
            className="bg-transparent border-none rounded-none w-full"
            onOpenPicker={() => setActivePicker(activePicker?.id === q.id && activePicker?.type === 'question' ? null : { type: 'question', id: q.id })}
          />

          {/* Math Symbol Picker Popup */}
          {activePicker?.id === q.id && activePicker?.type === 'question' && (
            <div className="absolute right-0 top-full mt-2 z-[120] w-[22rem] max-w-[calc(100vw-2rem)]">
              <MathSymbolPicker onSelect={handleSymbolSelect} onClose={() => setActivePicker(null)} />
            </div>
          )}
        </div>

        {/* Question Type Selector (Google Forms style) */}
        <div className="relative shrink-0 self-center sm:self-start">
          <button
            onClick={() => setShowQuestionTypeDropdown(showQuestionTypeDropdown === q.id ? null : q.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all min-w-[180px] justify-between border-2 border-slate-100 hover:border-slate-200 bg-white shadow-sm",
              q.type === 'multiple_choice' ? "text-indigo-600" : q.type === 'checkbox' ? "text-emerald-600" : "text-amber-600"
            )}
          >
            <span className="flex items-center gap-2">
              {q.type === 'multiple_choice' ? (
                <div className="w-4 h-4 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                </div>
              ) : q.type === 'checkbox' ? (
                <div className="w-4 h-4 rounded border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={10} className="text-white" />
                </div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              )}
              {q.type === 'multiple_choice' ? 'Trắc nghiệm' : q.type === 'checkbox' ? 'Hộp kiểm' : 'Trả lời ngắn'}
            </span>
            <svg className={cn("w-4 h-4 text-slate-400 transition-transform", showQuestionTypeDropdown === q.id && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showQuestionTypeDropdown === q.id && (
            <div ref={(el) => { if (el) questionTypeDropdownRefs.current.set(q.id, el); }} className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="p-2">
                <button
                  onClick={() => {
                    updateQuestion(q.id, 'type', 'multiple_choice');
                    setShowQuestionTypeDropdown(null);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                    q.type === 'multiple_choice' ? "bg-indigo-50" : "hover:bg-slate-50"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-700">Trắc nghiệm</p>
                    <p className="text-[10px] font-medium text-slate-400">Chọn một đáp án đúng</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    updateQuestion(q.id, 'type', 'checkbox');
                    setShowQuestionTypeDropdown(null);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                    q.type === 'checkbox' ? "bg-emerald-50" : "hover:bg-slate-50"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-700">Hộp kiểm</p>
                    <p className="text-[10px] font-medium text-slate-400">Chọn nhiều đáp án đúng</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    updateQuestion(q.id, 'type', 'short_answer');
                    setShowQuestionTypeDropdown(null);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                    q.type === 'short_answer' ? "bg-amber-50" : "hover:bg-slate-50"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-700">Trả lời ngắn</p>
                    <p className="text-[10px] font-medium text-slate-400">Học sinh tự nhập đáp án</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Options for Multiple Choice */}
      {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
        <div className="space-y-3 pl-2">
          {q.options.map((opt, optIndex) => (
            <div key={optIndex} className="flex items-start gap-3">
              <button
                type="button"
                className={cn(
                  "w-6 h-6 flex items-center justify-center border-2 transition-colors shrink-0 mt-3",
                  q.type === 'multiple_choice' ? "rounded-full" : "rounded-md",
                  (q.type === 'multiple_choice' ? q.correctAnswer === optIndex : (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIndex)))
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 hover:border-indigo-500 bg-white"
                )}
                onClick={() => {
                  if (q.type === 'multiple_choice') {
                    updateQuestion(q.id, 'correctAnswer', optIndex);
                  } else {
                    const current = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                    const exists = current.includes(optIndex);
                    const next = exists ? current.filter(i => i !== optIndex) : [...current, optIndex];
                    updateQuestion(q.id, 'correctAnswer', next);
                  }
                }}
              >
                {q.type === 'multiple_choice'
                  ? (q.correctAnswer === optIndex && <CheckCircle2 size={16} strokeWidth={3} />)
                  : (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIndex) && <CheckCircle2 size={16} strokeWidth={3} />)
                }
              </button>

              <div className="flex-1 relative bg-white min-w-0">
                <MathEquationEditor
                  ref={(el: any) => { if (el) optionMathRefs.current.set(`${q.id}-${optIndex}`, el); }}
                  value={opt}
                  onChange={(latex) => updateOption(q.id, optIndex, latex)}
                  placeholder={`Tùy chọn ${optIndex + 1}`}
                  className="bg-transparent w-full"
                  onOpenPicker={() => setActivePicker(activePicker?.id === q.id && activePicker?.type === 'option' && activePicker?.optIndex === optIndex ? null : { type: 'option', id: q.id, optIndex })}
                />
                {/* Math Symbol Picker Popup for Options */}
                {activePicker?.id === q.id && activePicker?.type === 'option' && activePicker?.optIndex === optIndex && (
                  <div className="absolute right-0 top-full mt-2 z-[120] w-[22rem] max-w-[calc(100vw-2rem)]">
                    <MathSymbolPicker onSelect={handleSymbolSelect} onClose={() => setActivePicker(null)} />
                  </div>
                )}
              </div>

              {q.options.length > 1 && (
                <button
                  onClick={() => removeOption(q.id, optIndex)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors shrink-0 mt-2"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <div className={cn(
              "w-5 h-5 border-2 border-slate-200",
              q.type === 'multiple_choice' ? "rounded-full" : "rounded-md"
            )} />
            <button
              onClick={() => addOption(q.id)}
              className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors"
            >
              Thêm tùy chọn
            </button>
          </div>
        </div>
      )}

      {/* Short Answer */}
      {q.type === 'short_answer' && (
        <div className="pl-2">
          <div className="w-1/2 border-b-2 border-slate-200 pb-2">
            <p className="text-sm font-bold text-slate-400">Văn bản câu trả lời ngắn</p>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm:</span>
            <input
              type="number"
              value={q.points}
              onChange={(e) => updateQuestion(q.id, 'points', parseInt(e.target.value) || 0)}
              className="w-10 bg-transparent text-sm font-black text-slate-900 border-none outline-none focus:ring-0 p-0 text-center"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100/50">
          <button
            onClick={() => duplicateQuestion(q.id)}
            className="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-white hover:shadow-sm transition-all active:scale-95"
            title="Nhân bản"
          >
            <Copy size={18} />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button
            onClick={() => removeQuestion(q.id)}
            className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-white hover:shadow-sm transition-all active:scale-95"
            title="Xóa"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

    </div>
  );
};
