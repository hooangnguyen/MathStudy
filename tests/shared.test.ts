import { describe, it, expect } from 'vitest';
import { gradeAssignment, matchesAnswer } from '../shared/grading';
import { calculateLPChange, getRankTier } from '../shared/rank';
import { clampDuelScore, decideDuelOutcome } from '../shared/duel';
import { getLessonTopics, topicForLesson, isLessonAnswerCorrect } from '../shared/lesson';

describe('gradeAssignment', () => {
  const key = [
    { id: 1, type: 'multiple_choice', correctAnswer: 2, points: 10 },
    { id: 2, type: 'checkbox', correctAnswer: [0, 3], points: 10 },
    { id: 3, type: 'short_answer', correctAnswer: 'Hà Nội', points: 10 },
    { id: 4, type: 'essay', correctAnswer: null, points: 10 },
  ];

  it('chấm đủ các loại câu, tự luận để giáo viên chấm', () => {
    const { score, results } = gradeAssignment(key, { 1: 2, 2: [3, 0], 3: '  hà nội ' });
    expect(score).toBe(7.5);
    expect(results.map(r => r.isCorrect)).toEqual([true, true, null, null]);
  });

  it('checkbox phải chọn đúng và đủ', () => {
    expect(matchesAnswer('checkbox', [0, 3], [0])).toBe(false);
    expect(matchesAnswer('checkbox', [0, 3], [0, 3, 1])).toBe(false);
  });

  it('bài trống được 0 điểm', () => {
    expect(gradeAssignment(key, {}).score).toBe(0);
  });
});

describe('rank', () => {
  it('bậc hạng theo LP', () => {
    expect(getRankTier(0)).toBe('bronze');
    expect(getRankTier(250)).toBe('gold');
    expect(getRankTier(1000)).toBe('challenger');
  });

  it('thắng người hạng cao hơn được thưởng thêm, giới hạn 5–35', () => {
    expect(calculateLPChange(0, 0, false)).toBe(20);
    expect(calculateLPChange(0, 500, false)).toBe(35);
    expect(calculateLPChange(500, 0, false)).toBe(10);
    expect(calculateLPChange(0, 0, true)).toBe(5);
  });
});

describe('duel', () => {
  it('giới hạn điểm theo số câu đã làm và thời gian', () => {
    expect(clampDuelScore(1000, 2, 300)).toBe(20);
    expect(clampDuelScore(100, 50, 3)).toBe(30);
    expect(clampDuelScore(-5, 3, 300)).toBe(0);
  });

  it('đầu hàng luôn thua, bằng điểm là hòa', () => {
    expect(decideDuelOutcome('a', 'b', 100, 0, 'a')).toEqual({ winnerId: 'b', isDraw: false });
    expect(decideDuelOutcome('a', 'b', 30, 30)).toEqual({ winnerId: null, isDraw: true });
    expect(decideDuelOutcome('a', 'b', 10, 30)).toEqual({ winnerId: 'b', isDraw: false });
  });
});

describe('lesson', () => {
  const bank = [
    { id: 1, grade: 5, topic: 'Phân số', options: ['1/2', '2/3'], correctAnswer: 0 },
    { id: 2, grade: 5, topic: 'Hình học', options: ['a'], correctAnswer: 0 },
    { id: 3, grade: 4, topic: 'Ôn tập', options: ['a'], correctAnswer: 0 },
  ];

  it('chủ đề theo thứ tự Dashboard, mỗi chủ đề 10 bài', () => {
    const topics = getLessonTopics(bank, 5);
    expect(topics).toEqual(['Phân số', 'Hình học']);
    expect(topicForLesson(topics, 10)).toBe('Phân số');
    expect(topicForLesson(topics, 11)).toBe('Hình học');
  });

  it('so đáp án theo nội dung lựa chọn', () => {
    expect(isLessonAnswerCorrect(bank[0], '1/2')).toBe(true);
    expect(isLessonAnswerCorrect(bank[0], '2/3')).toBe(false);
  });
});
