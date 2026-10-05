import type { Request, Response, NextFunction } from "express";
import type { AuthedRequest } from "./http";

// Rate limiting trong bộ nhớ: đủ cho 1 instance server.

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

export function rateLimit(name: string, max: number, windowMs: number, keyOf: (req: Request) => string = (req) => req.ip || "unknown") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowRequest(`${name}:${keyOf(req)}`, max, windowMs)) {
      return res.status(429).json({ success: false, error: "Bạn thao tác quá nhanh, vui lòng thử lại sau." });
    }
    next();
  };
}

/** Giới hạn theo người dùng đã đăng nhập (dùng sau requireAuth), `max` lần mỗi phút. */
export const perUser = (name: string, max: number) =>
  rateLimit(name, max, 60 * 1000, (req) => (req as AuthedRequest).uid || req.ip || "unknown");
