/** Logic thuần của một bài học (không phụ thuộc React), để test được. */

export interface LessonQuestion {
  id: number;
  /** id trong ngân hàng câu hỏi, server dùng để chấm */
  bankId?: number;
  type: 'multiple-choice' | 'input';
  question: string;
  options?: string[];
  answer: string;
  hint: string;
}

/** So đáp án giống server (shared/lesson: isLessonAnswerCorrect): bỏ khoảng trắng hai đầu, không phân biệt hoa thường. */
export const isAnswerCorrect = (q: LessonQuestion, answer: string) =>
  answer.trim().toLowerCase() === q.answer.trim().toLowerCase();

/** Mốc chuỗi câu đúng liên tiếp được khen riêng */
export const COMBO_MILESTONES = [3, 5, 10];
export const isComboMilestone = (combo: number) => COMBO_MILESTONES.includes(combo);

/** Đáp án ngắn (số, phân số ngắn) thì xếp 2 cột cho đỡ phải cuộn. */
export const fitsTwoColumns = (options: string[] = []) =>
  options.length >= 4 && options.every((o) => o.replace(/\$/g, '').trim().length <= 10);

/** Phím bấm trên bàn phím số được phép gõ vào ô trả lời */
export const KEYPAD_CHARS = /^[0-9/\-.,]$/;

export const formatDuration = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Danh hiệu theo độ chính xác ở màn hoàn thành */
export const resultTitle = (percent: number) =>
  percent === 100 ? 'Hoàn hảo!' : percent >= 80 ? 'Xuất sắc!' : percent >= 50 ? 'Làm tốt lắm!' : 'Đã hoàn thành!';
