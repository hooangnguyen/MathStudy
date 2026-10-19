import React, { useEffect, useState } from 'react';
import { Mascot } from '../../components/mascot/Mascot';
import { useFirebase } from '../../app/FirebaseProvider';
import { audioService } from '../../lib/audio';
import { useLesson } from './lesson/useLesson';
import { KEYPAD_CHARS } from './lesson/lessonLogic';
import { ChoiceGrid } from './lesson/ChoiceGrid';
import { AnswerPad } from './lesson/AnswerPad';
import { BigButton, HintBox, LessonFooter, LessonHeader, QuestionPrompt, QuitDialog } from './lesson/LessonParts';
import { LessonComplete } from './lesson/LessonComplete';

interface LessonViewProps {
  lessonTitle: string;
  topic?: string;
  grade?: number;
  /** Bài đã hoàn thành trước đây: màn kết thúc không hiện điểm thưởng (server không cộng nữa) */
  alreadyCompleted?: boolean;
  onClose: () => void;
  /** `answers`: câu trả lời lần đầu của từng câu (server chấm lại theo ngân hàng câu hỏi). */
  onComplete: (score: number, answers: { questionId: number; answer: string }[]) => void;
}

/**
 * Màn làm bài học kiểu Duolingo: Dino đọc đề, ô đáp án to có phím tắt, bàn phím số cho câu tự điền,
 * bảng nhận xét trượt lên, chuỗi câu đúng liên tiếp, câu sai làm lại cuối bài, màn ăn mừng khi xong.
 */
export const LessonView: React.FC<LessonViewProps> = ({ lessonTitle, topic, grade = 1, alreadyCompleted = false, onClose, onComplete }) => {
  const { userProfile } = useFirebase();
  const lesson = useLesson(topic, grade);
  const { status, current, checked, correct } = lesson;
  const [hintOpen, setHintOpen] = useState(false);
  const [quitting, setQuitting] = useState(false);

  const check = () => {
    const ok = lesson.check();
    if (ok === null) return;
    if (ok) audioService.playCorrect(userProfile?.preferences);
    else audioService.playWrong(userProfile?.preferences);
  };
  const next = () => { setHintOpen(false); lesson.next(); };

  // Phím tắt: 1–4 chọn đáp án, gõ số cho câu tự điền, Enter để kiểm tra / tiếp tục
  useEffect(() => {
    if (status !== 'playing' || !current || quitting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') {
        // Nút đang được focus (vd. "Tiếp tục") tự xử lý Enter
        if ((e.target as HTMLElement)?.tagName === 'BUTTON') return;
        e.preventDefault();
        if (checked) next(); else check();
        return;
      }
      if (checked) return;
      if (current.type === 'multiple-choice') {
        const i = Number(e.key) - 1;
        if (current.options && i >= 0 && i < current.options.length) lesson.setSelected(current.options[i]);
      } else if (e.key === 'Backspace') {
        lesson.setInput(lesson.input.slice(0, -1));
      } else if (KEYPAD_CHARS.test(e.key) && lesson.input.length < 12) {
        lesson.setInput(lesson.input + e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center gap-2">
        <Mascot mood="think" className="w-32 h-32" />
        <p className="text-slate-600 font-bold text-base animate-pulse">Đang tải câu hỏi...</p>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center gap-4">
        <Mascot mood="sleep" className="w-36 h-36" />
        <h2 className="text-xl font-black text-slate-900">Chưa có bộ câu hỏi</h2>
        <p className="text-slate-500 max-w-xs">Dino đang soạn câu hỏi cho <b>{lessonTitle}</b> (Lớp {grade}). Bạn quay lại sau nhé!</p>
        <div className="w-full max-w-xs"><BigButton tone="primary" onClick={onClose}>Quay lại</BigButton></div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <LessonComplete
        lessonTitle={lessonTitle}
        percent={lesson.percent}
        durationMs={lesson.durationMs}
        bestCombo={lesson.bestCombo}
        alreadyCompleted={alreadyCompleted}
        onContinue={() => onComplete(lesson.percent, lesson.answers())}
      />
    );
  }

  if (!current) return null;
  const mood = checked ? (correct ? 'cheer' : 'oops') : hintOpen ? 'think' : 'happy';

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <LessonHeader progress={(lesson.solved / (lesson.total || 1)) * 100} combo={lesson.combo} onQuit={() => setQuitting(true)} />

      <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
        <div className="max-w-xl mx-auto space-y-5 pt-2">
          <QuestionPrompt
            text={current.question}
            label={lesson.isRetry ? 'Làm lại câu sai' : `Câu ${lesson.step + 1} / ${lesson.total}`}
            retry={lesson.isRetry}
            mood={mood}
            reactKey={`${lesson.step}-${mood}`}
          />
          {hintOpen && !checked && <HintBox hint={current.hint} />}
          {current.type === 'multiple-choice' ? (
            <ChoiceGrid
              key={lesson.step}
              options={current.options ?? []}
              selected={lesson.selected}
              checked={checked}
              answer={current.answer}
              onSelect={lesson.setSelected}
            />
          ) : (
            <AnswerPad key={lesson.step} value={lesson.input} onChange={lesson.setInput} checked={checked} correct={correct} />
          )}
        </div>
      </div>

      <div className="max-w-xl w-full mx-auto">
        <LessonFooter
          key={`${lesson.step}-${checked}`}
          checked={checked}
          correct={correct}
          canCheck={lesson.canCheck}
          step={lesson.step}
          combo={lesson.combo}
          answer={current.answer}
          explanation={current.hint}
          hintOpen={hintOpen}
          onHint={() => setHintOpen((v) => !v)}
          onCheck={check}
          onNext={next}
        />
      </div>

      {quitting && <QuitDialog onStay={() => setQuitting(false)} onQuit={onClose} />}
    </div>
  );
};
