import type { Request, Response, NextFunction } from "express";
import { adminAuth, adminReady } from "./firebaseAdmin";

export type AuthedRequest = Request & { uid?: string };

/** Lỗi nghiệp vụ trả về cho client với mã HTTP tương ứng. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Chỉ cho phép request kèm Firebase ID token hợp lệ (header Authorization: Bearer <token>). */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return res.status(401).json({ success: false, error: "Bạn cần đăng nhập để dùng tính năng này." });
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    // Khách vào phòng quiz bằng tên (đăng nhập ẩn danh) không được dùng các API (AI, chấm điểm, ...)
    if (decoded.firebase?.sign_in_provider === "anonymous") {
      return res.status(403).json({ success: false, error: "Bạn cần đăng nhập tài khoản để dùng tính năng này." });
    }
    req.uid = decoded.uid;
    next();
  } catch {
    if (res.headersSent) return;
    res.status(401).json({ success: false, error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
  }
}

/** Các API ghi dữ liệu bằng quyền admin cần service account. */
export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  if (!adminReady) {
    return res.status(503).json({ success: false, error: "Máy chủ chưa được cấu hình để lưu kết quả. Vui lòng báo quản trị viên." });
  }
  next();
}

/** Bọc handler async: lỗi HttpError trả đúng mã, lỗi khác trả 500. */
export const handle =
  (fn: (req: AuthedRequest, res: Response) => Promise<unknown>) =>
  (req: AuthedRequest, res: Response) => {
    fn(req, res).catch((error) => {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      console.error(`Error in ${req.method} ${req.originalUrl}:`, error);
      res.status(500).json({ success: false, error: "Đã xảy ra lỗi, vui lòng thử lại." });
    });
  };
