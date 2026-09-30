import express from "express";
import compression from "compression";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, requireAdmin, type AuthedRequest } from "./server/http";
import { assignmentsRouter } from "./server/assignments";
import { lessonsRouter } from "./server/lessons";
import { duelsRouter } from "./server/duels";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const app = express();
// Chạy sau reverse proxy (Render/Docker) để req.ip là IP thật của người dùng
app.set("trust proxy", 1);

// Cấu hình PORT cho Render hoặc mặc định 3000 cho Local
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV === "development" || (!process.env.RENDER && process.env.NODE_ENV !== "production");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ảnh chụp bài toán gửi lên dạng base64 nên cần giới hạn lớn hơn mặc định,
// nhưng không để quá rộng để tránh bị gửi payload khổng lồ.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ---------- Rate limiting (in-memory, đủ cho 1 instance) ----------

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

/** Trả về true nếu `key` vẫn còn trong hạn mức `max` lần mỗi `windowMs`. */
function allowRequest(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count++;
  return bucket.count <= max;
}

// Dọn các bucket đã hết hạn để Map không phình mãi
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (now > bucket.resetAt) rateBuckets.delete(key);
  }
}, 10 * 60 * 1000).unref();

function rateLimit(name: string, max: number, windowMs: number, keyOf: (req: Request) => string = (req) => req.ip || "unknown") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowRequest(`${name}:${keyOf(req)}`, max, windowMs)) {
      return res.status(429).json({ success: false, error: "Bạn thao tác quá nhanh, vui lòng thử lại sau." });
    }
    next();
  };
}

// ---------- OTP qua email ----------

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// OTP Store (In-memory for simplicity)
const otpStore = new Map<string, { otp: string; expires: number; attempts: number }>();

// Ưu tiên biến không có tiền tố VITE_ (tiền tố VITE_ có nguy cơ bị nhúng vào bundle phía client)
const GMAIL_USER = process.env.GMAIL_USER || process.env.VITE_GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS || process.env.VITE_GMAIL_PASS;

// Cấu hình Nodemailer tối ưu cho Production
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Sử dụng SSL
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS // Đây phải là App Password 16 ký tự
  }
});

const normalizeEmail = (email: unknown) => (typeof email === "string" ? email.trim().toLowerCase() : "");

// OTP Endpoints
app.post(
  "/api/send-otp",
  rateLimit("otp-ip", 10, 60 * 60 * 1000),
  rateLimit("otp-email", 3, 10 * 60 * 1000, (req) => normalizeEmail(req.body?.email)),
  async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: "Email không hợp lệ" });

    const otp = crypto.randomInt(100000, 1000000).toString();
    otpStore.set(email, { otp, expires: Date.now() + OTP_TTL_MS, attempts: 0 });

    try {
      await transporter.sendMail({
        from: `"Math Study" <${GMAIL_USER}>`, // Dùng chính mail gửi để tránh bị spam filter
        to: email,
        subject: "Mã xác thực đăng ký MathStudy",
        html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Chào mừng bạn đến với Math Study!</h2>
          <p>Mã xác thực OTP của bạn là:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; margin: 20px 0;">${otp}</div>
          <p style="color: #666; font-size: 12px;">Mã này sẽ hết hạn trong 5 phút.</p>
        </div>`
      });
      console.log("OTP email sent");
      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      otpStore.delete(email);
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Could not send OTP email" });
    }
  }
);

app.post("/api/verify-otp", rateLimit("otp-verify-ip", 30, 10 * 60 * 1000), (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = typeof req.body?.otp === "string" ? req.body.otp.trim() : String(req.body?.otp ?? "");
  const stored = otpStore.get(email);

  if (!stored || Date.now() > stored.expires) {
    otpStore.delete(email);
    return res.status(400).json({ error: "Mã OTP không hợp lệ hoặc đã hết hạn" });
  }

  if (stored.otp !== otp) {
    // Khoá mã sau vài lần nhập sai để chống dò mã
    stored.attempts++;
    if (stored.attempts >= OTP_MAX_ATTEMPTS) otpStore.delete(email);
    return res.status(400).json({ error: "Mã OTP không hợp lệ hoặc đã hết hạn" });
  }

  otpStore.delete(email);
  res.json({ success: true });
});

// ---------- AI endpoints: bắt buộc đăng nhập + giới hạn tần suất theo user ----------

app.use(
  "/api/ai",
  requireAuth,
  rateLimit("ai-user", 20, 60 * 1000, (req) => (req as AuthedRequest).uid || req.ip || "unknown")
);

// ---------- Chấm điểm phía server (bài tập, bài học, LP đấu toán) ----------

const perUser = (name: string, max: number) =>
  rateLimit(name, max, 60 * 1000, (req) => (req as AuthedRequest).uid || req.ip || "unknown");

app.use("/api/assignments", requireAuth, requireAdmin, perUser("assignments", 20), assignmentsRouter);
app.use("/api/lessons", requireAuth, requireAdmin, perUser("lessons", 20), lessonsRouter);
app.use("/api/duels", requireAuth, requireAdmin, perUser("duels", 30), duelsRouter);

// Assignment Generation Endpoint
app.post("/api/ai/generate-questions", async (req, res) => {
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
app.post("/api/ai/chat", async (req, res) => {
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

// Cấu hình phục vụ frontend
if (isDev) {
  console.log("Running in DEVELOPMENT mode with Vite middleware");
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  // Sử dụng vite làm middleware
  app.use(vite.middlewares);

  app.get("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      // 1. Đọc index.html
      let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");

      // 2. Áp dụng các chuyển đổi HTML của Vite (bao gồm HMR)
      template = await vite.transformIndexHtml(url, template);

      // 3. Gửi HTML về trình duyệt
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
} else {
  console.log("Running in PRODUCTION mode");
  const distDir = path.join(__dirname, "dist");

  // Nén gzip/brotli cho JS/CSS/HTML (bundle Firebase ~620 kB → ~150 kB)
  app.use(compression());

  // File có hash trong tên (assets/*, workbox-*) không bao giờ đổi nội dung → cache 1 năm.
  // index.html, sw.js, manifest phải luôn được kiểm tra lại để nhận bản deploy mới.
  app.use(
    express.static(distDir, {
      index: false,
      setHeaders(res, filePath) {
        const rel = path.relative(distDir, filePath).split(path.sep).join("/");
        if (rel.startsWith("assets/") || /^workbox-[\w-]+\.js$/.test(rel)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  // File tĩnh không tồn tại (vd. chunk của bản deploy cũ) phải trả 404, không trả index.html:
  // trình duyệt sẽ báo lỗi tải module rõ ràng và client tự tải lại trang (xem main.tsx).
  app.use(["/assets", "/api"], (req, res) => {
    res.status(404).json({ success: false, error: "Not found" });
  });

  app.get("*", (req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(distDir, "index.html"));
  });
}

// Khởi chạy server
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
