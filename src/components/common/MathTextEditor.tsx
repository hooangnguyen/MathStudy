import React, { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Sigma } from 'lucide-react';
import { cn } from '../../utils/utils';
import { MathRenderer } from './MathRenderer';
import { findMathSpanAt, insertFormula, insertMath, replaceMathSpan, type MathSpan } from '../../utils/mathText';

const FormulaDialog = lazy(() => import('./FormulaDialog'));

// Nút chèn nhanh; "#" là chỗ con trỏ nhảy vào sau khi chèn
const QUICK: { label: string; title: string; template: string }[] = [
  { label: 'a/b', title: 'Phân số', template: '\\frac{#}{}' },
  { label: 'x²', title: 'Bình phương', template: '^{2}' },
  { label: 'xⁿ', title: 'Lũy thừa', template: '^{#}' },
  { label: '√', title: 'Căn bậc hai', template: '\\sqrt{#}' },
  { label: '×', title: 'Nhân', template: '\\times ' },
  { label: ':', title: 'Chia', template: '\\div ' },
  { label: '≤', title: 'Nhỏ hơn hoặc bằng', template: '\\le ' },
  { label: '≥', title: 'Lớn hơn hoặc bằng', template: '\\ge ' },
  { label: '≠', title: 'Khác', template: '\\ne ' },
  { label: 'π', title: 'Pi', template: '\\pi ' },
  { label: '°', title: 'Độ', template: '^{\\circ}' },
];

interface MathTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Ô đáp án: gọn hơn, chỉ hiện thanh công cụ khi đang soạn */
  compact?: boolean;
  ariaLabel?: string;
}

/**
 * Ô soạn nội dung có công thức toán:
 * - Gõ chữ bình thường, Enter để xuống dòng.
 * - Nút toán chèn công thức dạng $...$ ngay tại con trỏ; nút "Công thức" mở trình soạn trực quan
 *   (đặt con trỏ trong một công thức có sẵn rồi bấm để sửa công thức đó).
 * - Ô "Học sinh sẽ thấy" hiển thị đúng như học sinh nhìn thấy.
 */
export const MathTextEditor: React.FC<MathTextEditorProps> = ({ value, onChange, placeholder, compact = false, ariaLabel }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef({ start: value.length, end: value.length });
  const pendingCursorRef = useRef<number | null>(null);
  const [focused, setFocused] = useState(false);
  const [dialog, setDialog] = useState<{ span: MathSpan | null; start: number; end: number } | null>(null);

  // Tự giãn chiều cao theo nội dung
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  // Đặt lại con trỏ sau khi chèn
  useEffect(() => {
    const el = textareaRef.current;
    const cursor = pendingCursorRef.current;
    if (!el || cursor === null) return;
    pendingCursorRef.current = null;
    el.focus();
    el.setSelectionRange(cursor, cursor);
    selectionRef.current = { start: cursor, end: cursor };
  }, [value]);

  const rememberSelection = () => {
    const el = textareaRef.current;
    if (el) selectionRef.current = { start: el.selectionStart, end: el.selectionEnd };
  };

  const apply = (result: { text: string; cursor: number }) => {
    pendingCursorRef.current = result.cursor;
    onChange(result.text);
  };

  const insertQuick = (template: string) => {
    const { start, end } = selectionRef.current;
    apply(insertMath(value, start, end, template));
  };

  const openDialog = () => {
    const { start, end } = selectionRef.current;
    setDialog({ span: findMathSpanAt(value, start), start, end });
  };

  const showToolbar = !compact || focused;
  const hasPreview = value.includes('$') || value.includes('\n');

  return (
    <div className="w-full space-y-2">
      <div className={cn(
        'rounded-2xl border-2 bg-white transition-colors',
        focused ? 'border-indigo-400 ring-4 ring-indigo-500/10' : 'border-slate-200'
      )}>
        <textarea
          ref={textareaRef}
          value={value}
          aria-label={ariaLabel || placeholder}
          placeholder={placeholder}
          rows={compact ? 1 : 2}
          spellCheck={false}
          onChange={(e) => { onChange(e.target.value); selectionRef.current = { start: e.target.selectionStart, end: e.target.selectionEnd }; }}
          onSelect={rememberSelection}
          onKeyUp={rememberSelection}
          onClick={rememberSelection}
          onFocus={() => setFocused(true)}
          onBlur={() => { rememberSelection(); setFocused(false); }}
          className={cn(
            'block w-full resize-none overflow-hidden bg-transparent px-4 text-slate-800 placeholder:text-slate-400 focus:outline-none leading-relaxed',
            compact ? 'py-2.5 text-base' : 'py-3 text-[17px]'
          )}
        />

        {showToolbar && (
          <div className="flex items-center gap-1 px-2 pb-2 overflow-x-auto no-scrollbar" onMouseDown={(e) => e.preventDefault()}>
            {QUICK.map((q) => (
              <button
                key={q.title}
                type="button"
                title={q.title}
                aria-label={`Chèn ${q.title.toLowerCase()}`}
                onClick={() => insertQuick(q.template)}
                className="h-9 min-w-9 px-2 rounded-lg bg-slate-100 text-slate-700 font-bold text-base hover:bg-indigo-100 hover:text-indigo-700 shrink-0"
              >
                {q.label}
              </button>
            ))}
            <button
              type="button"
              onClick={openDialog}
              className="h-9 px-3 rounded-lg bg-indigo-600 text-white font-bold text-sm flex items-center gap-1.5 shrink-0 ml-1"
            >
              <Sigma size={16} />
              Công thức
            </button>
          </div>
        )}
      </div>

      {hasPreview && (
        <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 px-3 py-2">
          <p className="text-xs font-semibold text-slate-500 mb-1">Học sinh sẽ thấy:</p>
          <div className="text-slate-800 text-base leading-relaxed">
            <MathRenderer content={value} />
          </div>
        </div>
      )}
      {!compact && focused && (
        <p className="text-xs text-slate-400 px-1">Enter để xuống dòng · Bấm nút toán để chèn công thức tại con trỏ</p>
      )}

      {dialog && (
        <Suspense fallback={null}>
          <FormulaDialog
            initialLatex={dialog.span?.latex ?? ''}
            isEditing={!!dialog.span}
            onClose={() => setDialog(null)}
            onConfirm={(latex) => {
              apply(dialog.span ? replaceMathSpan(value, dialog.span, latex) : insertFormula(value, dialog.start, dialog.end, latex));
              setDialog(null);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};
