import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Cấu hình PORT cho Render hoặc mặc định 3000 cho Local
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV === "development" || (!process.env.RENDER && process.env.NODE_ENV !== "production");

const io = new Server(server, {
  cors: {
    origin: "*", // Khi có domain chính thức, bạn nên thay "*" bằng URL của Render
    methods: ["GET", "POST"],
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// OTP Store (In-memory for simplicity)
const otpStore = new Map<string, { otp: string, expires: number }>();

// Cấu hình Nodemailer tối ưu cho Production
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Sử dụng SSL
  auth: {
    user: process.env.VITE_GMAIL_USER,
    pass: process.env.VITE_GMAIL_PASS // Đây phải là App Password 16 ký tự
  }
});

// In-memory state for demo
let waitingPlayer: { id: string; name: string } | null = null;
const activeDuels = new Map();
const leaderboard = [
  { name: "Lê Hoàng", wins: 45 },
  { name: "Trần Thảo", wins: 38 },
  { name: "Phạm Hùng", wins: 32 },
];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_queue", (data) => {
    const playerName = data.name || "Người chơi ẩn danh";

    if (waitingPlayer && waitingPlayer.id !== socket.id) {
      // Match found!
      const duelId = `duel_${Date.now()}`;
      const opponent = waitingPlayer;
      waitingPlayer = null;

      const problems = generateProblems(10);

      socket.join(duelId);
      io.to(opponent.id).emit("match_found", {
        duelId,
        opponent: { name: playerName },
        problems
      });

      socket.emit("match_found", {
        duelId,
        opponent: { name: opponent.name },
        problems
      });

      activeDuels.set(duelId, {
        players: [
          { id: socket.id, name: playerName, score: 0, finished: false },
          { id: opponent.id, name: opponent.name, score: 0, finished: false }
        ]
      });
    } else {
      waitingPlayer = { id: socket.id, name: playerName };
      socket.emit("waiting_for_opponent");
    }
  });

  socket.on("submit_answer", (data) => {
    const { duelId, score, finished } = data;
    const duel = activeDuels.get(duelId);

    if (duel) {
      const player = duel.players.find((p: any) => p.id === socket.id);
      if (player) {
        player.score = score;
        player.finished = finished;

        // Broadcast update to the other player
        socket.to(duelId).emit("opponent_update", { score, finished });

        if (duel.players.every((p: any) => p.finished)) {
          const winner = duel.players.reduce((prev: any, current: any) =>
            (prev.score > current.score) ? prev : current
          );
          io.to(duelId).emit("duel_end", { winner: winner.name });
          activeDuels.delete(duelId);
        }
      }
    }
  });

  socket.on("disconnect", () => {
    if (waitingPlayer?.id === socket.id) {
      waitingPlayer = null;
    }
  });
});

function generateProblems(count: number) {
  const problems = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const op = ["+", "-", "*"][Math.floor(Math.random() * 3)];
    let question = `${a} ${op} ${b}`;
    let answer = 0;
    if (op === "+") answer = a + b;
    if (op === "-") answer = a - b;
    if (op === "*") answer = a * b;
    problems.push({ question, answer });
  }
  return problems;
}

// OTP Endpoints
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000;

  otpStore.set(email, { otp, expires });

  try {
    await transporter.sendMail({
      from: `"MathStudy" <${process.env.VITE_GMAIL_USER}>`, // Dùng chính mail gửi để tránh bị spam filter
      to: email,
      subject: "Mã xác thực đăng ký MathStudy",
      html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Chào mừng bạn đến với MathStudy!</h2>
          <p>Mã xác thực OTP của bạn là:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; margin: 20px 0;">${otp}</div>
          <p style="color: #666; font-size: 12px;">Mã này sẽ hết hạn trong 5 phút.</p>
        </div>`
    });
    console.log(`OTP sent to ${email}`);
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Could not send OTP email" });
  }
});

app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const stored = otpStore.get(email);

  if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
    return res.status(400).json({ error: "Mã OTP không hợp lệ hoặc đã hết hạn" });
  }

  otpStore.delete(email);
  res.json({ success: true });
});

// Cấu hình phục vụ frontend
if (isDev) {
  console.log("Running in DEVELOPMENT mode with Vite middleware");
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
  // Phục vụ file tĩnh (Quan trọng cho Render)
  app.use(express.static(path.join(__dirname, "dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// Khởi chạy server
server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
