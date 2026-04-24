import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { Sigma } from 'lucide-react';
import { cn } from '../../utils/utils';
import { MathRenderer } from './MathRenderer';

export interface MathFieldHandle {
    focus: () => void;
    setValue: (value: string) => void;
    insert: (latex: string) => void;
}

interface MathEquationEditorProps {
  value: string;
  onChange?: (latex: string) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
  onOpenPicker?: () => void;
}

export const MathEquationEditor = forwardRef<MathFieldHandle, MathEquationEditorProps>(({
  value,
  onChange,
  readOnly = false,
  className,
  placeholder,
  onOpenPicker,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const selectionRef = useRef({ start: 0, end: 0 });
  const blurTimeoutRef = useRef<NodeJS.Timeout>();

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      setIsFocused(true);
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    setValue: (val: string) => {
      if (onChange) onChange(val);
    },
    insert: (latex: string) => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      const textarea = textareaRef.current;
      if (textarea) {
        const start = isFocused ? textarea.selectionStart : selectionRef.current.start;
        const end = isFocused ? textarea.selectionEnd : selectionRef.current.end;
        const newVal = value.substring(0, start) + latex + value.substring(end);
        
        if (onChange) {
          onChange(newVal);
          setIsFocused(true);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + latex.length, start + latex.length);
          }, 0);
        }
      }
    }
  }));

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) onChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    selectionRef.current = {
      start: e.target.selectionStart,
      end: e.target.selectionEnd
    };
    
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
    }, 150);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, isFocused]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className={cn(
        'group relative w-full transition-all flex items-start gap-2',
        className
      )}
    >
      <div className="flex-1 w-full min-w-0 relative">
        {!isFocused && (
          <div 
            className="w-full min-h-[60px] rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-slate-800 text-[1.125rem] leading-relaxed transition-all cursor-text overflow-hidden hover:border-indigo-200 hover:bg-slate-50"
            onClick={() => {
              if (!readOnly) {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                setIsFocused(true);
                setTimeout(() => textareaRef.current?.focus(), 0);
              }
            }}
          >
            {value ? <MathRenderer content={value} /> : <span className="text-slate-300">{placeholder}</span>}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onBlur={handleBlur}
          readOnly={readOnly}
          placeholder={placeholder}
          rows={1}
          spellCheck={false}
          className={cn(
            "w-full min-h-[60px] resize-none overflow-hidden rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-slate-800 text-[1.125rem] leading-relaxed focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all font-medium whitespace-pre-wrap",
            !isFocused && "hidden"
          )}
        />
      </div>
      
      {onOpenPicker && !readOnly && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onOpenPicker}
          className={cn(
            "p-2.5 rounded-[0.85rem] transition-all shrink-0 mt-1 shadow-sm border",
            value ? "text-indigo-600 bg-indigo-50 border-indigo-100" : "text-slate-400 bg-white hover:text-indigo-500 hover:bg-slate-50 border-slate-200"
          )}
          title="Chèn công thức Toán học"
        >
          <Sigma size={20} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
});

