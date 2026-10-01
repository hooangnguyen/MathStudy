/**
 * Chuyển đáp án của các bài tập tạo trước khi có answerKeys ra khỏi đề bài
 * (để học sinh không đọc được đáp án) và bổ sung scoreSum cho bài cũ. Chạy một lần sau khi deploy:
 *
 *   FIREBASE_SERVICE_ACCOUNT='<json>' npx tsx scripts/migrate-answer-keys.ts
 *
 * Thêm --dry-run để chỉ xem sẽ đổi những bài nào.
 */
import { adminDb, adminReady } from "../server/firebaseAdmin";

const dryRun = process.argv.includes("--dry-run");

if (!adminReady) {
  console.error("Cần FIREBASE_SERVICE_ACCOUNT (hoặc GOOGLE_APPLICATION_CREDENTIALS) để chạy script.");
  process.exit(1);
}

const assignments = await adminDb.collectionGroup("assignments").get();
let migrated = 0;

for (const snap of assignments.docs) {
  const data = snap.data();
  const questions: any[] = data.questions || [];
  // Bài cũ chưa có scoreSum: tính từ điểm trung bình đã lưu để điểm TB vẫn đúng
  const needsScoreSum = data.scoreSum === undefined && (data.completed || 0) > 0;
  const needsKey = questions.some((q) => "correctAnswer" in q);
  if (!needsKey && !needsScoreSum) continue;

  const classRef = snap.ref.parent.parent!;
  const keyRef = classRef.collection("answerKeys").doc(snap.id);
  const answerKey = questions.map((q) => ({
    id: q.id,
    type: q.type,
    correctAnswer: q.correctAnswer ?? null,
    points: q.points,
  }));
  const publicQuestions = questions.map(({ correctAnswer, ...rest }) => rest);

  console.log(`${dryRun ? "[dry-run] " : ""}${classRef.id}/${snap.id}: ${needsKey ? `tách đáp án ${questions.length} câu` : ""}${needsScoreSum ? " + scoreSum" : ""}`);
  if (!dryRun) {
    const batch = adminDb.batch();
    if (needsKey) {
      batch.set(keyRef, { questions: answerKey });
      batch.update(snap.ref, { questions: publicQuestions });
    }
    if (needsScoreSum) {
      batch.update(snap.ref, { scoreSum: (data.avgScore || 0) * (data.completed || 0) });
    }
    await batch.commit();
  }
  migrated++;
}

console.log(`${dryRun ? "Sẽ chuyển" : "Đã chuyển"} ${migrated} bài tập.`);
