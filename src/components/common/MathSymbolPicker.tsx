import React from 'react';
import { X } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface MathSymbolPickerProps {
  onSelect: (latex: string) => void;
  onClose?: () => void;
}

const TEMPLATES = [
  { label: 'Phân số', latex: '\\frac{\\placeholder{}}{\\placeholder{}}', display: '\\frac{\\square}{\\square}' },
  { label: 'Số mũ', latex: '^{\\placeholder{}}', display: 'x^{\\square}' },
  { label: 'Chỉ số dưới', latex: '_{\\placeholder{}}', display: 'x_{\\square}' },
  { label: 'Căn bậc 2', latex: '\\sqrt{\\placeholder{}}', display: '\\sqrt{\\square}' },
  { label: 'Căn bậc n', latex: '\\sqrt[\\placeholder{}]{\\placeholder{}}', display: '\\sqrt[n]{\\square}' },
  { label: 'Dấu ngoặc', latex: '\\left( \\placeholder{} \\right)', display: '(\\square)' },
  { label: 'Cung (arc)', latex: '\\overset{\\frown}{\\placeholder{}}', display: '\\overset{\\frown}{ABC}' },
  { label: 'Góc', latex: '\\angle \\placeholder{}', display: '\\angle ABC' },
];

const SYMBOL_GROUPS = [
  {
    name: 'Phép toán',
    symbols: [
      { latex: '+', display: '+' },
      { latex: '-', display: '-' },
      { latex: '\\times', display: '\\times' },
      { latex: '\\div', display: '\\div' },
      { latex: '\\pm', display: '\\pm' },
      { latex: '=', display: '=' },
      { latex: '\\neq', display: '\\neq' },
      { latex: '\\approx', display: '\\approx' },
    ]
  },
  {
    name: 'So sánh',
    symbols: [
      { latex: '<', display: '<' },
      { latex: '>', display: '>' },
      { latex: '\\le', display: '\\le' },
      { latex: '\\ge', display: '\\ge' },
      { latex: '\\ll', display: '\\ll' },
      { latex: '\\gg', display: '\\gg' },
    ]
  },
  {
    name: 'Kí hiệu phổ biến',
    symbols: [
      { latex: '\\pi', display: '\\pi' },
      { latex: '\\infty', display: '\\infty' },
      { latex: '\\theta', display: '\\theta' },
      { latex: '\\Delta', display: '\\Delta' },
      { latex: '\\alpha', display: '\\alpha' },
      { latex: '\\beta', display: '\\beta' },
      { latex: '\\gamma', display: '\\gamma' },
      { latex: '\\sigma', display: '\\sigma' },
    ]
  },
  {
    name: 'Hình học - Góc & Cung',
    symbols: [
      { latex: '\\angle ABC', display: '\\angle ABC' },
      { latex: '\\overset{\\frown}{ABC}', display: '\\overset{\\frown}{AB}' },
      { latex: '\\widehat{ABC}', display: '\\widehat{ABC}' },
      { latex: '\\measuredangle ABC', display: '\\measuredangle' },
      { latex: '\\triangle ABC', display: '\\triangle' },
      { latex: '\\cong ', display: '\\cong' },
      { latex: '\\parallel ', display: '\\parallel' },
      { latex: '\\perp ', display: '\\perp' },
    ]
  }
];

export const MathSymbolPicker: React.FC<MathSymbolPickerProps> = ({ onSelect, onClose }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-full max-w-[22rem] max-h-[320px] overflow-y-auto z-[100] flex flex-col gap-4 custom-scrollbar">
      <div className="flex items-center justify-between sticky top-0 bg-white z-10 py-1">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <div className="w-2 h-6 bg-indigo-500 rounded-full" />
          Bảng kí hiệu Toán học
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Templates Section (Important ones) */}
        <div>
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
            Mẫu công thức & Hình học
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                onClick={() => onSelect(tpl.latex)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-slate-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
              >
                <div className="h-8 flex items-center justify-center mb-1 scale-110 group-hover:scale-125 transition-transform">
                  <MathRenderer content={tpl.display} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500">{tpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Other Symbols */}
        {SYMBOL_GROUPS.map((group) => (
          <div key={group.name} className="space-y-3">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
              {group.name}
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {group.symbols.map((symbol, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelect(symbol.latex)}
                  className="h-12 flex items-center justify-center rounded-2xl border-2 border-slate-50 hover:border-indigo-200 hover:bg-indigo-50 text-lg transition-all active:scale-90"
                >
                  <MathRenderer content={symbol.display} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-1 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-[10px] text-indigo-600 font-medium text-center">
        Nhấp dấu <strong>Σ</strong> bên cạnh ô nhập để chèn góc, cung, phân số...
      </div>
    </div>
  );
};
