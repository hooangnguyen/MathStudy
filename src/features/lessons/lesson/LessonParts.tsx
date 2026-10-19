import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Flame, Lightbulb, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { MathRenderer } from '../../../content/MathRenderer';
import { Mascot, type MascotMood } from '../../../components/mascot/Mascot';
import { isComboMilestone } from './lessonLogic';

// Lời khen / động viên, đổi theo câu cho đỡ lặp
export const PRAISE = ['Tuyệt vời!', 'Giỏi quá!', 'Chính xác!', 'Đỉnh luôn!', 'Quá đúng!'];
export const ENCOURAGE = ['Chưa đúng, không sao!', 'Cố lên nhé!', 'Lần sau sẽ đúng thôi!', 'Học từ lỗi sai nào!'];

/** Thanh trên cùng: thoát, thanh tiến độ, chuỗi câu đúng liên tiếp. */
export const LessonHeader: React.FC<{ progress: number; combo: number; onQuit: () => void }> = ({ progress, combo, onQuit }) => (
  <div className="px-4 pt-4 pb-2 flex items-center gap-3 shrink-0">
    <button onClick={onQuit} aria-label="Thoát bài học" className="w-10 h-10 -ml-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center">
      <X size={26} />
    </button>
    <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ bài học">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 relative"
        initial={false}
        animate={{ width: `${Math.max(progress, 4)}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        <span className="absolute left-2 right-2 top-1 h-1 rounded-full bg-white/40" />
      </motion.div>
    </div>
    <AnimatePresence>
      {combo >= 2 && (
        <motion.span
          key={combo}
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="flex items-center gap-0.5 text-orange-500 font-black text-lg"
          aria-label={`Chuỗi ${combo} câu đúng`}
        >
          <Flame size={22} className="fill-orange-400" /> {combo}
        </motion.span>
      )}
    </AnimatePresence>
  </div>
);

/** Đề bài do Dino "nói": linh vật + bong bóng thoại, phản ứng theo kết quả. */
export const QuestionPrompt: React.FC<{ text: string; label: string; retry: boolean; mood: MascotMood; reactKey: string }> = ({ text, label, retry, mood, reactKey }) => (
  <div className="space-y-3">
    <span className={cn('inline-block px-3 py-1 rounded-full text-sm font-bold', retry ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-600')}>
      {label}
    </span>
    <div className="flex items-end gap-2">
      <Mascot key={reactKey} mood={mood} className="w-24 h-24 shrink-0 -ml-2" />
      <div className="relative flex-1 min-w-0 mb-4 bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
        <span aria-hidden className="absolute -left-[9px] bottom-5 w-4 h-4 bg-white border-l-2 border-b-2 border-slate-200 rotate-45" />
        <h2 id="lesson-question" className="text-xl font-black text-slate-900 leading-snug break-words">
          <MathRenderer content={text} />
        </h2>
      </div>
    </div>
  </div>
);

export const HintBox: React.FC<{ hint: string }> = ({ hint }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-200 flex gap-2">
    <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={20} />
    <p className="text-[15px] text-amber-800 font-medium leading-snug"><b>Gợi ý:</b> <MathRenderer content={hint} /></p>
  </motion.div>
);

/** Nút chính nổi khối kiểu Duolingo */
export const BigButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone: 'primary' | 'green' | 'red' | 'disabled' }> = ({ tone, className, children, ...rest }) => (
  <button
    {...rest}
    className={cn(
      'w-full h-14 rounded-2xl border-b-[5px] text-lg font-black tracking-wide uppercase transition-colors',
      'active:translate-y-[3px] active:border-b-2 disabled:active:translate-y-0',
      tone === 'primary' && 'bg-indigo-500 border-indigo-700 text-white hover:bg-indigo-600',
      tone === 'green' && 'bg-emerald-500 border-emerald-700 text-white hover:bg-emerald-600',
      tone === 'red' && 'bg-rose-500 border-rose-700 text-white hover:bg-rose-600',
      tone === 'disabled' && 'bg-slate-200 border-slate-300 text-slate-400',
      className
    )}
  >
    {children}
  </button>
);

/** Thanh dưới cùng: trước khi kiểm tra là nút Gợi ý + Kiểm tra; sau đó trượt lên bảng nhận xét. */
export const LessonFooter: React.FC<{
  checked: boolean;
  correct: boolean;
  canCheck: boolean;
  step: number;
  combo: number;
  answer: string;
  explanation: string;
  hintOpen: boolean;
  onHint: () => void;
  onCheck: () => void;
  onNext: () => void;
}> = ({ checked, correct, canCheck, step, combo, answer, explanation, hintOpen, onHint, onCheck, onNext }) => {
  const [why, setWhy] = useState(false);
  if (!checked) {
    return (
      <div className="p-4 border-t-2 border-slate-100 bg-white flex gap-3 shrink-0">
        <button
          type="button"
          onClick={onHint}
          aria-pressed={hintOpen}
          className={cn(
            'h-14 px-4 rounded-2xl border-2 border-b-[5px] font-bold flex items-center gap-1.5 active:translate-y-[3px] active:border-b-2',
            hintOpen ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-500'
          )}
        >
          <Lightbulb size={20} /> <span className="whitespace-nowrap">Gợi ý</span>
        </button>
        <BigButton tone={canCheck ? 'green' : 'disabled'} disabled={!canCheck} onClick={onCheck}>Kiểm tra</BigButton>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ y: 120 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className={cn('p-4 pt-5 space-y-3 shrink-0', correct ? 'bg-emerald-100' : 'bg-rose-100')}
      role="status"
    >
      <div className="flex items-start gap-3">
        <span className={cn('w-11 h-11 shrink-0 rounded-full bg-white flex items-center justify-center', correct ? 'text-emerald-500' : 'text-rose-500')}>
          {correct ? <Check size={28} strokeWidth={3.5} /> : <X size={28} strokeWidth={3.5} />}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className={cn('text-2xl font-black', correct ? 'text-emerald-700' : 'text-rose-700')}>
            {correct ? PRAISE[step % PRAISE.length] : ENCOURAGE[step % ENCOURAGE.length]}
          </h4>
          {correct && isComboMilestone(combo) && (
            <p className="mt-0.5 font-bold text-orange-600 flex items-center gap-1"><Flame size={18} className="fill-orange-400" /> {combo} câu đúng liên tiếp!</p>
          )}
          {!correct && (
            <div className="mt-0.5 text-rose-700 font-semibold">
              Đáp án đúng: <span className="font-black inline-block align-baseline [&_p]:m-0"><MathRenderer content={answer} /></span>
              {explanation && (
                <>
                  <button type="button" onClick={() => setWhy((v) => !v)} className="ml-2 underline font-bold">{why ? 'Ẩn giải thích' : 'Vì sao?'}</button>
                  {why && <p className="mt-1 text-rose-800 font-medium"><MathRenderer content={explanation} /></p>}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <BigButton tone={correct ? 'green' : 'red'} onClick={onNext} autoFocus>Tiếp tục</BigButton>
    </motion.div>
  );
};

/** Hỏi lại trước khi thoát giữa chừng */
export const QuitDialog: React.FC<{ onStay: () => void; onQuit: () => void }> = ({ onStay, onQuit }) => (
  <div className="fixed inset-0 z-[120] bg-slate-900/40 flex items-end sm:items-center justify-center" onClick={onStay}>
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Dừng bài học"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-3 text-center"
    >
      <Mascot mood="oops" className="w-24 h-24 mx-auto" />
      <h3 className="text-xl font-black text-slate-900">Khoan đã, sắp xong rồi mà!</h3>
      <p className="text-slate-600">Nếu thoát bây giờ, kết quả bài này sẽ không được lưu.</p>
      <BigButton tone="primary" onClick={onStay} autoFocus>Học tiếp</BigButton>
      <button onClick={onQuit} className="w-full h-12 font-black text-rose-500 uppercase tracking-wide">Thoát</button>
    </motion.div>
  </div>
);
