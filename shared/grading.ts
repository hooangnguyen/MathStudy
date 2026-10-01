/**
 * Logic chấm điểm dùng chung cho client và server.
 * Server là nơi chấm chính thức; client chỉ dùng để hiển thị.
 */

export interface AnswerKeyItem {
  id: number;
  type: string;
  correctAnswer: any;
  points: number;
}

export interface GradedAnswer {
  questionId: number;
  isCorrect: boolean | null; // null = cần giáo viên chấm tay
}

const normalizeText = (value: unknown) => (value ?? '').toString().trim().toLowerCase();

const sameSet = (a: unknown[], b: unknown[]) =>
  a.length === b.length && a.every((v) => b.includes(v));

/** Câu trả lời có khớp đáp án không (dùng để tính điểm). */
export const matchesAnswer = (type: string, correctAnswer: any, answer: any): boolean => {
  if (answer === undefined || answer === null) return false;
  if (type === 'multiple_choice') return answer === correctAnswer;
  if (type === 'checkbox') {
    const correct = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
    return Array.isArray(answer) && sameSet(correct, answer);
  }
  if (type === 'short_answer') return normalizeText(answer) === normalizeText(correctAnswer);
  return false; // essay: chấm tay
};

/**
 * Chấm bài tập. Điểm thang 10, làm tròn 1 chữ số thập phân.
 * `isCorrect` chỉ tự động với trắc nghiệm/nhiều lựa chọn; câu tự luận/điền đáp án
 * để null cho giáo viên xác nhận (giữ nguyên hành vi cũ của app).
 */
export const gradeAssignment = (key: AnswerKeyItem[], answers: Record<string, any>) => {
  let earned = 0;
  let total = 0;
  const results: GradedAnswer[] = key.map((q) => {
    const points = Number(q.points) || 0;
    total += points;
    const answer = answers[String(q.id)];
    if (matchesAnswer(q.type, q.correctAnswer, answer)) earned += points;
    const autoGraded = q.type === 'multiple_choice' || q.type === 'checkbox';
    return {
      questionId: q.id,
      isCorrect: autoGraded ? matchesAnswer(q.type, q.correctAnswer, answer) : null,
    };
  });
  const score = total > 0 ? Number(((earned / total) * 10).toFixed(1)) : 0;
  return { score, results };
};
