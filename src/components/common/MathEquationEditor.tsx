import React, { forwardRef } from 'react';
import { Sigma } from 'lucide-react';
import { cn } from '../../utils/utils';
import { MathField, MathFieldHandle } from './MathField';

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

  return (
    <div
      className={cn(
        'group relative w-full transition-all flex items-start gap-2',
        className
      )}
    >
      <div className="flex-1 w-full min-w-0">
        <MathField
          ref={ref}
          value={value}
          onChange={(val) => onChange?.(val)}
          readOnly={readOnly}
          placeholder={placeholder}
          className="w-full"
        />
      </div>
      
      {onOpenPicker && !readOnly && (
        <button
          type="button"
          onClick={onOpenPicker}
          className={cn(
            "p-1.5 rounded-lg transition-all shrink-0 mt-2",
            value ? "text-indigo-600 bg-indigo-50" : "text-slate-300 hover:text-indigo-500 hover:bg-indigo-50"
          )}
          title="Công thức Toán học"
        >
          <Sigma size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
});

