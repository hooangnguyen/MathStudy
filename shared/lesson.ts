/** Chấm bài học (luyện tập theo chủ đề) từ ngân hàng câu hỏi, dùng chung client/server. */

export const LESSONS_PER_TOPIC = 10;
export const QUESTIONS_PER_LESSON = 10;

export interface BankQuestion {
  id: number;
  grade: number | string;
  topic: string;
  text?: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;
  answer?: string;
}

/** Danh sách chủ đề theo đúng thứ tự Dashboard hiển thị (mỗi chủ đề 10 bài). */
export const getLessonTopics = (bank: BankQuestion[], grade: number): string[] =>
  [...new Set(bank.filter((q) => Number(q.grade) === Number(grade)).map((q) => q.topic))];

/** Bài học `lessonId` thuộc chủ đề nào (lessonId = chỉ số chủ đề * 10 + thứ tự bài). */
export const topicForLesson = (topics: string[], lessonId: number): string | undefined =>
  topics[Math.floor((lessonId - 1) / LESSONS_PER_TOPIC)];

/** Đáp án đúng dạng chuỗi của một câu trong ngân hàng. */
export const bankCorrectAnswer = (q: BankQuestion): string =>
  q.options && q.options.length > 0 && q.correctAnswer !== undefined
    ? q.options[q.correctAnswer] ?? ''
    : q.answer ?? '';

export const isLessonAnswerCorrect = (q: BankQuestion, answer: unknown): boolean =>
  typeof answer === 'string' &&
  answer.trim().toLowerCase() === bankCorrectAnswer(q).trim().toLowerCase();

/** Điểm bài học (0–100) → điểm tích luỹ cộng cho người dùng. */
export const lessonPoints = (percent: number) => percent * 10;
