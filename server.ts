// Nạp .env trước mọi module khác (các module đọc process.env ngay khi được import)
import "dotenv/config";
import express from "express";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { requireAuth, requireAdmin } from "./server/http";
import { perUser } from "./server/rateLimit";
import { otpRouter } from "./server/otp";
import { aiRouter } from "./server/ai";
import { assignmentsRouter } from "./server/assignments";
import { lessonsRouter } from "./server/lessons";
import { duelsRouter } from "./server/duels";

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

// ---------- API ----------

app.use("/api", otpRouter);

// AI: bắt buộc đăng nhập + giới hạn tần suất theo user
app.use("/api/ai", requireAuth, perUser("ai-user", 20), aiRouter);

// Chấm điểm phía server (bài tập, bài học, LP đấu toán)
app.use("/api/assignments", requireAuth, requireAdmin, perUser("assignments", 20), assignmentsRouter);
app.use("/api/lessons", requireAuth, requireAdmin, perUser("lessons", 20), lessonsRouter);
app.use("/api/duels", requireAuth, requireAdmin, perUser("duels", 30), duelsRouter);

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
  // STATIC_DIR: thư mục build khác (dùng cho test e2e)
  const distDir = path.resolve(__dirname, process.env.STATIC_DIR || "dist");

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
