import { describe, it, expect } from 'vitest';
import { isAnswerCorrect, fitsTwoColumns, formatDuration, resultTitle, isComboMilestone, KEYPAD_CHARS } from '../src/features/lessons/lesson/lessonLogic';
import { isLessonAnswerCorrect } from '../shared/lesson';

const q = (answer: string) => ({ id: 1, type: 'input' as const, question: '', answer, hint: '' });

describe('bài học', () => {
  it('chấm đáp án giống hệt server', () => {
    for (const [answer, given] of [['3/4', ' 3/4 '], ['Quy đồng', 'quy đồng'], ['42', '24'], ['0,5', '0.5']]) {
      expect(isAnswerCorrect(q(answer), given)).toBe(isLessonAnswerCorrect({ id: 1, grade: 1, topic: '', answer }, given));
    }
  });
  it('đáp án ngắn xếp 2 cột, đáp án dài 1 cột', () => {
    expect(fitsTwoColumns(['12', '15', '18', '21'])).toBe(true);
    expect(fitsTwoColumns(['Quy đồng mẫu số hai phân số', 'a', 'b', 'c'])).toBe(false);
    expect(fitsTwoColumns(['1', '2'])).toBe(false);
  });
  it('định dạng thời gian, danh hiệu, mốc chuỗi', () => {
    expect(formatDuration(65_400)).toBe('1:05');
    expect(resultTitle(100)).toBe('Hoàn hảo!');
    expect(resultTitle(30)).toBe('Đã hoàn thành!');
    expect([1, 3, 4, 5, 10].map(isComboMilestone)).toEqual([false, true, false, true, true]);
  });
  it('bàn phím số chỉ nhận chữ số và dấu dùng trong toán', () => {
    expect(['7', '/', '-', ',', '.'].every((k) => KEYPAD_CHARS.test(k))).toBe(true);
    expect(['a', 'Enter', '+'].some((k) => KEYPAD_CHARS.test(k))).toBe(false);
  });
});
