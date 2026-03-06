import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface MathSymbolPickerProps {
  onSelect: (symbol: string) => void;
  onClose?: () => void;
}

const SYMBOL_GROUPS = [
  {
    name: 'Cơ bản',
    symbols: ['+', '−', '×', '÷', '±', '=', '≠', '≈', '∓']
  },
  {
    name: 'So sánh',
    symbols: ['<', '>', '≤', '≥', '≪', '≫', '≡', '∝']
  },
  {
    name: 'Đại số & Hình học',
    symbols: ['π', '√', '∛', '∜', '∞', '∠', '⊥', '∥', '△', '○']
  },
  {
    name: 'Số mũ & Phân số',
    symbols: ['²', '³', 'ⁿ', '½', '⅓', '¼', '⅕', '⅙', '⅛']
  },
  {
    name: 'Hy Lạp',
    symbols: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'π', 'ρ', 'σ', 'τ', 'φ', 'ω', 'Δ', 'Ω']
  },
  {
    name: 'Tập hợp & Logic',
    symbols: ['∈', '∉', '⊂', '⊃', '∪', '∩', '∅', '∀', '∃', '∴', '∵']
  }
];

export const MathSymbolPicker: React.FC<MathSymbolPickerProps> = ({ onSelect, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      <div className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]" onClick={onClose} />
      
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 
        w-[calc(100vw-2rem)] max-w-sm md:w-72 max-h-[60vh] md:max-h-96 overflow-y-auto no-scrollbar z-[70]
        fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
        md:absolute md:left-auto md:top-full md:right-0 md:translate-x-0 md:translate-y-0 md:mt-2">
        <div className="flex items-center justify-between mb-4 px-1 sticky top-0 bg-white z-10 py-1">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Kí hiệu toán học</h3>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="space-y-4">
          {SYMBOL_GROUPS.map((group) => (
            <div key={group.name}>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                {group.name}
              </h4>
              <div className="grid grid-cols-5 gap-1">
                {group.symbols.map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => onSelect(symbol)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-bold transition-colors active:scale-90"
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
