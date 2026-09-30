/**
 * Test tích hợp cho firestore.rules và các API chấm điểm phía server,
 * chạy trên Firebase Emulator (Auth + Firestore):
 *
 *   npm run test:emulator
 */
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, setDoc, getDoc, updateDoc, addDoc, collection, getDocs, query, where, serverTimestamp, runTransaction,
  arrayUnion, increment, writeBatch,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-mathstudy';
const AUTH_HOST = '127.0.0.1:9099';
const FS_HOST = '127.0.0.1:8085';
const PORT = 3990;
const API = `http://127.0.0.1:${PORT}`;

let pass = 0;
let fail = 0;
async function t(name, fn) {
  try {
    await fn();
    pass++;
    console.log('  ok  ', name);
  } catch (e) {
    fail++;
    console.log('  FAIL', name, '-', String(e?.message || e).split('\n')[0]);
  }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

// ---------- Setup ----------

const env = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 },
});
const dbs = {};
const db = (uid) => (dbs[uid] ??= env.authenticatedContext(uid).firestore());
const admin = async (fn) => {
  let result;
  await env.withSecurityRulesDisabled(async (ctx) => { result = await fn(ctx.firestore()); });
  return result;
};

/** Tạo user trong Auth emulator, trả về { uid, token }. */
async function signUp(email) {
  const r = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret123', returnSecureToken: true }),
  });
  const data = await r.json();
  return { uid: data.localId, token: data.idToken };
}

async function api(path, token, body) {
  const r = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body ?? {}),
  });
  return { status: r.status, data: await r.json().catch(() => ({})) };
}

// Chạy thẳng bằng node + tsx loader (một tiến trình) để kill được gọn khi kết thúc
const server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
  env: {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: 'production',
    GEMINI_API_KEY: 'test',
    FIREBASE_PROJECT_ID: PROJECT_ID,
    FIRESTORE_EMULATOR_HOST: FS_HOST,
    FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST,
  },
  stdio: ['ignore', 'inherit', 'inherit'],
});
for (let i = 0; i < 60; i++) {
  try { await fetch(API + '/api/lessons/complete', { method: 'POST' }); break; } catch { await new Promise((r) => setTimeout(r, 500)); }
}

const teacher = await signUp('teacher@test.dev');
const stu = await signUp('stu@test.dev');
const stu2 = await signUp('stu2@test.dev');
const outsider = await signUp('out@test.dev');

await admin(async (a) => {
  await setDoc(doc(a, `users/${teacher.uid}`), { uid: teacher.uid, role: 'teacher', onboarded: true, points: 0, name: 'Cô Lan' });
  await setDoc(doc(a, `users/${stu.uid}`), { uid: stu.uid, role: 'student', onboarded: true, points: 0, grade: 5, name: 'An', completedLessons: [] });
  await setDoc(doc(a, `users/${stu2.uid}`), { uid: stu2.uid, role: 'student', onboarded: true, points: 0, grade: 5, name: 'Bình' });
  await setDoc(doc(a, `users/${outsider.uid}`), { uid: outsider.uid, role: 'student', onboarded: true, points: 0, grade: 5, name: 'Ngoài' });
});

// ---------- Bài tập: đáp án ẩn + server chấm ----------
console.log('\nBài tập');

const classId = 'class1';
const assignmentId = 'a1';
const questions = [
  { id: 1, type: 'multiple_choice', text: '1+1', options: ['1', '2'], correctAnswer: 1, points: 10 },
  { id: 2, type: 'checkbox', text: 'số chẵn', options: ['1', '2', '4'], correctAnswer: [1, 2], points: 10 },
  { id: 3, type: 'short_answer', text: '2+2', options: [], correctAnswer: '4', points: 10 },
  { id: 4, type: 'essay', text: 'giải thích', options: [], points: 10 },
];

await t('giáo viên tạo lớp', () => assertSucceeds(setDoc(doc(db(teacher.uid), `classes/${classId}`), {
  id: classId, name: 'L5', grade: 5, code: 'ABC123', teacherId: teacher.uid, studentIds: [], isActive: true,
  studentCount: 0, submitted: 0, totalAssignments: 0, totalExpectedSubmissions: 0, avgScore: 0,
})));
await t('học sinh vào lớp', () => assertSucceeds(updateDoc(doc(db(stu.uid), `classes/${classId}`), { studentIds: arrayUnion(stu.uid), studentCount: increment(1) })));
await t('KHÔNG thêm người khác vào lớp', () => assertFails(updateDoc(doc(db(outsider.uid), `classes/${classId}`), { studentIds: arrayUnion('someone'), studentCount: increment(1) })));
await t('KHÔNG vào lớp hai lần để tăng sĩ số', () => assertFails(updateDoc(doc(db(stu.uid), `classes/${classId}`), { studentIds: arrayUnion(stu.uid), studentCount: increment(1) })));
await t('giáo viên giao bài (đề không kèm đáp án + answerKey riêng)', () => assertSucceeds(runTransaction(db(teacher.uid), async (tx) => {
  const d = db(teacher.uid);
  await tx.get(doc(d, `classes/${classId}`));
  tx.update(doc(d, `classes/${classId}`), { totalAssignments: 1, totalExpectedSubmissions: 1 });
  tx.set(doc(d, `classes/${classId}/assignments/${assignmentId}`), {
    id: assignmentId, classId, title: 'BT1', completed: 0, avgScore: 0, total: 1, createdAt: serverTimestamp(),
    settings: { showScoreImmediate: true, shuffleQuestions: false },
    questions: questions.map(({ correctAnswer, ...q }) => q),
  });
  tx.set(doc(d, `classes/${classId}/answerKeys/${assignmentId}`), {
    questions: questions.map((q) => ({ id: q.id, type: q.type, correctAnswer: q.correctAnswer ?? null, points: q.points })),
  });
})));
await t('học sinh đọc được đề', () => assertSucceeds(getDoc(doc(db(stu.uid), `classes/${classId}/assignments/${assignmentId}`))));
await t('học sinh KHÔNG đọc được đáp án', () => assertFails(getDoc(doc(db(stu.uid), `classes/${classId}/answerKeys/${assignmentId}`))));
await t('giáo viên đọc được đáp án', () => assertSucceeds(getDoc(doc(db(teacher.uid), `classes/${classId}/answerKeys/${assignmentId}`))));
await t('học sinh KHÔNG tự ghi bài nộp', () => assertFails(setDoc(doc(db(stu.uid), `classes/${classId}/assignments/${assignmentId}/submissions/${stu.uid}`), { id: stu.uid, score: 10 })));
await t('học sinh KHÔNG tự tăng thống kê bài tập', () => assertFails(updateDoc(doc(db(stu.uid), `classes/${classId}/assignments/${assignmentId}`), { completed: 1, avgScore: 10 })));

await t('API nộp bài: thiếu token → 401', async () => {
  const r = await api('/api/assignments/submit', null, { classId, assignmentId, answers: {} });
  expect(r.status === 401, `status ${r.status}`);
});
await t('API nộp bài: người ngoài lớp → 403', async () => {
  const r = await api('/api/assignments/submit', outsider.token, { classId, assignmentId, answers: {} });
  expect(r.status === 403, `status ${r.status}`);
});
await t('API nộp bài: server chấm đúng (MC + checkbox + điền đúng, tự luận bỏ trống → 7,5)', async () => {
  const r = await api('/api/assignments/submit', stu.token, { classId, assignmentId, answers: { 1: 1, 2: [2, 1], 3: ' 4 ' } });
  expect(r.status === 200, `status ${r.status} ${JSON.stringify(r.data)}`);
  expect(r.data.score === 7.5, `score ${r.data.score}`);
});
await t('bài nộp lưu isCorrect + đáp án cho giáo viên chấm', async () => {
  const snap = await getDoc(doc(db(teacher.uid), `classes/${classId}/assignments/${assignmentId}/submissions/${stu.uid}`));
  const a = snap.data().answers;
  expect(snap.data().score === 7.5 && snap.data().studentName === 'An', 'score/name');
  expect(a[0].isCorrect === true && a[1].isCorrect === true && a[2].isCorrect === null && a[3].isCorrect === null, JSON.stringify(a.map((x) => x.isCorrect)));
  expect(a[0].correctAnswer === 1, 'correctAnswer');
});
await t('thống kê lớp/bài/học sinh được server cập nhật', async () => {
  const [c, as, u] = await admin(async (a) => Promise.all([
    getDoc(doc(a, `classes/${classId}`)), getDoc(doc(a, `classes/${classId}/assignments/${assignmentId}`)), getDoc(doc(a, `users/${stu.uid}`)),
  ]));
  expect(c.data().submitted === 1 && as.data().completed === 1 && as.data().scoreSum === 7.5 && u.data().totalCompletedAssignments === 1, 'counters');
});
await t('giáo viên nhận thông báo nộp bài', async () => {
  const s = await getDocs(query(collection(db(teacher.uid), 'notifications'), where('userId', '==', teacher.uid)));
  expect(s.docs.some((d) => d.data().type === 'submission'), 'no notification');
});
await t('API nộp bài: nộp lần 2 → 409', async () => {
  const r = await api('/api/assignments/submit', stu.token, { classId, assignmentId, answers: { 1: 1 } });
  expect(r.status === 409, `status ${r.status}`);
});
await t('giáo viên vẫn chấm tay được', () => assertSucceeds(setDoc(doc(db(teacher.uid), `classes/${classId}/assignments/${assignmentId}/submissions/${stu.uid}`), { score: 9, feedback: 'Tốt' }, { merge: true })));

// ---------- Bài học ----------
console.log('\nBài học');

const bank = JSON.parse(readFileSync('src/data/questions/grade5.json', 'utf8'));
const topics = [...new Set(bank.filter((q) => Number(q.grade) === 5).map((q) => q.topic))];
const topic = topics[0];
const lessonQs = bank.filter((q) => q.topic === topic).slice(0, 10);
const answersAllRight = lessonQs.map((q) => ({ questionId: q.id, answer: q.options[q.correctAnswer] }));
const answersHalf = lessonQs.map((q, i) => ({ questionId: q.id, answer: i < 5 ? q.options[q.correctAnswer] : 'sai' }));

await t('học sinh KHÔNG tự cộng điểm', () => assertFails(updateDoc(doc(db(stu.uid), `users/${stu.uid}`), { points: 99999 })));
await t('học sinh KHÔNG tự đánh dấu hoàn thành bài', () => assertFails(updateDoc(doc(db(stu.uid), `users/${stu.uid}`), { completedLessons: [1, 2, 3] })));
await t('học sinh vẫn sửa được hồ sơ', () => assertSucceeds(updateDoc(doc(db(stu.uid), `users/${stu.uid}`), { name: 'An Nguyễn', preferences: { darkMode: true } })));
await t('tài khoản mới KHÔNG tạo sẵn điểm', () => assertFails(setDoc(doc(db('newbie'), 'users/newbie'), { role: 'student', completedLessons: [1] })));
await t('API bài học: sai chủ đề → 400', async () => {
  const r = await api('/api/lessons/complete', stu.token, { lessonId: 1, topic: topics[1], answers: answersAllRight });
  expect(r.status === 400, `status ${r.status}`);
});
await t('API bài học: gửi thiếu câu → 400', async () => {
  const r = await api('/api/lessons/complete', stu.token, { lessonId: 1, topic, answers: answersAllRight.slice(0, 1) });
  expect(r.status === 400, `status ${r.status}`);
});
await t('API bài học: đúng 5/10 → 50% → +500 điểm', async () => {
  const r = await api('/api/lessons/complete', stu.token, { lessonId: 1, topic, answers: answersHalf });
  expect(r.status === 200 && r.data.score === 50 && r.data.pointsAwarded === 500, JSON.stringify(r.data));
});
await t('API bài học: làm lại bài đã xong → không cộng thêm', async () => {
  const r = await api('/api/lessons/complete', stu.token, { lessonId: 1, topic, answers: answersAllRight });
  expect(r.data.alreadyCompleted === true && r.data.pointsAwarded === 0, JSON.stringify(r.data));
  const u = await admin((a) => getDoc(doc(a, `users/${stu.uid}`)));
  expect(u.data().points === 500 && u.data().completedLessons.includes(1), `points ${u.data().points}`);
});

// ---------- Đấu toán ----------
console.log('\nĐấu toán');

const duelDoc = (id, extra = {}) => ({
  id, player1Id: stu.uid, player1Name: 'An', player2Id: stu2.uid, player2Name: 'Bình',
  player1Score: 0, player2Score: 0, player1Correct: 0, player2Correct: 0, player1Progress: 0, player2Progress: 0,
  player1TimeLeftAtFinish: null, player2TimeLeftAtFinish: null, status: 'playing', gameMode: 'quick', questions: null,
  createdAt: serverTimestamp(), startedAt: serverTimestamp(), ...extra,
});

await t('player1 tạo trận', () => assertSucceeds(setDoc(doc(db(stu.uid), 'activeDuels/d1'), duelDoc('d1'))));
await t('KHÔNG tạo trận với startedAt lùi về quá khứ', () => assertFails(setDoc(doc(db(stu.uid), 'activeDuels/d0'), duelDoc('d0', { startedAt: new Date(2020, 1, 1) }))));
await t('player2 cập nhật điểm của mình', () => assertSucceeds(updateDoc(doc(db(stu2.uid), 'activeDuels/d1'), { player2Score: 20, player2Progress: 2, player2Correct: 2 })));
await t('player2 KHÔNG sửa điểm đối thủ', () => assertFails(updateDoc(doc(db(stu2.uid), 'activeDuels/d1'), { player1Score: 50 })));
await t('người chơi KHÔNG tự kết thúc trận', () => assertFails(updateDoc(doc(db(stu.uid), 'activeDuels/d1'), { status: 'finished' })));
await t('KHÔNG tự ghi LP', () => assertFails(setDoc(doc(db(stu.uid), `userRanks/${stu.uid}`), { lp: 9999 })));
await t('KHÔNG tự ghi lịch sử trận', () => assertFails(setDoc(doc(db(stu.uid), 'duelMatches/x'), { player1Id: stu.uid })));
await t('API kết thúc: chưa hết giờ → 409', async () => {
  const r = await api('/api/duels/d1/finish', stu.token, {});
  expect(r.status === 409, `status ${r.status}`);
});
await t('API kết thúc: người ngoài → 403', async () => {
  const r = await api('/api/duels/d1/finish', outsider.token, {});
  expect(r.status === 403, `status ${r.status}`);
});
await t('API kết thúc: player1 đầu hàng → thua, player2 thắng', async () => {
  const r = await api('/api/duels/d1/finish', stu.token, { surrender: true });
  expect(r.status === 200 && r.data.outcome === 'lose' && r.data.lpChange < 0, JSON.stringify(r.data));
});
await t('API kết thúc: gọi lại (player2) trả đúng kết quả đã lưu, không tính LP lần 2', async () => {
  const r = await api('/api/duels/d1/finish', stu2.token, {});
  expect(r.data.outcome === 'win' && r.data.lpChange === 20, JSON.stringify(r.data));
  const r2 = await api('/api/duels/d1/finish', stu2.token, {});
  expect(r2.data.lpChange === 20, 'second');
  const rank = await getDoc(doc(db(stu2.uid), `userRanks/${stu2.uid}`));
  expect(rank.data().lp === 20 && rank.data().wins === 1, JSON.stringify(rank.data()));
  const loser = await getDoc(doc(db(stu.uid), `userRanks/${stu.uid}`));
  expect(loser.data().lp === 0 && loser.data().losses === 1, JSON.stringify(loser.data()));
});
await t('lịch sử trận lưu LP của từng người', async () => {
  const m = await getDoc(doc(db(stu.uid), 'duelMatches/d1'));
  expect(m.data().lpChanges[stu2.uid] === 20 && m.data().lpChanges[stu.uid] === -15, JSON.stringify(m.data().lpChanges));
});
await t('trận đã có kết quả thì KHÔNG sửa điểm được nữa', () => assertFails(updateDoc(doc(db(stu2.uid), 'activeDuels/d1'), { player2Score: 999 })));

await t('điểm tự báo bị giới hạn (1000 điểm/2 câu → 20) khi hết giờ', async () => {
  await admin((a) => setDoc(doc(a, 'activeDuels/d2'), {
    ...duelDoc('d2'), startedAt: new Date(Date.now() - 301_000), createdAt: new Date(Date.now() - 301_000),
    player1Score: 1000, player1Progress: 2, player2Score: 30, player2Progress: 3,
  }));
  const r = await api('/api/duels/d2/finish', stu.token, {});
  expect(r.data.myScore === 20 && r.data.opponentScore === 30 && r.data.outcome === 'lose', JSON.stringify(r.data));
});

// ---------- Đồng thời (nhiều request/transaction cùng lúc) ----------
console.log('\nĐồng thời');

const N = 30;
const crowd = await Promise.all(Array.from({ length: N }, (_, i) => signUp(`crowd${i}@test.dev`)));
await admin(async (a) => {
  for (const [i, u] of crowd.entries()) {
    await setDoc(doc(a, `users/${u.uid}`), { uid: u.uid, role: 'student', onboarded: true, points: 0, grade: 5, name: `HS${i}` });
  }
  await setDoc(doc(a, 'classes/big'), {
    id: 'big', name: 'Lớp đông', grade: 5, code: 'BIG001', teacherId: teacher.uid, studentIds: [], studentCount: 0,
    submitted: 0, totalAssignments: 1, totalExpectedSubmissions: N, avgScore: 0, isActive: true,
  });
  await setDoc(doc(a, 'classes/big/assignments/bt'), {
    id: 'bt', classId: 'big', title: 'Kiểm tra', completed: 0, avgScore: 0, total: N,
    settings: { showScoreImmediate: true }, questions: questions.map(({ correctAnswer, ...q }) => q),
  });
  await setDoc(doc(a, 'classes/big/answerKeys/bt'), {
    questions: questions.map((q) => ({ id: q.id, type: q.type, correctAnswer: q.correctAnswer ?? null, points: q.points })),
  });
});

await t(`${N} học sinh cùng vào lớp một lúc (transaction phía client) → đủ ${N} người`, async () => {
  // Giống joinClass trong classService: đọc thường rồi ghi batch arrayUnion + increment
  await Promise.all(crowd.map(async (u) => {
    const d = db(u.uid);
    const c = await getDoc(doc(d, 'classes/big'));
    if (c.data().studentIds.includes(u.uid)) return;
    const batch = writeBatch(d);
    batch.update(doc(d, 'classes/big'), { studentIds: arrayUnion(u.uid), studentCount: increment(1) });
    batch.set(doc(d, `users/${u.uid}`), { enrolledClasses: arrayUnion('big') }, { merge: true });
    await batch.commit();
  }));
  const c = await admin((a) => getDoc(doc(a, 'classes/big')));
  expect(c.data().studentIds.length === N && c.data().studentCount === N, `có ${c.data().studentIds.length}`);
});

await t(`${N} học sinh cùng nộp bài một lúc → không request nào lỗi, thống kê khớp`, async () => {
  // Nửa lớp làm đúng hết (10 điểm), nửa lớp bỏ trống (0 điểm) → trung bình 5
  const results = await Promise.all(crowd.map((u, i) =>
    api('/api/assignments/submit', u.token, { classId: 'big', assignmentId: 'bt', answers: i % 2 === 0 ? { 1: 1, 2: [1, 2], 3: '4' } : {} })));
  const failed = results.filter((r) => r.status !== 200);
  expect(failed.length === 0, `${failed.length} lỗi: ${JSON.stringify(failed[0]?.data)}`);
  const [as, c] = await admin((a) => Promise.all([getDoc(doc(a, 'classes/big/assignments/bt')), getDoc(doc(a, 'classes/big'))]));
  expect(as.data().completed === N && c.data().submitted === N, `completed=${as.data().completed} submitted=${c.data().submitted}`);
  expect(Math.abs(as.data().scoreSum / as.data().completed - 3.75) < 0.05, `avg=${as.data().scoreSum / as.data().completed}`);
});

await t('một học sinh bấm nộp 5 lần cùng lúc → chỉ 1 lần được ghi', async () => {
  await admin(async (a) => {
    await setDoc(doc(a, 'classes/big/assignments/bt2'), { id: 'bt2', classId: 'big', title: 'BT2', completed: 0, avgScore: 0, settings: {}, questions: [] });
  });
  const rs = await Promise.all(Array.from({ length: 5 }, () => api('/api/assignments/submit', crowd[0].token, { classId: 'big', assignmentId: 'bt2', answers: {} })));
  const ok = rs.filter((r) => r.status === 200).length;
  const as = await admin((a) => getDoc(doc(a, 'classes/big/assignments/bt2')));
  expect(ok === 1 && as.data().completed === 1, `ok=${ok} completed=${as.data().completed} statuses=${rs.map((r) => r.status)}`);
});

await t('gửi hoàn thành bài học 5 lần cùng lúc → chỉ cộng điểm 1 lần', async () => {
  const u = crowd[1];
  const rs = await Promise.all(Array.from({ length: 5 }, () => api('/api/lessons/complete', u.token, { lessonId: 2, topic, answers: answersAllRight })));
  const awarded = rs.filter((r) => r.data.pointsAwarded > 0).length;
  const user = await admin((a) => getDoc(doc(a, `users/${u.uid}`)));
  expect(awarded === 1 && user.data().points === 1000, `awarded=${awarded} points=${user.data().points} statuses=${rs.map((r) => r.status)}`);
});

await t('cả hai người chơi gọi kết thúc trận nhiều lần cùng lúc → LP chỉ tính 1 lần', async () => {
  const [p1, p2] = [crowd[2], crowd[3]];
  await admin((a) => setDoc(doc(a, 'activeDuels/race'), {
    ...duelDoc('race'), player1Id: p1.uid, player2Id: p2.uid,
    startedAt: new Date(Date.now() - 301_000), createdAt: new Date(Date.now() - 301_000),
    player1Score: 50, player1Progress: 5, player2Score: 10, player2Progress: 5,
  }));
  const rs = await Promise.all(Array.from({ length: 8 }, (_, i) => api('/api/duels/race/finish', (i % 2 ? p2 : p1).token, {})));
  const bad = rs.filter((r) => r.status !== 200);
  expect(bad.length === 0, `${bad.length} lỗi: ${JSON.stringify(bad[0]?.data)}`);
  const [r1, r2] = await admin((a) => Promise.all([getDoc(doc(a, `userRanks/${p1.uid}`)), getDoc(doc(a, `userRanks/${p2.uid}`))]));
  expect(r1.data().wins === 1 && r1.data().lp === 20 && r2.data().losses === 1, `p1=${JSON.stringify(r1.data())}`);
  expect(rs.every((r) => r.data.lpChange === (r.data.outcome === 'win' ? 20 : -15)), 'kết quả trả về không nhất quán');
});

await t('6 người cùng ghép trận một lúc → không ai bị ghép vào 2 trận', async () => {
  const players = crowd.slice(10, 16);
  await Promise.all(players.map((u) => setDoc(doc(db(u.uid), `duelQueue/${u.uid}`), {
    userId: u.uid, status: 'waiting', grade: 5, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })));
  // Giống vòng claim trong findOpponentForDuel: thử lần lượt từng đối thủ
  const pairs = [];
  await Promise.all(players.map(async (me) => {
    const d = db(me.uid);
    for (const opp of players) {
      if (opp.uid === me.uid) continue;
      try {
        const ok = await runTransaction(d, async (tx) => {
          const oppRef = doc(d, `duelQueue/${opp.uid}`);
          const myRef = doc(d, `duelQueue/${me.uid}`);
          const [o, m] = await Promise.all([tx.get(oppRef), tx.get(myRef)]);
          if (!o.exists() || !m.exists()) return false;
          tx.delete(oppRef);
          tx.delete(myRef);
          return true;
        });
        if (ok) { pairs.push([me.uid, opp.uid]); return; }
      } catch { /* hết lượt thử do tranh chấp: thử đối thủ khác */ }
    }
  }));
  const seen = pairs.flat();
  expect(new Set(seen).size === seen.length, `có người bị ghép 2 lần: ${JSON.stringify(pairs)}`);
  expect(pairs.length >= 1, 'không ghép được cặp nào');
});

// ---------- Kết thúc ----------

console.log(`\n${pass} passed, ${fail} failed`);
server.kill();
await env.cleanup();
process.exit(fail ? 1 : 0);
