import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/** API AI: soạn câu hỏi cho giáo viên và gia sư giải bài (mount tại /api/ai, sau requireAuth). */
export const aiRouter = Router();

// Assignment Generation Endpoint
aiRouter.post("/generate-questions", async (req, res) => {
  try {
    const { topic, grade, difficulty } = req.body;
    const count = Math.min(Math.max(parseInt(req.body.count, 10) || 5, 1), 30);

    if (typeof topic !== "string" || !topic.trim() || topic.length > 200) {
      return res.status(400).json({ success: false, error: "Chủ đề không hợp lệ" });
    }

    const systemPrompt = `Bạn là một chuyên gia soạn đề kiểm tra Toán cho học sinh từ Lớp 1 đến Lớp 9.
Hãy tạo ${count} câu hỏi về chủ đề "${topic}" dành cho Lớp ${grade} với độ khó "${difficulty}".

YÊU CẦU VỀ ĐỘ KHÓ:
- Cơ bản: Tập trung nhận biết, thông hiểu, số liệu đơn giản.
- Trung bình: Vận dụng thấp, đòi hỏi tính toán cẩn thận.
- Nâng cao: Vận dụng cao, tư duy logic, giải quyết vấn đề.

YÊU CẦU ĐỊNH DẠNG DỮ LIỆU JSON BẮT BUỘC:
1. Trả về DUY NHẤT một mảng JSON. Không kèm markdown block (\`\`\`json) hay lời giải thích.
2. Cấu trúc mỗi câu hỏi:
   {
     "type": "multiple_choice" | "short_answer",
     "text": "Nội dung câu hỏi...",
     "options": ["A", "B", "C", "D"],
     "correctAnswer": 0,
     "points": 10
   }
3. QUY TẮC VIẾT TOÁN HỌC VÀ CHỮ TIẾNG VIỆT (TUYỆT ĐỐI TUÂN THỦ):
   - TOÀN BỘ nội dung text của câu hỏi và đáp án phải bọc trong MỘT cặp dấu $ duy nhất ở đầu và cuối chuỗi.
   - BẤT KỲ đoạn nào là CHỮ TIẾNG VIỆT, BẮT BUỘC phải bọc trong lệnh \\\\text{...}. 
   - CHÚ Ý: Phải sử dụng 2 dấu gạch chéo ngược (\\\\text) để mã JSON hợp lệ.
   - CÁC CÔNG THỨC TOÁN học không được bọc trong \\\\text{}, chỉ để xen kẽ giữa các đoạn \\\\text{}.
   - Phải tự động thêm khoảng trắng (dấu cách) ở cuối hoặc đầu đoạn chữ bên trong \\\\text{...} để chữ không dính vào công thức.
   
   CÁC VÍ DỤ MẪU BẮT BUỘC LÀM THEO:
   - VÍ DỤ CHUẨN 1: "$ \\\\text{Kết quả của phép nhân } 2x(x^2 - 3x + 1) \\\\text{ là gì?} $"
   - VÍ DỤ CHUẨN 2: "$ \\\\text{Cho phương trình } x^2 - 4 = 0 \\\\text{. Nghiệm dương của phương trình là:} $"
   - VÍ DỤ SAI (không dùng \\\\text): "$ Kết quả của phép nhân 2x(x^2 - 3x + 1) là gì? $"
   - VÍ DỤ SAI (không bọc $ ở hai đầu): "Kết quả của phép nhân $2x(x^2 - 3x + 1)$ là gì?"

4. Ngôn ngữ: Tiếng Việt.`;

    // ... phần gọi API AI của bạn ...
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: "Hãy soạn đề ngay bây giờ theo yêu cầu trên." }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json' // Force JSON mode for better reliability
      }
    });

    // Handle potential raw JSON or markdown-wrapped JSON
    let text = response.text || "[]";
    text = text.replace(/```json\n?|\n?```/g, "").trim();

    res.json({ success: true, questions: JSON.parse(text) });

  } catch (error: any) {
    console.error("Error generating assignment:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate questions" });
  }
});

// AI Chat Endpoint
aiRouter.post("/chat", async (req, res) => {
  try {
    const { message, image, grade } = req.body;

    if (message !== undefined && (typeof message !== "string" || message.length > 4000)) {
      return res.status(400).json({ success: false, error: "Tin nhắn quá dài" });
    }

    // Create system prompt based on grade
    const systemPrompt = `Bạn là một gia sư Toán thông minh tại ứng dụng MathStudy. 
Học sinh hiện tại là học sinh lớp ${grade || 'chưa xác định'}. Hãy giải bài toán bằng phương pháp phù hợp với chương trình lớp này.
Yêu cầu bắt buộc: 
- Giải bài tập từng bước một (Step-by-step) một cách rõ ràng và dễ hiểu.
- TẤT CẢ các đoạn mã toán học, công thức, số học phải được bọc trong dấu $...$ (cho công thức inline) hoặc $$...$$ (cho công thức block) để MathRenderer có thể hiển thị bằng KaTeX.
- Không sử dụng ký hiệu toán học nào ngoài việc bọc trong KaTeX. Viết lời giải bằng tiếng Việt.`;

    const contents: any[] = [
      { role: 'user', parts: [] }
    ];

    if (image) {
      // Expect base64 image data like "data:image/jpeg;base64,/9j/4AAQ..."
      const match = image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        contents[0].parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }
    }

    if (message) {
      contents[0].parts.push({ text: message });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.json({ success: true, text: response.text });

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate AI response" });
  }
});
