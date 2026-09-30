/**
 * Test trình duyệt (2 người chơi) cho phòng đấu: vào phòng, văng khỏi phòng/trận và vào lại.
 * Chạy bằng: npm run test:e2e  (cần Java cho Firebase Emulator và Chromium)
 */
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const BASE = `http://localhost:${process.env.PORT || 3995}`;
const PROJECT_ID = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8')).projectId;
const adb = getFirestore(initializeApp({ projectId: PROJECT_ID }));
let pass = 0, fail = 0;
const step = async (name, fn) => {
  try { await fn(); pass++; console.log('  ok  ', name); }
  catch (e) { fail++; console.log('  FAIL', name, '-', String(e.message).split('\n')[0]); }
};
const expect = (c, m) => { if (!c) throw new Error(m); };

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
async function player(user) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.dialogs = [];
  page.on('dialog', (d) => { page.dialogs.push(d.message()); d.accept(); });
  await page.goto(BASE);
  await page.fill('input[placeholder="example@gmail.com"]', user.email);
  await page.locator('input[type="password"]').first().fill('secret123');
  await page.locator('button[type="submit"]').click();
  await page.getByText(user.role === 'teacher' ? 'Quiz' : 'Đối kháng', { exact: true }).first().waitFor({ timeout: 20000 });
  return page;
}
const openDuel = async (p) => { await p.getByText('Đối kháng').first().click(); await p.getByText('Đấu trường Toán học').waitFor(); };
const optionButtons = (p) => p.locator('div.grid.grid-cols-2 > button');
const roomOf = async (code) => (await adb.collection('duelRooms').where('code', '==', code).get()).docs[0];

const A = await signUp('a@test.dev', 'An');
const B = await signUp('b@test.dev', 'Bình');
const pa = await player(A);
const pb = await player(B);
await openDuel(pa);
await openDuel(pb);

// ---- Tạo phòng, vào phòng ----
let code;
await step('A tạo phòng 1v1, mã đủ 6 ký tự', async () => {
  await pa.getByText('Tạo phòng', { exact: true }).click();
  await pa.getByText('TẠO PHÒNG NGAY').click();
  await pa.getByText('Mã phòng của bạn').waitFor();
  code = (await pa.locator('div.text-5xl').innerText()).trim();
  expect(/^[A-Z0-9]{6}$/.test(code), `mã "${code}"`);
});
await step('B nhập mã và vào phòng; A thấy 2 người', async () => {
  await pb.getByText('Vào phòng', { exact: true }).first().click();
  await pb.fill('input[placeholder="VD: A1B2C3"]', code);
  await pb.getByRole('button', { name: 'VÀO PHÒNG', exact: true }).click();
  await pb.getByText('Đang chờ chủ phòng bắt đầu...').waitFor();
  await pa.getByText('Người chơi (2)').waitFor({ timeout: 10000 });
});
await step('B tải lại trang ở phòng chờ → tự quay lại phòng chờ', async () => {
  await pb.reload();
  await pb.getByText('Đang chờ chủ phòng bắt đầu...').waitFor({ timeout: 20000 });
});
await step('B chuyển sang tab Trang chủ rồi quay lại → vẫn ở phòng chờ', async () => {
  await pb.getByText('Trang chủ').first().click();
  await pb.waitForTimeout(1000);
  await pb.getByText('Đối kháng').first().click();
  await pb.getByText('Đang chờ chủ phòng bắt đầu...').waitFor({ timeout: 20000 });
  const room = await roomOf(code);
  expect(room.data().currentPlayers.length === 2, 'sĩ số phòng bị sai');
});

// ---- Đang chơi thì văng ----
await step('A bắt đầu → cả hai vào trận', async () => {
  await pa.getByText('BẮT ĐẦU NGAY').click();
  await optionButtons(pa).first().waitFor({ timeout: 15000 });
  await optionButtons(pb).first().waitFor({ timeout: 15000 });
});
let before;
await step('B trả lời 2 câu rồi tải lại trang giữa trận → vào lại đúng câu 3, giữ điểm', async () => {
  for (let i = 0; i < 2; i++) { await optionButtons(pb).first().click(); await pb.waitForTimeout(400); }
  await pb.waitForTimeout(800);
  before = (await roomOf(code)).data().participantProgress[B.uid];
  expect(before?.progress === 2, `tiến độ trước khi tải lại: ${JSON.stringify(before)}`);
  await pb.reload();
  await optionButtons(pb).first().waitFor({ timeout: 20000 });
  await optionButtons(pb).first().click();
  await pb.waitForTimeout(1200);
  const after = (await roomOf(code)).data().participantProgress[B.uid];
  expect(after.progress === 3, `sau khi tải lại, trả lời tiếp thì tiến độ = ${after.progress} (mong đợi 3)`);
  expect(Math.abs(after.score - before.score) <= 10, `điểm bị reset: trước ${before.score}, sau ${after.score}`);
});
await step('Đồng hồ không bị đặt lại về 300 giây sau khi vào lại', async () => {
  const text = await pb.locator('body').innerText();
  const nums = [...text.matchAll(/\b(\d{2,3})\b/g)].map((m) => +m[1]).filter((n) => n > 250 && n <= 300);
  expect(nums.length > 0 && Math.max(...nums) < 300, `thời gian hiển thị: ${nums}`);
});
await step('A vẫn thấy điểm của B cập nhật (không bị văng)', async () => {
  const room = (await roomOf(code)).data();
  expect(room.currentPlayers.includes(B.uid) && room.status === 'playing', 'B không còn trong phòng');
});

// ---- Chủ phòng đóng phòng ----
await step('Chủ phòng rời phòng khi B đang ở phòng chờ → B được báo và về sảnh', async () => {
  // Dọn ván cũ rồi mở ván mới: A tạo phòng, B vào
  await adb.doc(`duelRooms/${(await roomOf(code)).id}`).delete();
  await pa.reload(); await pb.reload();
  await openDuel(pa); await openDuel(pb);
  await pa.getByText('Tạo phòng', { exact: true }).click();
  await pa.getByText('TẠO PHÒNG NGAY').click();
  await pa.getByText('Mã phòng của bạn').waitFor();
  const code2 = (await pa.locator('div.text-5xl').innerText()).trim();
  await pb.getByText('Vào phòng', { exact: true }).first().click();
  await pb.fill('input[placeholder="VD: A1B2C3"]', code2);
  await pb.getByRole('button', { name: 'VÀO PHÒNG', exact: true }).click();
  await pb.getByText('Đang chờ chủ phòng bắt đầu...').waitFor();
  pb.dialogs.length = 0;
  await pa.getByText('Rời phòng').click();
  await pb.getByText('Đấu trường Toán học').waitFor({ timeout: 10000 });
  expect(pb.dialogs.some((m) => m.includes('phòng đã đóng')), `thông báo: ${pb.dialogs}`);
  expect(!pa.dialogs.some((m) => m.includes('phòng đã đóng')), 'chủ phòng không nên nhận thông báo');
});

// ---- Trận đấu nhanh ----
await step('Đấu nhanh: ghép trận, B tải lại giữa trận → vào lại trận với điểm/câu đang làm', async () => {
  await pa.getByText('TÌM ĐỐI THỦ NGẪU NHIÊN').click();
  await pb.getByText('TÌM ĐỐI THỦ NGẪU NHIÊN').click();
  await optionButtons(pa).first().waitFor({ timeout: 30000 });
  await optionButtons(pb).first().waitFor({ timeout: 30000 });
  for (let i = 0; i < 3; i++) { await optionButtons(pb).first().click(); await pb.waitForTimeout(400); }
  await pb.waitForTimeout(800);
  const duel = (await adb.collection('activeDuels').where('status', '==', 'playing').get()).docs.map((d) => d.data())
    .find((d) => [d.player1Id, d.player2Id].includes(B.uid));
  const key = duel.player1Id === B.uid ? 'player1' : 'player2';
  expect(duel[`${key}Progress`] === 3, `tiến độ trước: ${duel[`${key}Progress`]}`);
  await pb.reload();
  await optionButtons(pb).first().waitFor({ timeout: 20000 });
  await optionButtons(pb).first().click();
  await pb.waitForTimeout(1200);
  const after = (await adb.doc(`activeDuels/${duel.id}`).get()).data();
  expect(after[`${key}Progress`] === 4, `tiến độ sau khi vào lại: ${after[`${key}Progress`]} (mong đợi 4)`);
});

// ---- Phòng Quiz lớp ----
const T = await signUp('t@test.dev', 'Cô Lan', 'teacher');
const C = await signUp('c@test.dev', 'Chi');
const draftRef = adb.collection('drafts').doc();
await draftRef.set({
  id: draftRef.id, teacherId: T.uid, title: 'Quiz thử', description: '', createdAt: new Date(), updatedAt: new Date(),
  settings: { shuffleQuestions: false, showScoreImmediate: true },
  questions: Array.from({ length: 6 }, (_, i) => ({
    id: i + 1, type: 'multiple_choice', text: `${i} + 1 = ?`, options: [`${i + 1}`, `${i + 2}`], correctAnswer: 0, points: 10,
  })),
});
const pt = await player(T);
const pc = await player(C);
const quizButtons = (p) => p.locator('div.grid.grid-cols-1 > button');
let quizCode;

await step('Quiz: giáo viên tạo phòng từ bản nháp, học sinh nhập mã vào phòng', async () => {
  await pt.getByText('Quiz', { exact: true }).first().click();
  await pt.getByRole('button', { name: 'TẠO PHÒNG QUIZ', exact: true }).click();
  await pt.locator('select').first().selectOption(draftRef.id);
  await pt.getByRole('button', { name: 'TẠO PHÒNG', exact: true }).click();
  await pt.getByText('Mã tham gia').waitFor();
  quizCode = (await pt.locator('span.tabular-nums').innerText()).trim();
  expect(/^\d{6}$/.test(quizCode), `mã "${quizCode}"`);
  await openDuel(pc);
  await pc.getByText('Tham gia Quiz Lớp học (Nhập mã)').click();
  await pc.getByRole('button', { name: 'VÀO PHÒNG QUIZ', exact: true }).click();
  await pc.fill('input[placeholder="VD: 123456"]', quizCode);
  await pc.getByRole('button', { name: 'VÀO PHÒNG', exact: true }).click();
  await pc.getByText('Đang chờ giáo viên bắt đầu...').waitFor();
});
await step('Quiz: học sinh tải lại trang ở phòng chờ → vẫn ở phòng chờ', async () => {
  await pc.reload();
  await pc.getByText('Đang chờ giáo viên bắt đầu...').waitFor({ timeout: 20000 });
});
await step('Quiz: học sinh tải lại trang giữa bài → làm tiếp đúng câu, giữ điểm', async () => {
  await pt.getByRole('button', { name: 'BẮT ĐẦU QUIZ', exact: true }).click();
  await quizButtons(pc).first().waitFor({ timeout: 15000 });
  for (let i = 0; i < 2; i++) { await quizButtons(pc).first().click(); await pc.waitForTimeout(400); }
  await pc.waitForTimeout(800);
  const before = (await roomOf(quizCode)).data().participantProgress[C.uid];
  expect(before?.progress === 2 && before.score === 20, `trước: ${JSON.stringify(before)}`);
  await pc.reload();
  await quizButtons(pc).first().waitFor({ timeout: 20000 });
  await quizButtons(pc).first().click();
  await pc.waitForTimeout(1200);
  const after = (await roomOf(quizCode)).data().participantProgress[C.uid];
  expect(after.progress === 3 && after.score === 30, `sau: ${JSON.stringify(after)} (mong đợi câu 3, 30 điểm)`);
});
await step('Quiz: giáo viên tải lại trang khi đang thi → vẫn theo dõi được phòng', async () => {
  await pt.reload();
  await pt.getByText('Quiz', { exact: true }).first().waitFor({ timeout: 20000 });
  await pt.waitForTimeout(2000);
  const text = await pt.locator('body').innerText();
  expect(!text.includes('TẠO PHÒNG QUIZ'), 'giáo viên bị đưa về sảnh Quiz');
  expect(text.includes('Chi'), 'không thấy học sinh trong bảng theo dõi');
});

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
