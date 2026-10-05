/**
 * Test trình duyệt: giáo viên soạn câu hỏi có xuống dòng + công thức (nút toán và trình soạn
 * MathLive), giao bài; học sinh mở bài và thấy đúng như bản xem trước.
 * Chạy bằng: npm run test:e2e
 */
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8')).projectId;
const adb = getFirestore(initializeApp({ projectId: PROJECT_ID }, 'assignment-editor'));
const OUT = process.env.SCREENSHOT_DIR;
const BASE = `http://localhost:${process.env.PORT || 3995}`;
let pass = 0, fail = 0;
const step = async (name, fn) => { try { await fn(); pass++; console.log('  ok  ', name); } catch (e) { fail++; console.log('  FAIL', name, '-', String(e.message).split('\n')[0]); } };
const expect = (c, m) => { if (!c) throw new Error(m); };

async function signUp(email, name, role, extra = {}) {
  const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret123', returnSecureToken: true }) });
  const { localId } = await r.json();
  await adb.doc(`users/${localId}`).set({ uid: localId, name, role, grade: 5, onboarded: true, points: 0, streak: 0, ...extra });
  return { uid: localId, email };
}
const t = await signUp('gv-editor@test.dev', 'Nguyễn Thị Lan', 'teacher');
const s = await signUp('hs-editor@test.dev', 'Minh Anh', 'student', { enrolledClasses: ['editor-class'] });
await adb.doc('classes/editor-class').set({ id: 'editor-class', name: 'Lớp 5A', grade: 5, code: 'ABC234', teacherId: t.uid, studentIds: [s.uid],
  studentCount: 1, submitted: 0, totalAssignments: 0, totalExpectedSubmissions: 0, avgScore: 0, isActive: true, createdAt: new Date() });

const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
async function login(email) {
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.on('dialog', (d) => { console.log('    dialog:', d.message()); d.accept(); });
  await p.goto(BASE);
  await p.fill('input[placeholder="example@gmail.com"]', email);
  await p.locator('input[type="password"]').first().fill('secret123');
  await p.locator('button[type="submit"]').click();
  await p.getByText('Lớp học', { exact: true }).filter({ visible: true }).first().waitFor({ timeout: 20000 });
  return p;
}
const shot = (p, name) => (OUT ? p.screenshot({ path: `${OUT}/${name}.png` }) : Promise.resolve());

const pt = await login('gv-editor@test.dev');
const expected = 'Tính giá trị biểu thức:\nA = $\\frac{1}{2}$ + $\\frac{1}{3}$';
let textarea;
await step('Mở trình soạn bài tập', async () => {
  await pt.getByText('Lớp học', { exact: true }).filter({ visible: true }).first().click();
  await pt.getByText('Lớp 5A').first().click();
  await pt.getByText('Giao bài tập mới').first().click();
  await pt.getByText('Tạo bài mới hoàn toàn').first().click();
  await pt.getByPlaceholder('Vd: Ôn tập phân số').fill('Kiểm tra công thức');
  textarea = pt.getByLabel('Nội dung câu 1');
  await textarea.waitFor();
});
await step('Gõ chữ, Enter xuống dòng, chèn phân số bằng nút toán', async () => {
  await textarea.click();
  await pt.keyboard.type('Tính giá trị biểu thức:');
  await pt.keyboard.press('Enter');
  await pt.keyboard.type('A = ');
  await pt.getByRole('button', { name: 'Chèn phân số' }).first().click();
  await pt.keyboard.type('1');
  await pt.keyboard.press('ArrowRight'); await pt.keyboard.press('ArrowRight');
  await pt.keyboard.type('2');
  await pt.keyboard.press('ArrowRight'); await pt.keyboard.press('ArrowRight');
  await pt.keyboard.type(' + ');
  expect((await textarea.inputValue()) === 'Tính giá trị biểu thức:\nA = $\\frac{1}{2}$ + ', `nội dung: ${JSON.stringify(await textarea.inputValue())}`);
});
await step('Chèn phân số bằng trình soạn công thức trực quan (MathLive)', async () => {
  await pt.getByRole('button', { name: 'Công thức' }).first().click();
  const mf = pt.locator('math-field');
  await mf.waitFor({ timeout: 15000 });
  await mf.click();
  await pt.keyboard.type('1/3');
  await shot(pt, 'a1-formula-dialog');
  await pt.getByRole('button', { name: 'Chèn vào câu hỏi' }).click();
  await pt.waitForTimeout(300);
  expect((await textarea.inputValue()) === expected, `nội dung: ${JSON.stringify(await textarea.inputValue())}`);
});
await step('Ô "Học sinh sẽ thấy" hiển thị 2 dòng và 2 phân số', async () => {
  const preview = pt.getByText('Học sinh sẽ thấy:').first().locator('xpath=..');
  expect(await preview.locator('.katex').count() === 2, `số công thức: ${await preview.locator('.katex').count()}`);
  expect(await preview.locator('br').count() >= 1, 'không có xuống dòng');
  await shot(pt, 'a2-editor-preview');
});
await step('Nhập đáp án, sửa công thức có sẵn bằng trình soạn trực quan', async () => {
  await pt.getByPlaceholder('Đáp án A').fill('$\\frac{5}{6}$');
  await pt.getByPlaceholder('Đáp án B').fill('$\\frac{2}{5}$');
  // đặt con trỏ trong công thức của đáp án B rồi mở trình soạn → sửa thành 2/7
  const b = pt.getByPlaceholder('Đáp án B');
  await b.click(); await pt.keyboard.press('Home'); await pt.keyboard.press('ArrowRight'); await pt.keyboard.press('ArrowRight');
  await b.locator('xpath=ancestor::div[contains(@class,"space-y-2")][1]').getByRole('button', { name: 'Công thức' }).click();
  const mf = pt.locator('math-field');
  await mf.waitFor({ timeout: 15000 });
  const v = await mf.evaluate((el) => el.getValue('latex'));
  expect(v === '\\frac{2}{5}', `trình soạn mở với: ${v}`);
  await mf.evaluate((el) => { el.value = '\\frac{2}{7}'; });
  await pt.getByRole('button', { name: 'Cập nhật công thức' }).click();
  expect((await b.inputValue()) === '$\\frac{2}{7}$', `đáp án B: ${await b.inputValue()}`);
  await shot(pt, 'a3-options');
});
await step('Giao bài thành công, dữ liệu lưu đúng (đề không có đáp án, xuống dòng giữ nguyên)', async () => {
  await pt.getByText('Cài đặt', { exact: true }).first().click();
  const due = new Date(Date.now() + 2 * 864e5);
  const pad = (n) => String(n).padStart(2, '0');
  await pt.locator('input[type="datetime-local"]').fill(`${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}T17:00`);
  await pt.getByRole('button', { name: 'Giao bài', exact: true }).click();
  await pt.waitForTimeout(2500);
  const snap = await adb.collection('classes/editor-class/assignments').get();
  expect(snap.size === 1, `số bài tập: ${snap.size}`);
  const a = snap.docs[0].data();
  expect(a.questions[0].text === expected, `text: ${JSON.stringify(a.questions[0].text)}`);
  expect(!('correctAnswer' in a.questions[0]), 'đề lộ đáp án');
  const key = (await adb.doc(`classes/editor-class/answerKeys/${snap.docs[0].id}`).get()).data();
  expect(key.questions[0].correctAnswer === 0, 'đáp án đúng sai');
});

const ps = await login('hs-editor@test.dev');
await step('Học sinh mở bài từ trang chủ, thấy đúng 2 dòng và các phân số', async () => {
  await ps.getByText('Kiểm tra công thức').first().click();
  await ps.getByText('Tính giá trị biểu thức:').first().waitFor({ timeout: 15000 });
  const q = ps.getByText('Tính giá trị biểu thức:').first().locator('xpath=ancestor::div[contains(@class,"math-renderer")]');
  expect(await q.locator('.katex').count() === 2, `số công thức: ${await q.locator('.katex').count()}`);
  expect(await q.locator('br').count() >= 1, 'không xuống dòng');
  await shot(ps, 'a4-student-view');
});

console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
process.exit(fail ? 1 : 0);
