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
cp .env.example .env   # rồi điền GEMINI_API_KEY, GMAIL_USER, GMAIL_PASS
npm run dev            # http://localhost:3000
```

Các lệnh khác:

| Lệnh | Mô tả |
| --- | --- |
| `npm run build` | Build frontend vào `dist/` |
| `npm start` | Chạy server ở chế độ production (cần build trước) |
| `npm run lint` | Kiểm tra kiểu TypeScript |
| `npm test` | Chạy unit test |

## Chạy bằng Docker

```bash
docker build -t mathstudy .
docker run -p 3000:3000 --env-file .env mathstudy
```

## Bảo mật

- **Firestore rules:** sau khi sửa `firestore.rules`, cần deploy lên Firebase thì mới có hiệu lực:
  ```bash
  npx firebase-tools deploy --only firestore:rules --project <project-id>
  ```
- **API AI (`/api/ai/*`):** yêu cầu Firebase ID token trong header `Authorization: Bearer <token>` và bị giới hạn 20 request mỗi phút cho mỗi người dùng.
- **API OTP:** giới hạn số lần gửi mã theo IP và email. Mỗi mã chỉ được nhập sai tối đa 5 lần.
