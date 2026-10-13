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

await step('Bài học: làm đúng → linh vật khen, làm sai → linh vật động viên', async () => {
  await page.getByRole('button', { name: /Học ngay/ }).click();
  await page.getByRole('button', { name: 'Kiểm tra' }).waitFor({ timeout: 20000 });
  const seen = { right: false, wrong: false };
  for (let i = 0; i < 14 && !(seen.right && seen.wrong); i++) {
    const input = page.getByPlaceholder('Nhập câu trả lời của bạn...');
    if (await input.count()) await input.fill(seen.wrong ? '1' : 'không biết');
    else {
      // Chọn lần lượt đáp án khác nhau để gặp cả đúng lẫn sai
      const options = page.locator('button.rounded-\\[2rem\\]');
      await options.nth(i % (await options.count())).click();
    }
    await page.getByRole('button', { name: 'Kiểm tra' }).click();
    const heading = (await page.locator('h4').first().innerText()).trim();
    const feedbackMascot = page.locator('h4').first().locator('xpath=../..').getByRole('img', { name: MASCOT });
    expect(await feedbackMascot.count() === 1, 'phần phản hồi không có linh vật');
    if (PRAISE.includes(heading) && !seen.right) { seen.right = true; await shot(page, 'mascot-correct'); }
    else if (ENCOURAGE.includes(heading) && !seen.wrong) { seen.wrong = true; await shot(page, 'mascot-wrong'); }
    else expect(PRAISE.includes(heading) || ENCOURAGE.includes(heading), `lời phản hồi lạ: ${heading}`);
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await page.waitForTimeout(300);
  }
  expect(seen.right && seen.wrong, `đúng: ${seen.right}, sai: ${seen.wrong}`);
});

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
