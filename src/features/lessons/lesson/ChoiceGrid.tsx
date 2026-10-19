import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { MathRenderer } from '../../../content/MathRenderer';
import { fitsTwoColumns } from './lessonLogic';

/**
 * Các đáp án dạng ô to, nổi khối (bấm thấy lún xuống), có số phím tắt 1–4.
 * Sau khi kiểm tra: đáp án đúng nảy lên màu xanh, đáp án chọn sai rung màu đỏ.
 */
export const ChoiceGrid: React.FC<{
  options: string[];
  selected: string | null;
  checked: boolean;
  answer: string;
  onSelect: (option: string) => void;
}> = ({ options, selected, checked, answer, onSelect }) => (
  <div className={cn('grid gap-3', fitsTwoColumns(options) ? 'grid-cols-2' : 'grid-cols-1')} role="radiogroup" aria-label="Các đáp án">
    {options.map((option, i) => {
      const isSelected = selected === option;
      const isAnswer = option === answer;
      const state = !checked ? (isSelected ? 'selected' : 'idle') : isAnswer ? 'right' : isSelected ? 'wrong' : 'dim';
      return (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={isSelected}
          disabled={checked}
          onClick={() => onSelect(option)}
          className={cn(
            'relative min-h-[64px] px-4 py-3 rounded-2xl border-2 border-b-[5px] text-left flex items-center gap-3 transition-colors',
            'active:translate-y-[3px] active:border-b-2 disabled:active:translate-y-0',
            state === 'idle' && 'bg-white border-slate-200 border-b-slate-300 hover:bg-slate-50',
            state === 'selected' && 'bg-indigo-50 border-indigo-400 border-b-indigo-500',
            state === 'right' && 'bg-emerald-50 border-emerald-500 border-b-emerald-600 lesson-pop',
            state === 'wrong' && 'bg-rose-50 border-rose-400 border-b-rose-500 lesson-shake',
            state === 'dim' && 'bg-white border-slate-200 opacity-50'
          )}
        >
          <span
            className={cn(
              'w-8 h-8 shrink-0 rounded-lg border-2 flex items-center justify-center text-sm font-black',
              state === 'selected' ? 'border-indigo-400 text-indigo-600 bg-white'
                : state === 'right' ? 'border-emerald-500 bg-emerald-500 text-white'
                : state === 'wrong' ? 'border-rose-400 bg-rose-400 text-white'
                : 'border-slate-200 text-slate-400'
            )}
            aria-hidden
          >
            {state === 'right' ? <Check size={18} strokeWidth={3} /> : state === 'wrong' ? <X size={18} strokeWidth={3} /> : i + 1}
          </span>
          <span className={cn('text-lg font-bold pointer-events-none min-w-0', state === 'selected' ? 'text-indigo-700' : 'text-slate-800')}>
            <MathRenderer content={option} />
          </span>
        </button>
      );
    })}
  </div>
);
