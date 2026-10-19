import React from 'react';
import { Delete } from 'lucide-react';
import { cn } from '../../../lib/utils';

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', ',', '0', '/'];

/**
 * Ô trả lời + bàn phím số trên màn hình (không phải bật bàn phím điện thoại, gõ phân số dễ):
 * chữ số, dấu phẩy, dấu "/" cho phân số, dấu "−" cho số âm và nút xoá.
 */
export const AnswerPad: React.FC<{
  value: string;
  onChange: (value: string) => void;
  checked: boolean;
  correct: boolean;
}> = ({ value, onChange, checked, correct }) => {
  const press = (key: string) => {
    if (checked) return;
    if (key === 'back') onChange(value.slice(0, -1));
    else if (value.length < 12) onChange(value + key);
  };

  return (
    <div className="space-y-4">
      <div
        aria-live="polite"
        aria-label="Câu trả lời của bạn"
        className={cn(
          'h-20 rounded-2xl border-2 border-dashed flex items-center justify-center text-4xl font-black tabular-nums tracking-wide',
          !checked && (value ? 'border-indigo-400 bg-indigo-50/50 text-indigo-700' : 'border-slate-300 text-slate-400'),
          checked && correct && 'border-solid border-emerald-500 bg-emerald-50 text-emerald-700 lesson-pop',
          checked && !correct && 'border-solid border-rose-400 bg-rose-50 text-rose-600 lesson-shake'
        )}
      >
        {value || <span className="text-xl font-bold">Nhập đáp án</span>}
        {!checked && <span className="w-[3px] h-9 bg-indigo-500 ml-1 animate-pulse rounded" aria-hidden />}
      </div>

      <div className="grid grid-cols-4 gap-2" aria-label="Bàn phím số">
        {KEYS.map((k, i) => (
          <React.Fragment key={k}>
            <KeyButton label={k} onClick={() => press(k)} disabled={checked} />
            {i === 2 && <KeyButton label="⌫" aria="Xoá" onClick={() => press('back')} disabled={checked} tone="muted"><Delete size={22} /></KeyButton>}
            {i === 5 && <KeyButton label="−" aria="Dấu trừ" onClick={() => press('-')} disabled={checked} tone="muted" />}
            {i === 8 && <KeyButton label="." aria="Dấu chấm" onClick={() => press('.')} disabled={checked} tone="muted" />}
          </React.Fragment>
        ))}
        <KeyButton label="C" aria="Xoá hết" onClick={() => !checked && onChange('')} disabled={checked} tone="muted" />
      </div>
    </div>
  );
};

const KeyButton: React.FC<{ label: string; aria?: string; onClick: () => void; disabled: boolean; tone?: 'muted'; children?: React.ReactNode }> = ({ label, aria, onClick, disabled, tone, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={aria ?? label}
    className={cn(
      'h-14 rounded-2xl border-2 border-b-4 text-2xl font-black flex items-center justify-center',
      'active:translate-y-[2px] active:border-b-2 disabled:opacity-40 disabled:active:translate-y-0',
      tone === 'muted' ? 'bg-slate-100 border-slate-200 border-b-slate-300 text-slate-600' : 'bg-white border-slate-200 border-b-slate-300 text-slate-800'
    )}
  >
    {children ?? label}
  </button>
);
