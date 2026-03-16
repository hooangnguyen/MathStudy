export interface AIGeneratedQuestion {
  type: string;
  text: string;
  options: string[];
  correctAnswer: any;
  points: number;
}

export const generateQuestionsWithAI = async (
  topic: string,
  grade: number,
  count: number = 5,
  types: string[] = ['multiple_choice'],
  difficulty: 'Cơ bản' | 'Trung bình' | 'Nâng cao' = 'Trung bình'
): Promise<AIGeneratedQuestion[]> => {
  try {
    const prompt = `Bạn là một chuyên gia soạn đề kiểm tra Toán. Hãy tạo ${count} câu hỏi toán học về chủ đề "${topic}" dành cho học sinh lớp ${grade}.
Mức độ khó: ${difficulty}.
Cơ cấu câu hỏi: các loại ${types.join(', ')}.

YÊU CẦU VỀ ĐỘ KHÓ:
- Cơ bản: Phù hợp với học sinh trung bình tháp, tập trung vào nhận biết và thông hiểu.
- Trung bình: Phù hợp với học sinh khá, bao gồm các bài toán vận dụng thấp.
- Nâng cao: Thử thách học sinh giỏi, tập trung vào vận dụng cao, tư duy logic và giải quyết vấn đề phức tạp.

YÊU CẦU BẮT BUỘC:
1. Phản hồi CHỈ chứa một mảng JSON hợp lệ, không có văn bản giải thích nào khác.
2. Mỗi đối tượng trong mảng phải có cấu trúc:
   {
     "type": "multiple_choice" | "short_answer",
     "text": "Nội dung câu hỏi (sử dụng $...$ cho công thức KaTeX)",
     "options": ["A", "B", "C", "D"], (chỉ cho multiple_choice, cung cấp đủ 4 phương án)
     "correctAnswer": 0 (chỉ số đáp án đúng cho mc, hoặc chuỗi đáp án cho short_answer),
     "points": 10
   }
3. GIAO THỨC ĐỊNH DẠNG TOÀN DIỆN (BẮT BUỘC):
   - TOÀN BỘ nội dung câu hỏi PHẢI nằm trong cặp dấu $ ... $.
   - Các đoạn văn bản Tiếng Việt PHẢI nằm trong lệnh \text{...}.
   - Các công thức, biến số toán học nằm TRỰC TIẾP trong dấu $ nhưng NGOÀI lệnh \text.
   - Ví dụ: "$ \text{Kết quả của } 2x(x^2-1) \text{ là gì?} $"
4. Nội dung bằng tiếng Việt.`;

    const response = await fetch('/api/ai/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        grade,
        count,
        difficulty,
        types
      }),
    });

    const data = await response.json();
    if (data.success) {
      return data.questions as AIGeneratedQuestion[];
    } else {
      throw new Error(data.error || "Failed to generate AI response");
    }
  } catch (error) {
    console.error("Error generating questions with AI:", error);
    throw error;
  }
};
