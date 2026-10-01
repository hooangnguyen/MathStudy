import fs from "fs";
import path from "path";
import { initializeApp, cert, applicationDefault, type AppOptions } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Khởi tạo Firebase Admin cho server.
 *
 * Thông tin xác thực (theo thứ tự ưu tiên):
 * - FIREBASE_SERVICE_ACCOUNT: nội dung JSON của service account key
 * - GOOGLE_APPLICATION_CREDENTIALS: đường dẫn tới file key
 * - FIRESTORE_EMULATOR_HOST: chạy với emulator (không cần key)
 * Không có cái nào thì vẫn xác thực được ID token, nhưng các API ghi điểm sẽ trả 503.
 */

function loadProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID) return process.env.FIREBASE_PROJECT_ID;
  try {
    const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "firebase-applet-config.json"), "utf-8"));
    return config.projectId;
  } catch {
    throw new Error("Thiếu FIREBASE_PROJECT_ID hoặc file firebase-applet-config.json");
  }
}

const projectId = loadProjectId();
const options: AppOptions = { projectId };

let hasCredentials = false;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  options.credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  hasCredentials = true;
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  options.credential = applicationDefault();
  hasCredentials = true;
} else if (process.env.FIRESTORE_EMULATOR_HOST) {
  hasCredentials = true;
} else {
  console.warn(
    "[firebase-admin] Chưa cấu hình FIREBASE_SERVICE_ACCOUNT: nộp bài, điểm bài học và LP đấu toán sẽ không hoạt động."
  );
}

const app = initializeApp(options);

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminReady = hasCredentials;
