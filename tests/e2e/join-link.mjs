/**
 * Test trình duyệt cho mã QR và link vào phòng (/join/<mã>), kiểu Kahoot/Quizizz.
 * Chạy bằng: npm run test:e2e  (cần Java cho Firebase Emulator và Chromium)
 */
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import QRCode from 'qrcode';

const BASE = `http://localhost:${process.env.PORT || 3995}`;
const PROJECT_ID = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8')).projectId;
const adb = getFirestore(initializeApp({ projectId: PROJECT_ID }, 'join-link'));
let pass = 0, fail = 0;
const step = async (name, fn) => {
  try { await fn(); pass++; console.log('  ok  ', name); }
  catch (e) { fail++; console.log('  FAIL', name, '-', String(e.message).split('\n')[0]); }
};
const expect = (c, m) => { if (!c) throw new Error(m); };
// SHOTS=<thư mục>: lưu ảnh chụp màn hình để xem giao diện
const shot = async (page, name) => process.env.SHOTS && (await page.waitForTimeout(800), page.screenshot({ path: `${process.env.SHOTS}/${name}.png` }));

async function signUp(email, name, role = 'student') {
  const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret123', returnSecureToken: true }),
  });
  const { localId } = await r.json();
  await adb.doc(`users/${localId}`).set({ uid: localId, name, role, grade: 5, onboarded: true, points: 0, streak: 0 });
  return { uid: localId, email, name, role };
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
async function newPage() {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.dialogs = [];
  page.on('dialog', (d) => { page.dialogs.push(d.message()); d.accept(); });
  return page;
}
async function fillLogin(page, user) {
  await page.fill('input[placeholder="example@gmail.com"]', user.email);
  await page.locator('input[type="password"]').first().fill('secret123');
  await page.locator('button[type="submit"]').click();
}
async function login(user) {
  const page = await newPage();
  await page.goto(BASE);
  await fillLogin(page, user);
  await page.getByText(user.role === 'teacher' ? 'Quiz' : 'Đối kháng', { exact: true }).first().waitFor({ timeout: 20000 });
  return page;
}
const waitFor = async (fn, ms, label) => { const end = Date.now() + ms; while (Date.now() < end) { if (await fn()) return; await new Promise((r) => setTimeout(r, 500)); } throw new Error(label); };
const roomOf = async (code) => (await adb.collection('duelRooms').where('code', '==', code).get()).docs[0];
const WAIT_QUIZ = 'Đang chờ giáo viên bắt đầu...';

const T = await signUp('jt@test.dev', 'Thầy Minh', 'teacher');
const [S1, S2, S3, S4] = await Promise.all([
  signUp('j1@test.dev', 'Lan'), signUp('j2@test.dev', 'Mai'), signUp('j3@test.dev', 'Nam'), signUp('j4@test.dev', 'Oanh'),
]);
const draftRef = adb.collection('drafts').doc();
await draftRef.set({
  id: draftRef.id, teacherId: T.uid, title: 'Ôn tập phân số', description: '', createdAt: new Date(), updatedAt: new Date(),
  settings: { shuffleQuestions: false, showScoreImmediate: true },
  questions: Array.from({ length: 3 }, (_, i) => ({
    id: i + 1, type: 'multiple_choice', text: `${i} + 1 = ?`, options: [`${i + 1}`, `${i + 2}`], correctAnswer: 0, points: 10,
  })),
});

const pt = await login(T);
let quizCode;

await step('Giáo viên tạo phòng quiz → thấy mã QR, mã phòng và link /join/<mã>', async () => {
  await pt.getByText('Quiz', { exact: true }).first().click();
  await pt.getByRole('button', { name: 'TẠO PHÒNG QUIZ', exact: true }).click();
  await pt.locator('select').first().selectOption(draftRef.id);
  await pt.getByRole('button', { name: 'TẠO PHÒNG', exact: true }).click();
  quizCode = (await pt.getByTestId('room-code').innerText()).trim();
  expect(/^\d{6}$/.test(quizCode), `mã "${quizCode}"`);
  await pt.locator('[role="img"][aria-label="Mã QR vào phòng"] svg').first().waitFor({ timeout: 10000 });
  const text = await pt.locator('body').innerText();
  expect(text.includes(`/join/${quizCode}`), 'không thấy link vào phòng');
  await shot(pt, 'quiz-host-waiting');
});

await step('Mã QR chứa đúng link vào phòng', async () => {
  // Tạo lại mã QR của link mong đợi bằng cùng thư viện, cùng tuỳ chọn rồi so từng module (đường vẽ SVG)
  const html = await pt.locator('[role="img"][aria-label="Mã QR vào phòng"]').first().innerHTML();
  const expected = await QRCode.toString(`${BASE}/join/${quizCode}`, {
    type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1e1b4b', light: '#ffffff' },
  });
  const paths = (svg) => [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join('|');
  expect(paths(html).length > 100 && paths(html) === paths(expected), 'mã QR không khớp link /join/<mã>');
});

let p1;
await step('Học sinh CHƯA đăng nhập mở link → màn vào phòng bằng tên; chọn "Đăng nhập" → được nhắc đăng nhập', async () => {
  p1 = await newPage();
  await p1.goto(`${BASE}/join/${quizCode}`);
  await p1.getByText('Sẵn sàng chơi chưa?').waitFor({ timeout: 20000 });
  await p1.getByText('Đăng nhập để lưu điểm').click();
  await p1.getByText(`Đăng nhập để vào phòng`).waitFor({ timeout: 20000 });
  const banner = await p1.getByRole('status').innerText();
  expect(banner.includes(quizCode), `thông báo: ${banner}`);
  await shot(p1, 'student-login-banner');
  expect(new URL(p1.url()).pathname === '/', `địa chỉ chưa được đưa về "/": ${p1.url()}`);
});
await step('...đăng nhập xong → vào thẳng phòng chờ, giáo viên thấy 1 học sinh', async () => {
  await fillLogin(p1, S1);
  await p1.getByText(WAIT_QUIZ).waitFor({ timeout: 20000 });
  await pt.getByText('Đã tham gia (1)').waitFor({ timeout: 10000 });
});
await step('...tải lại trang không bị vào phòng lần nữa (vẫn ở phòng chờ, sĩ số không đổi)', async () => {
  await p1.reload();
  await p1.getByText(WAIT_QUIZ).waitFor({ timeout: 20000 });
  expect(p1.dialogs.length === 0, `thông báo không mong đợi: ${p1.dialogs}`);
  expect((await roomOf(quizCode)).data().currentPlayers.length === 2, 'sĩ số sai');
});

await step('Học sinh ĐÃ đăng nhập mở link (quét QR) → vào thẳng phòng chờ', async () => {
  const p2 = await login(S2);
  await p2.goto(`${BASE}/join/${quizCode}`);
  await p2.getByText(WAIT_QUIZ).waitFor({ timeout: 20000 });
  await pt.getByText('Đã tham gia (2)').waitFor({ timeout: 10000 });
});

let p3;
await step('Dán cả link vào ô nhập mã cũng vào được', async () => {
  p3 = await login(S3);
  await p3.getByText('Đối kháng').first().click();
  await p3.getByText('Tham gia Quiz Lớp học (Nhập mã)').click();
  await p3.getByRole('button', { name: 'VÀO PHÒNG QUIZ', exact: true }).click();
  await p3.fill('input[placeholder="VD: 123456"]', `${BASE}/join/${quizCode}`);
  expect((await p3.inputValue('input[placeholder="VD: 123456"]')) === quizCode, 'ô nhập không tách được mã từ link');
  await p3.getByRole('button', { name: 'VÀO PHÒNG', exact: true }).click();
  await p3.getByText(WAIT_QUIZ).waitFor({ timeout: 20000 });
});

let pg, guestUid;
await step('KHÁCH (không tài khoản) mở link → nhập tên, chọn nhân vật Ếch + vương miện → vào phòng chờ', async () => {
  pg = await newPage();
  await pg.goto(`${BASE}/join/${quizCode}`);
  await pg.getByText('Sẵn sàng chơi chưa?').waitFor({ timeout: 20000 });
  await pg.getByRole('button', { name: 'Ếch', exact: true }).click();
  await pg.getByRole('tab', { name: 'Phụ kiện' }).click();
  await pg.getByRole('button', { name: 'Vương miện', exact: true }).click();
  await shot(pg, 'guest-join');
  await pg.getByRole('button', { name: /VÀO PHÒNG/ }).click();
  await pg.getByRole('alert').waitFor({ timeout: 3000 }); // chưa nhập tên → nhắc
  await pg.getByPlaceholder('Vd: Minh Anh').fill('Bé Na');
  await pg.getByRole('button', { name: /VÀO PHÒNG/ }).click();
  await pg.getByText(WAIT_QUIZ).waitFor({ timeout: 20000 });
  await pt.getByText('Bé Na').first().waitFor({ timeout: 10000 });
  const room = (await roomOf(quizCode)).data();
  guestUid = Object.keys(room.playerNames).find((k) => room.playerNames[k] === 'Bé Na');
  expect(guestUid && room.currentPlayers.includes(guestUid), 'khách không có trong phòng');
  expect(/^frog\.\w+\.crown$/.test(room.playerAvatars?.[guestUid] ?? ''), `nhân vật: ${room.playerAvatars?.[guestUid]}`);
  await shot(pg, 'guest-waiting');
});
await step('Khách không thấy các mục khác của app (chỉ có màn phòng)', async () => {
  const text = await pg.locator('body').innerText();
  expect(!text.includes('Trang chủ') && !text.includes('Tin nhắn'), 'khách thấy thanh điều hướng');
});
await step('Khách đổi nhân vật trong phòng chờ → giáo viên thấy nhân vật mới', async () => {
  await pg.getByRole('button', { name: 'Đổi nhân vật' }).click();
  const dialog = pg.getByRole('dialog', { name: 'Đổi nhân vật' });
  await dialog.getByRole('button', { name: 'Rô-bốt', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xong' }).click();
  await pg.waitForTimeout(1200);
  const avatar = (await roomOf(quizCode)).data().playerAvatars[guestUid];
  expect(avatar.startsWith('robot.') && avatar.endsWith('.crown'), `nhân vật sau khi đổi: ${avatar}`);
  await pt.getByRole('img', { name: /Rô-bốt/ }).first().waitFor({ timeout: 10000 });
});
await step('Khách tải lại trang → vẫn ở phòng chờ (không phải nhập lại tên)', async () => {
  await pg.reload();
  await pg.getByText(WAIT_QUIZ).waitFor({ timeout: 20000 });
});
await step('Giáo viên mời một học sinh ra khỏi phòng → học sinh được báo và rời phòng', async () => {
  await shot(pt, 'host-lobby');
  await pt.getByRole('button', { name: 'Mời Nam ra khỏi phòng' }).click();
  await waitFor(async () => !(await roomOf(quizCode)).data().currentPlayers.includes(S3.uid), 10000, 'Nam vẫn trong phòng');
  await pt.getByText('Đã tham gia (3)').waitFor({ timeout: 10000 });
  await waitFor(async () => p3.dialogs.some((m) => m.includes('ra khỏi phòng')), 10000, `Nam không được báo: ${p3.dialogs}`);
  await p3.getByRole('button', { name: 'VÀO PHÒNG QUIZ', exact: true }).waitFor({ timeout: 10000 });
});

await step('Giáo viên bấm Trình chiếu → mã QR lớn, mã phòng và số học sinh; Esc để đóng', async () => {
  await pt.getByRole('button', { name: 'Trình chiếu' }).click();
  const dialog = pt.getByRole('dialog', { name: 'Trình chiếu mã vào phòng' });
  await dialog.waitFor();
  await pt.setViewportSize({ width: 1280, height: 720 });
  await shot(pt, 'presenter');
  const text = await dialog.innerText();
  expect(text.includes(quizCode) && text.includes('3 đã vào') && text.includes('Bé Na') && text.includes('Ôn tập phân số'), `màn trình chiếu: ${text}`);
  await pt.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached', timeout: 5000 });
  await pt.setViewportSize({ width: 390, height: 844 });
});

await step('Link phòng không tồn tại → báo lỗi và mở màn nhập mã', async () => {
  const p4 = await login(S4);
  await p4.goto(`${BASE}/join/000001`);
  await p4.locator('input[placeholder="VD: 123456"]').waitFor({ timeout: 20000 });
  expect(p4.dialogs.some((m) => m.includes('Không tìm thấy phòng')), `thông báo: ${p4.dialogs}`);
  await p4.context().close();
});

await step('Giáo viên mở link vào phòng → được báo link dành cho học sinh', async () => {
  const pt2 = await login(T);
  await pt2.goto(`${BASE}/join/${quizCode}`);
  await pt2.getByText('Quiz', { exact: true }).first().waitFor({ timeout: 20000 });
  await pt2.waitForTimeout(1500);
  expect(pt2.dialogs.some((m) => m.includes('dành cho học sinh')), `thông báo: ${pt2.dialogs}`);
  expect((await roomOf(quizCode)).data().currentPlayers.length === 4, 'giáo viên bị thêm vào phòng');
  await pt2.context().close();
});

await step('Khách làm bài: giáo viên bắt đầu → khách trả lời hết → thấy kết quả, điểm được ghi', async () => {
  await pt.getByRole('button', { name: 'BẮT ĐẦU QUIZ', exact: true }).click();
  const answers = pg.locator('div.grid.grid-cols-1 > button');
  for (let i = 0; i < 3; i++) { await answers.first().waitFor({ timeout: 15000 }); await answers.first().click(); await pg.waitForTimeout(400); }
  await pg.getByText('KẾT QUẢ QUIZ').waitFor({ timeout: 15000 });
  await pg.waitForTimeout(800);
  const prog = (await roomOf(quizCode)).data().participantProgress[guestUid];
  expect(prog?.finished && prog.score === 30, `tiến độ khách: ${JSON.stringify(prog)}`);
  await shot(pg, 'guest-result');
});
await step('Khách bấm Quay lại → màn "Chơi vui lắm"; Thoát → về màn đăng nhập', async () => {
  await pg.getByRole('button', { name: 'QUAY LẠI' }).click();
  await pg.getByText('Chơi vui lắm, Bé Na!').waitFor({ timeout: 10000 });
  await pg.getByRole('button', { name: 'Thoát / Đăng nhập tài khoản' }).click();
  await pg.locator('input[placeholder="example@gmail.com"]').waitFor({ timeout: 10000 });
});

await step('Phòng đấu: chủ phòng có mã QR; bạn mở link /join/<mã> → vào phòng đấu', async () => {
  const pa = await login(S4);
  await pa.getByText('Đối kháng').first().click();
  await pa.getByText('Tạo phòng', { exact: true }).click();
  await pa.getByText('TẠO PHÒNG NGAY').click();
  const duelCode = (await pa.getByTestId('room-code').innerText()).trim();
  expect(/[A-Z]/.test(duelCode), `mã phòng đấu phải có chữ cái: ${duelCode}`);
  await pa.locator('[role="img"][aria-label="Mã QR vào phòng"] svg').first().waitFor();
  await shot(pa, 'duel-waiting');
  const pb = await newPage();
  await pb.goto(`${BASE}/join/${duelCode.toLowerCase()}`);
  await fillLogin(pb, S3);
  await pb.getByText('Đang chờ chủ phòng bắt đầu...').waitFor({ timeout: 20000 });
  await pa.getByText('Người chơi (2)').waitFor({ timeout: 10000 });
});

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
