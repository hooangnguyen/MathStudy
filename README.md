# MathStudy

Ứng dụng học Toán trực tuyến cho học sinh lớp 1–9: lớp học và bài tập, đấu toán (1v1, phòng, quiz lớp), nhắn tin và gia sư AI giải bài từ ảnh chụp.

## Công nghệ

- **Frontend:** React 19, Vite 6, Tailwind CSS 4, TypeScript, PWA
- **Backend:** Express (`server.ts`), phục vụ API và file tĩnh
- **Dữ liệu và đăng nhập:** Firebase (Firestore, Authentication) + Firebase Admin SDK ở server
- **AI:** Google Gemini (`@google/genai`)
- **Hiển thị công thức toán:** KaTeX, MathLive

## Cấu trúc thư mục

Code được chia **theo tính năng**. Mọi thứ của một tính năng (màn hình, component, hook, service gọi Firestore/API)
nằm chung một thư mục trong `src/features/`, nên khi sửa hay mở rộng một tính năng chỉ cần mở đúng thư mục đó.

```
server.ts                  # Khởi tạo Express: gắn các API, phục vụ frontend, cache
server/                    # API phía server (Firebase Admin)
  ai.ts                    #   /api/ai: AI soạn câu hỏi, gia sư giải bài
  otp.ts                   #   /api/send-otp, /api/verify-otp
  assignments.ts           #   chấm bài tập
  lessons.ts               #   chấm bài học, cộng điểm
  duels.ts                 #   kết thúc trận đấu, tính LP
  questionBank.ts          #   đọc ngân hàng câu hỏi ở server
  http.ts, rateLimit.ts, firebaseAdmin.ts
shared/                    # Logic thuần dùng chung client + server (chấm điểm, xếp hạng, phòng đấu)
firestore.rules            # Luật bảo mật Firestore
src/
  main.tsx                 # Điểm vào
  app/                     # Khung ứng dụng: App (điều hướng tab), FirebaseProvider, layout/
  components/              # Component giao diện dùng chung, không gắn với tính năng nào (Avatar, ...)
  content/                 # Hiển thị và soạn nội dung câu hỏi: MathRenderer, MathTextEditor, công thức
  lib/                     # Hạ tầng: firebase, apiClient, authService, aiService, âm thanh, ảnh, cn()
  features/
    auth/                  #   đăng nhập, onboarding
    home/                  #   trang chủ học sinh (lộ trình học, bài tập cần làm)
    lessons/               #   làm bài học + questionBank.ts (nơi duy nhất nạp ngân hàng câu hỏi)
    classroom/             #   lớp học phía học sinh, classService
    assignments/           #   bài tập: soạn (builder/), làm, xem kết quả, chấm, assignmentService
    teacher/               #   trang chủ và trang quản lý lớp của giáo viên
    quiz/                  #   quiz trực tiếp trong lớp
    duel/                  #   đấu 1v1, phòng đấu (views/, hook useMathDuel, duelService)
    rooms/                 #   vào phòng: mã QR, link /join/<mã>, trình chiếu, khách vào bằng tên, nhân vật
    leaderboard/           #   bảng xếp hạng
    chat/                  #   tin nhắn, gia sư AI
    notifications/         #   thông báo
    user/                  #   hồ sơ, cài đặt, userService
  data/questions/          # Ngân hàng câu hỏi theo lớp
  types/                   # Khai báo kiểu cho thư viện ngoài
tests/                     # Unit test (Vitest), emulator/, e2e/
```

Quy ước khi thêm code:

- Code chỉ một tính năng dùng → để trong `src/features/<tính năng>/`.
- Tính năng này cần dùng code của tính năng khác → import trực tiếp file đó (vd. `quiz/` dùng `duel/duelService`).
  Khi một phần được nhiều tính năng dùng chung thì mới chuyển nó lên `components/`, `content/` hoặc `lib/`.
- `lib/` và `components/` không import từ `features/`. Ngoại lệ duy nhất hiện tại là `lib/audio.ts` import kiểu `UserPreferences`.
- Logic chấm điểm/kiểm tra cần chạy ở cả hai phía → `shared/`, không import gì từ `src/`.
- Thêm API mới → tạo router trong `server/` rồi gắn vào `server.ts`.

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
| `npm run test:e2e` | Test trình duyệt: vào phòng bằng mã/QR/link, văng khỏi phòng/trận rồi vào lại, soạn bài tập (cần Java + Chromium; đặt `CHROMIUM_PATH` nếu cần) |
| `npm run migrate:answer-keys` | Tách đáp án khỏi các bài tập tạo trước đây (chạy một lần) |

## Vào phòng bằng mã QR / link

Phòng quiz lớp và phòng đấu đều có link mời dạng `https://<tên miền>/join/<mã>` và mã QR chứa link đó.
Mã 6 chữ số là phòng quiz, mã có chữ cái là phòng đấu. Giáo viên bấm **Trình chiếu** để hiện mã QR toàn màn hình lên máy chiếu.
Học sinh quét QR bằng camera điện thoại.

- **Phòng quiz: vào không cần tài khoản** (như Kahoot). Người chưa đăng nhập nhập tên, chọn nhân vật rồi vào phòng.
  Bên dưới dùng đăng nhập ẩn danh của Firebase, nên cần bật: Firebase Console → Authentication → Sign-in method → **Anonymous**.
  Khách chỉ dùng được phòng quiz: Firestore rules chặn mọi dữ liệu khác, server trả 403 cho mọi API (AI, chấm điểm).
  Điểm của khách chỉ nằm trong phòng, không lưu vào tài khoản nào.
- **Phòng đấu** vẫn cần đăng nhập; mở link khi chưa đăng nhập thì app nhắc đăng nhập rồi đưa thẳng vào phòng.
- **Nhân vật:** mỗi người trong phòng chọn và trang trí một nhân vật (8 con vật × 8 màu × 7 phụ kiện, vẽ bằng SVG trong
  `src/features/rooms/characters.tsx`), lưu ở `duelRooms/{phòng}.playerAvatars.{uid}`. Giáo viên có thể mời người chơi ra khỏi phòng chờ.

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
