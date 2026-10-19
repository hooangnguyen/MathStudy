/**
 * Test trình duyệt cho linh vật khủng long: màn đăng nhập, lời chào ở trang chủ,
 * khen khi làm đúng / động viên khi làm sai trong bài học.
 * Chạy bằng: npm run test:e2e  (SHOTS=<thư mục> để lưu ảnh chụp)
 */
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const BASE = `http://localhost:${process.env.PORT || 3995}`;
const PROJECT_ID = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8')).projectId;
const adb = getFirestore(initializeApp({ projectId: PROJECT_ID }, 'mascot'));
let pass = 0, fail = 0;
const step = async (name, fn) => {
  try { await fn(); pass++; console.log('  ok  ', name); }
  catch (e) { fail++; console.log('  FAIL', name, '-', String(e.message).split('\n')[0]); }
};
const expect = (c, m) => { if (!c) throw new Error(m); };
const shot = async (page, name) => process.env.SHOTS && (await page.waitForTimeout(700), page.screenshot({ path: `${process.env.SHOTS}/${name}.png` }));
const MASCOT = /Dino, khủng long con/;
const PRAISE = ['Tuyệt vời!', 'Giỏi quá!', 'Chính xác!', 'Đỉnh luôn!', 'Quá đúng!'];
const ENCOURAGE = ['Chưa đúng, không sao!', 'Cố lên nhé!', 'Lần sau sẽ đúng thôi!', 'Học từ lỗi sai nào!'];

const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'dino@test.dev', password: 'secret123', returnSecureToken: true }),
});
const { localId } = await r.json();
await adb.doc(`users/${localId}`).set({ uid: localId, name: 'Nguyễn Minh Khôi', role: 'student', grade: 3, onboarded: true, points: 120, streak: 4 });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await (await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } })).newPage();

await step('Màn đăng nhập có linh vật vẫy chào', async () => {
  await page.goto(BASE);
  await page.getByRole('img', { name: MASCOT }).first().waitFor({ timeout: 20000 });
  await shot(page, 'mascot-auth');
});

await step('Trang chủ: linh vật nhắc giữ chuỗi ngày học', async () => {
  await page.fill('input[placeholder="example@gmail.com"]', 'dino@test.dev');
  await page.locator('input[type="password"]').first().fill('secret123');
  await page.locator('button[type="submit"]').click();
  await page.getByText('Giữ chuỗi').waitFor({ timeout: 20000 });
  expect((await page.getByText(/Giữ chuỗi\s*4 ngày/).count()) === 1, 'không thấy lời nhắc chuỗi 4 ngày');
  expect((await page.getByRole('img', { name: MASCOT }).count()) >= 1, 'không thấy linh vật');
  await shot(page, 'mascot-home');
});

await step('Bài học: làm đúng → Dino khen, làm sai → Dino động viên; câu sai được làm lại cuối bài', async () => {
  await page.getByRole('button', { name: /Học ngay/ }).click();
  await page.getByRole('radiogroup', { name: 'Các đáp án' }).waitFor({ timeout: 20000 });
  await shot(page, 'lesson-question');
  const seen = { right: false, wrong: false, retry: false };
  const answers = new Map();
  for (let i = 0; i < 40; i++) {
    if (await page.getByText(/Hoàn hảo!|Xuất sắc!|Làm tốt lắm!|Đã hoàn thành!/).count()) break;
    if (await page.getByText('Làm lại câu sai').count()) seen.retry = true;
    const options = page.getByRole('radio');
    const n = await options.count();
    const question = (await page.locator('#lesson-question').innerText()).trim();
    const known = answers.get(question);
    if (known !== undefined) {
      // Câu làm lại: chọn đúng đáp án đã thấy ở lần sai trước
      await options.nth(known).click();
    } else {
      // Lượt đầu chọn theo phím tắt 1–4 để gặp cả đúng lẫn sai
      await page.keyboard.press(String((i % n) + 1));
    }
    await page.getByRole('button', { name: /kiểm tra/i }).click();
    const status = page.getByRole('status');
    await status.waitFor();
    const heading = (await status.locator('h4').innerText()).trim();
    if (PRAISE.includes(heading) && !seen.right) { seen.right = true; await shot(page, 'mascot-correct'); }
    else if (ENCOURAGE.includes(heading) && !seen.wrong) { seen.wrong = true; await shot(page, 'mascot-wrong'); }
    else expect(PRAISE.includes(heading) || ENCOURAGE.includes(heading), `lời phản hồi lạ: ${heading}`);
    if (ENCOURAGE.includes(heading)) {
      // Ghi lại vị trí đáp án đúng (ô có dấu tích) để câu làm lại chọn đúng
      const radios = page.getByRole('radio');
      for (let k = 0; k < n; k++) if (await radios.nth(k).locator('svg.lucide-check').count()) answers.set(question, k);
    }
    await page.keyboard.press('Enter'); // Enter = Tiếp tục
    await page.waitForTimeout(250);
  }
  expect(seen.right && seen.wrong, `đúng: ${seen.right}, sai: ${seen.wrong}`);
  expect(seen.retry, 'câu sai không được đưa lại cuối bài');
});

await step('Hết bài → màn ăn mừng có Dino nhảy múa và các chỉ số; Tiếp tục → server cộng điểm', async () => {
  await page.getByRole('img', { name: 'Dino nhảy múa ăn mừng' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(1500);
  const text = await page.locator('body').innerText();
  for (const label of ['ĐIỂM THƯỞNG', 'CHÍNH XÁC', 'THỜI GIAN', 'CHUỖI ĐÚNG']) expect(text.toUpperCase().includes(label), `thiếu ô ${label}`);
  const percent = Number(/(\d+)%/.exec(text)?.[1]);
  await shot(page, 'lesson-complete');
  await page.getByRole('button', { name: /tiếp tục/i }).click();
  await page.getByText('Giữ chuỗi').waitFor({ timeout: 20000 });
  let points = 120;
  for (let i = 0; i < 20 && points === 120; i++) { await page.waitForTimeout(500); points = (await adb.doc(`users/${localId}`).get()).data().points; }
  expect(points === 120 + percent * 10, `điểm ${points}, mong đợi ${120 + percent * 10} (${percent}%)`);
});

await step('Thoát giữa bài → hỏi lại; "Học tiếp" ở lại, "Thoát" về trang chủ', async () => {
  await page.getByRole('button', { name: /Học ngay/ }).click();
  await page.getByRole('radiogroup', { name: 'Các đáp án' }).waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: 'Thoát bài học' }).click();
  await page.getByRole('dialog', { name: 'Dừng bài học' }).waitFor();
  await page.getByRole('button', { name: /học tiếp/i }).click();
  expect(await page.getByRole('radiogroup').count() === 1, 'không ở lại bài');
  await page.getByRole('button', { name: 'Thoát bài học' }).click();
  await page.getByRole('button', { name: /^thoát$/i }).click();
  await page.getByText('Giữ chuỗi').waitFor({ timeout: 10000 });
});

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
