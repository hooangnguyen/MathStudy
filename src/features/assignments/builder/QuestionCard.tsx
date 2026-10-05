import React from 'react';
import { Trash2, Copy, Check, Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { MathTextEditor } from '../../../content/MathTextEditor';
import type { AssignmentBuilderController } from './useAssignmentBuilder';

type QuestionType = 'multiple_choice' | 'checkbox' | 'short_answer';

const TYPES: { value: QuestionType; label: string; hint: string }[] = [
  { value: 'multiple_choice', label: '1 đáp án', hint: 'Trắc nghiệm: học sinh chọn 1 đáp án đúng' },
  { value: 'checkbox', label: 'Nhiều đáp án', hint: 'Học sinh chọn tất cả các đáp án đúng' },
  { value: 'short_answer', label: 'Tự điền', hint: 'Trả lời ngắn: học sinh tự gõ câu trả lời' },
];

const letter = (i: number) => String.fromCharCode(65 + i);

/** Một câu hỏi trong trình soạn: nội dung (chữ + công thức), loại câu, đáp án và điểm. */
export const QuestionCard: React.FC<{ builder: AssignmentBuilderController; q: AssignmentBuilderController['questions'][number]; index: number }> = ({ builder, q, index }) => {
  const { updateQuestion, changeQuestionType, addOption, updateOption, removeOption, removeQuestion, duplicateQuestion, questions } = builder;

  const isCorrect = (optIndex: number) =>
    q.type === 'multiple_choice' ? q.correctAnswer === optIndex : Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIndex);

  const toggleCorrect = (optIndex: number) => {
    if (q.type === 'multiple_choice') {
      updateQuestion(q.id, 'correctAnswer', optIndex);
    } else {
      const current: number[] = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
      updateQuestion(q.id, 'correctAnswer', current.includes(optIndex) ? current.filter(i => i !== optIndex) : [...current, optIndex].sort());
    }
  };

  const activeType = TYPES.find(t => t.value === q.type) ?? TYPES[0];

  return (
    <section className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-5" aria-label={`Câu ${index + 1}`}>
      {/* Đầu thẻ: số câu, điểm, nhân bản, xoá */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-sm font-black">Câu {index + 1}</span>
        <label className="ml-auto flex items-center gap-2 text-sm font-semibold text-slate-600">
          Điểm
          <input
            type="number"
            min={0}
            value={q.points}
            onChange={(e) => updateQuestion(q.id, 'points', Math.max(0, parseInt(e.target.value) || 0))}
            className="w-16 h-10 rounded-xl border-2 border-slate-200 text-center text-base font-black text-slate-900 focus:border-indigo-400 focus:outline-none"
          />
        </label>
        <button onClick={() => duplicateQuestion(q.id)} title="Nhân bản câu hỏi" aria-label="Nhân bản câu hỏi"
          className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center">
          <Copy size={18} />
        </button>
        <button onClick={() => removeQuestion(q.id)} disabled={questions.length <= 1} title="Xoá câu hỏi" aria-label="Xoá câu hỏi"
          className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center disabled:opacity-40">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Nội dung câu hỏi */}
      <MathTextEditor
        value={q.text}
        onChange={(text) => updateQuestion(q.id, 'text', text)}
        placeholder="Nhập câu hỏi… (Enter để xuống dòng)"
        ariaLabel={`Nội dung câu ${index + 1}`}
      />

      {/* Loại câu hỏi: 3 nút thay cho menu thả xuống */}
      <div>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100" role="radiogroup" aria-label="Loại câu hỏi">
          {TYPES.map((t) => (
            <button
              key={t.value}
              role="radio"
              aria-checked={q.type === t.value}
              onClick={() => changeQuestionType(q.id, t.value)}
              className={cn(
                'h-10 rounded-xl text-[13px] sm:text-sm font-bold whitespace-nowrap transition-colors',
                q.type === t.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-1.5 px-1">{activeType.hint}</p>
      </div>

      {/* Đáp án trắc nghiệm */}
      {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-600">Đáp án <span className="font-normal text-slate-500">— bấm vào chữ cái để đánh dấu đáp án đúng</span></p>
          {q.options.map((opt, optIndex) => {
            const correct = isCorrect(optIndex);
            return (
              <div key={optIndex} className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => toggleCorrect(optIndex)}
                  aria-pressed={correct}
                  aria-label={`Đáp án ${letter(optIndex)}${correct ? ' (đúng)' : ''}`}
                  title={correct ? 'Đáp án đúng' : 'Đánh dấu là đáp án đúng'}
                  className={cn(
                    'w-11 h-11 mt-0.5 shrink-0 flex items-center justify-center font-black text-base border-2 transition-colors',
                    q.type === 'multiple_choice' ? 'rounded-full' : 'rounded-xl',
                    correct ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-slate-500 hover:border-emerald-400'
                  )}
                >
                  {correct ? <Check size={20} strokeWidth={3} /> : letter(optIndex)}
                </button>
                <div className="flex-1 min-w-0">
                  <MathTextEditor
                    compact
                    value={opt}
                    onChange={(value) => updateOption(q.id, optIndex, value)}
                    placeholder={`Đáp án ${letter(optIndex)}`}
                  />
                </div>
                {q.options.length > 2 && (
                  <button
                    onClick={() => removeOption(q.id, optIndex)}
                    aria-label={`Xoá đáp án ${letter(optIndex)}`}
                    className="w-11 h-11 mt-0.5 shrink-0 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            );
          })}
          {q.options.length < 8 && (
            <button
              onClick={() => addOption(q.id)}
              className="ml-[52px] h-10 px-3 rounded-xl text-sm font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5"
            >
              <Plus size={18} /> Thêm đáp án
            </button>
          )}
        </div>
      )}

      {/* Trả lời ngắn: đáp án dùng để tự chấm */}
      {q.type === 'short_answer' && (
        <label className="block">
          <span className="text-sm font-semibold text-slate-600">Đáp án đúng</span>
          <input
            type="text"
            value={typeof q.correctAnswer === 'string' ? q.correctAnswer : ''}
            onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
            placeholder="Vd: 42 (để trống nếu muốn tự chấm tay)"
            className="mt-1.5 w-full h-12 rounded-2xl border-2 border-slate-200 px-4 text-base focus:border-indigo-400 focus:outline-none"
          />
          <span className="text-xs text-slate-500 mt-1 block">Không phân biệt chữ hoa/thường và dấu cách thừa.</span>
        </label>
      )}
    </section>
  );
};
