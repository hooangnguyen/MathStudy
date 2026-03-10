import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import 'mathlive';

interface MathEquationEditorProps {
  value: string;
  onChange?: (latex: string) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
}

export const MathEquationEditor: React.FC<MathEquationEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  className,
  placeholder,
}) => {
  const fieldRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const pendingValueRef = useRef<string>('');
  const MathFieldTag = 'math-field' as any;

  // Configure MathLive for better mobile UX + keep value in sync
  useEffect(() => {
    const mf = fieldRef.current;
    if (!mf) return;

    if (typeof value === 'string' && mf.value !== value) {
      mf.value = value;
    }

    mf.readOnly = readOnly || false;

    // Mobile-friendly configuration
    // Dùng chế độ manual để không hiển thị nút toggle mặc định,
    // keyboard sẽ bật khi focus vào ô nhập.
    mf.mathVirtualKeyboardPolicy = 'auto';
    mf.virtualKeyboardMode = 'onfocus';
    mf.smartFence = true;
    mf.smartMode = true;

    if (placeholder) {
      mf.placeholder = placeholder;
    }
  }, [value, readOnly, placeholder]);

  const handleInput = (event: React.SyntheticEvent<any>) => {
    if (!onChange) return;
    const target = event.currentTarget as any;
    pendingValueRef.current = target.value ?? '';
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      onChange(pendingValueRef.current);
    });
  };

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={clsx(
        // Mobile-first: to, rộng, dễ bấm; thu nhỏ nhẹ trên màn lớn
        'w-full rounded-2xl bg-slate-50 px-4 py-3 text-lg sm:text-base font-bold text-slate-900',
        'border border-slate-200 focus-within:border-indigo-500 focus-within:bg-slate-100 transition-colors',
        'flex items-center',
        className
      )}
    >
      <MathFieldTag
        ref={fieldRef}
        readOnly={readOnly}
        onInput={readOnly ? undefined : handleInput}
        style={{
          width: '100%',
          minHeight: '52px',
          fontSize: '1.1rem',
          outline: 'none',
          border: 'none',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          caretColor: '#4f46e5',
          '--caret-color': '#4f46e5',
          '--selection-background-color': '#e0e7ff',
          '--keyboard-zindex': '2000',
        } as any}
      >
        {value}
      </MathFieldTag>
    </div>
  );
};

