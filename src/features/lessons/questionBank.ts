/** Một câu hỏi trong ngân hàng câu hỏi (src/data/questions/gradeN.json). */
export interface BankQuestion {
  id?: string | number;
  grade: number;
  topic: string;
  sub_topic: string;
  difficulty: string;
  text: string;
  question?: string;
  options: string[];
  correctAnswer: number;
  answer?: string;
  explanation?: string;
}

/**
 * Nơi duy nhất ở client nạp ngân hàng câu hỏi. Mỗi lớp là một chunk riêng, chỉ tải khi cần.
 * Khi thêm môn học khác, chỉ cần mở rộng hàm này (vd. thêm tham số môn) thay vì sửa từng màn hình.
 */
export const loadQuestionBank = async (grade: number): Promise<BankQuestion[]> => {
  const module = await import(`../../data/questions/grade${grade}.json`);
  return module.default as BankQuestion[];
};
