import { Router } from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { rateLimit } from "./rateLimit";

/** Gửi và kiểm tra mã OTP qua email khi đăng ký (mount tại /api). */
export const otpRouter = Router();

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
otpRouter.post(
  "/send-otp",
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

otpRouter.post("/verify-otp", rateLimit("otp-verify-ip", 30, 10 * 60 * 1000), (req, res) => {
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
