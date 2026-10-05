import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { MathfieldElement } from 'mathlive';

interface FormulaDialogProps {
  /** Công thức có sẵn (khi sửa), rỗng khi tạo mới */
  initialLatex: string;
  isEditing: boolean;
  onConfirm: (latex: string) => void;
  onClose: () => void;
}

// Mẫu chèn nhanh; \placeholder{} là ô trống MathLive tự nhảy vào để gõ
const TEMPLATES: { label: string; latex: string; preview: string }[] = [
  { label: 'Phân số', latex: '\\frac{\\placeholder{}}{\\placeholder{}}', preview: 'a/b' },
  { label: 'Hỗn số', latex: '\\placeholder{}\\frac{\\placeholder{}}{\\placeholder{}}', preview: 'a b/c' },
  { label: 'Lũy thừa', latex: '\\placeholder{}^{\\placeholder{}}', preview: 'xⁿ' },
  { label: 'Căn bậc hai', latex: '\\sqrt{\\placeholder{}}', preview: '√' },
  { label: 'Căn bậc n', latex: '\\sqrt[\\placeholder{}]{\\placeholder{}}', preview: 'ⁿ√' },
  { label: 'Ngoặc', latex: '\\left(\\placeholder{}\\right)', preview: '( )' },
  { label: 'Độ', latex: '^{\\circ}', preview: '°' },
  { label: 'Góc', latex: '\\widehat{\\placeholder{}}', preview: '∠' },
  { label: 'Tam giác', latex: '\\triangle ', preview: '△' },
  { label: 'Song song', latex: '\\parallel ', preview: '∥' },
  { label: 'Vuông góc', latex: '\\perp ', preview: '⊥' },
  { label: 'Pi', latex: '\\pi ', preview: 'π' },
];

/**
 * MathLive viết gọn "\\frac13", "\\sqrt2"; đổi về dạng có ngoặc "\\frac{1}{3}" cho giáo viên dễ đọc và sửa.
 */
export const normalizeLatex = (latex: string) =>
  latex
    .replace(/\\placeholder\{\}/g, '')
    .replace(/\\frac(\d)(\d)/g, '\\frac{$1}{$2}')
    .replace(/\\frac(\d)\{/g, '\\frac{$1}{')
    .replace(/\\frac\{([^{}]*)\}(\d)/g, '\\frac{$1}{$2}')
    .replace(/\\sqrt(\d)/g, '\\sqrt{$1}')
    .trim();

/**
 * Trình soạn công thức trực quan (MathLive): gõ như trên giấy, có bàn phím toán trên điện thoại.
 * Tải MathLive khi mở hộp thoại để không làm nặng trang.
 */
export default function FormulaDialog({ initialLatex, isEditing, onConfirm, onClose }: FormulaDialogProps) {
  const fieldRef = useRef<MathfieldElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('mathlive').then(({ MathfieldElement }) => {
      // Font KaTeX đã có sẵn trong app (katex.min.css) nên không cần MathLive tải thêm font/âm thanh
      MathfieldElement.fontsDirectory = null;
      MathfieldElement.soundsDirectory = null;
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const mf = fieldRef.current;
    if (!ready || !mf) return;
    mf.value = initialLatex;
    mf.smartFence = true;
    setTimeout(() => mf.focus(), 50);
  }, [ready]);

  const confirm = () => {
    const latex = normalizeLatex(fieldRef.current?.getValue('latex') ?? '');
    if (latex) onConfirm(latex);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Soạn công thức">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">{isEditing ? 'Sửa công thức' : 'Chèn công thức'}</h3>
          <button onClick={onClose} aria-label="Đóng" className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 px-3 py-2 min-h-[64px] flex items-center">
          {ready ? (
            <math-field
              ref={fieldRef as any}
              style={{ width: '100%', fontSize: '1.6rem', background: 'transparent', border: 'none', outline: 'none' }}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); confirm(); } }}
            />
          ) : (
            <span className="text-slate-400 font-semibold">Đang mở trình soạn công thức…</span>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Gõ trực tiếp, ví dụ <b>1/2</b> thành phân số, <b>x^2</b> thành lũy thừa, hoặc chọn mẫu bên dưới.
        </p>

        <div className="grid grid-cols-4 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              disabled={!ready}
              onClick={() => { fieldRef.current?.insert(t.latex, { focus: true, selectionMode: 'placeholder' }); }}
              className="rounded-xl border border-slate-200 bg-white py-2 px-1 text-center hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
            >
              <span className="block text-lg font-bold text-slate-800 leading-tight">{t.preview}</span>
              <span className="block text-[11px] font-semibold text-slate-500">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 font-bold">Huỷ</button>
          <button onClick={confirm} disabled={!ready} className="flex-[2] h-12 rounded-2xl bg-indigo-600 text-white font-black disabled:opacity-50">
            {isEditing ? 'Cập nhật công thức' : 'Chèn vào câu hỏi'}
          </button>
        </div>
      </div>
    </div>
  );
}
