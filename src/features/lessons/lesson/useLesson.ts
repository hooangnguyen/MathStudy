import { useCallback, useEffect, useRef, useState } from 'react';
import { loadQuestionBank } from '../questionBank';
import { isAnswerCorrect, type LessonQuestion } from './lessonLogic';

const DEMO_QUESTIONS: LessonQuestion[] = [
  {
    id: 1,
    type: 'multiple-choice',
    question: 'Để cộng hai phân số khác mẫu số, bước đầu tiên chúng ta cần làm là gì?',
    options: ['Cộng tử số với tử số', 'Quy đồng mẫu số hai phân số', 'Cộng mẫu số với mẫu số', 'Nhân hai phân số với nhau'],
    answer: 'Quy đồng mẫu số hai phân số',
    hint: 'Chúng ta cần đưa chúng về cùng một "mẫu" chung trước khi cộng.',
  },
  {
    id: 2,
    type: 'input',
    question: 'Tính kết quả của phép tính: 1/2 + 1/4 = ? (Viết dưới dạng phân số a/b)',
    answer: '3/4',
    hint: 'Quy đồng 1/2 thành 2/4, sau đó cộng với 1/4.',
  },
];

const loadQuestions = async (topic: string | undefined, grade: number): Promise<LessonQuestion[]> => {
  if (!topic) return DEMO_QUESTIONS;
  const bank = await loadQuestionBank(grade);
  const topicQuestions = bank.filter((q) => q.topic === topic);
  return [...topicQuestions]
    .sort(() => 0.5 - Math.random())
    .slice(0, 10)
    .map((q, index) => ({
      id: index + 1,
      bankId: q.id as number,
      type: q.options && q.options.length > 0 ? 'multiple-choice' : 'input',
      question: q.text || q.question || '',
      options: q.options,
      answer: q.correctAnswer !== undefined ? q.options[q.correctAnswer] : q.answer ?? '',
      hint: q.explanation || 'Hãy suy nghĩ kỹ nhé!',
    }));
};

export type LessonStatus = 'loading' | 'empty' | 'playing' | 'done';

/**
 * Trạng thái một bài học: 10 câu, câu sai được đưa xuống cuối để làm lại (không tính điểm),
 * đếm chuỗi câu đúng liên tiếp, ghi câu trả lời lần đầu để server chấm.
 */
export const useLesson = (topic: string | undefined, grade: number) => {
  const [status, setStatus] = useState<LessonStatus>('loading');
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [queue, setQueue] = useState<LessonQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [solved, setSolved] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const firstAnswers = useRef(new Map<number, string>());

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    loadQuestions(topic, grade)
      .then((list) => {
        if (cancelled) return;
        setQuestions(list);
        setQueue(list);
        setStartedAt(Date.now());
        setStatus(list.length ? 'playing' : 'empty');
      })
      .catch((error) => {
        console.error('Không tải được câu hỏi:', error);
        if (!cancelled) setStatus('empty');
      });
    return () => { cancelled = true; };
  }, [topic, grade]);

  const current = queue[step] as LessonQuestion | undefined;
  const isRetry = step >= questions.length;
  const answer = current?.type === 'multiple-choice' ? selected ?? '' : input;
  const canCheck = !checked && answer.trim().length > 0;

  const check = useCallback(() => {
    if (!current || !canCheck) return null;
    if (!isRetry && current.bankId !== undefined && !firstAnswers.current.has(current.bankId)) {
      firstAnswers.current.set(current.bankId, answer);
    }
    const ok = isAnswerCorrect(current, answer);
    setChecked(true);
    setCorrect(ok);
    if (ok) {
      if (!isRetry) setFirstTryCorrect((n) => n + 1);
      setSolved((n) => n + 1);
      setCombo((c) => {
        const next = c + 1;
        setBestCombo((b) => Math.max(b, next));
        return next;
      });
    } else {
      setCombo(0);
    }
    return ok;
  }, [current, canCheck, isRetry, answer]);

  const next = useCallback(() => {
    if (!current || !checked) return;
    // Câu sai được đưa xuống cuối để làm lại
    const nextQueue = correct ? queue : [...queue, current];
    if (!correct) setQueue(nextQueue);
    if (step < nextQueue.length - 1) {
      setStep(step + 1);
      setSelected(null);
      setInput('');
      setChecked(false);
      setCorrect(false);
    } else {
      setFinishedAt(Date.now());
      setStatus('done');
    }
  }, [current, checked, correct, queue, step]);

  const percent = Math.round((firstTryCorrect / (questions.length || 1)) * 100);
  const answers = () => [...firstAnswers.current].map(([questionId, a]) => ({ questionId, answer: a }));

  return {
    status, questions, current, step, isRetry, total: questions.length,
    selected, setSelected: (v: string) => !checked && setSelected(v),
    input, setInput: (v: string) => !checked && setInput(v),
    checked, correct, canCheck, check, next,
    combo, bestCombo, solved, percent, answers,
    durationMs: (finishedAt ?? Date.now()) - startedAt,
  };
};

export type LessonController = ReturnType<typeof useLesson>;
