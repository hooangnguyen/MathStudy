# MathStudy

Ứng dụng học Toán trực tuyến cho học sinh lớp 1–9: lớp học và bài tập, đấu toán (1v1, phòng, quiz lớp), nhắn tin và gia sư AI giải bài từ ảnh chụp.

## Công nghệ

- **Frontend:** React 19, Vite 6, Tailwind CSS 4, TypeScript, PWA
- **Backend:** Express (`server.ts`), phục vụ API và file tĩnh
- **Dữ liệu và đăng nhập:** Firebase (Firestore, Authentication, Storage)
- **AI:** Google Gemini (`@google/genai`)
- **Hiển thị công thức toán:** KaTeX, MathLive

## Cấu trúc thư mục

```
server.ts              # Express server: API OTP, API AI, phục vụ frontend
server/                # API chấm điểm (bài tập, bài học, LP đấu toán) bằng Firebase Admin
shared/                # Logic chấm điểm/xếp hạng dùng chung client + server
firestore.rules        # Luật bảo mật Firestore
src/
  pages/               # Các màn hình chính (Dashboard, Classroom, MathDuel, ...)
  features/            # Tính năng lớn (classroom, chat, duel)
  components/common/   # Component dùng chung
  services/            # Truy cập Firestore và gọi API
  data/questions/      # Ngân hàng câu hỏi theo lớp
tests/                 # Unit test (Vitest)
```

## Chạy ở máy local

Yêu cầu Node.js 20 trở lên.

```bash
npm install
cp .env.example .env   # rồi điền GEMINI_API_KEY, GMAIL_USER, GMAIL_PASS, FIREBASE_SERVICE_ACCOUNT
npm run dev            # http://localhost:3000
```

Các lệnh khác:

| Lệnh | Mô tả |
| --- | --- |
| `npm run build` | Build frontend vào `dist/` |
| `npm start` | Chạy server ở chế độ production (cần build trước) |
| `npm run lint` | Kiểm tra kiểu TypeScript |
| `npm test` | Chạy unit test |
| `npm run test:emulator` | Test Firestore rules + API chấm điểm trên Firebase Emulator (cần Java) |
| `npm run migrate:answer-keys` | Tách đáp án khỏi các bài tập tạo trước đây (chạy một lần) |

## Chạy bằng Docker

```bash
docker build -t mathstudy .
docker run -p 3000:3000 --env-file .env mathstudy
```

## Chấm điểm phía server

Điểm không do trình duyệt tự tính và ghi lên nữa, mà do server tính bằng Firebase Admin SDK:

| API | Việc server làm |
| --- | --- |
| `POST /api/assignments/submit` | Chấm bài theo đáp án lưu ở `classes/{lớp}/answerKeys/{bài}` (chỉ giáo viên đọc được), lưu bài nộp và thống kê |
| `POST /api/lessons/complete` | Chấm lại câu trả lời theo ngân hàng câu hỏi, cộng điểm (mỗi bài một lần) |
| `POST /api/duels/:id/finish` | Xác định thắng/thua/đầu hàng, giới hạn điểm tự báo, cập nhật LP cả hai người (mỗi trận một lần) |

Server cần **service account** để ghi dữ liệu: Firebase Console → Project settings → Service accounts →
Generate new private key, rồi đặt toàn bộ nội dung file JSON vào biến `FIREBASE_SERVICE_ACCOUNT`.
Thiếu biến này thì các API trên trả lỗi 503.

Giới hạn còn lại: câu hỏi luyện tập và đấu toán lấy từ ngân hàng câu hỏi đóng gói sẵn trong app, nên người rành kỹ thuật
vẫn có thể tra đáp án; server chỉ giới hạn điểm ở mức tối đa hợp lệ (vd. 10 điểm/câu, không quá 1 câu/giây).

## Bảo mật

- **Firestore rules:** sau khi sửa `firestore.rules`, cần deploy lên Firebase thì mới có hiệu lực:
  ```bash
  npx firebase-tools deploy --only firestore:rules --project <project-id>
  ```
- **API AI (`/api/ai/*`):** yêu cầu Firebase ID token trong header `Authorization: Bearer <token>` và bị giới hạn 20 request mỗi phút cho mỗi người dùng.
- **API OTP:** giới hạn số lần gửi mã theo IP và email. Mỗi mã chỉ được nhập sai tối đa 5 lần.
