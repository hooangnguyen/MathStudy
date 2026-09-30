/**
 * Chuyển đáp án của các bài tập tạo trước khi có answerKeys ra khỏi đề bài,
 * để học sinh không đọc được đáp án. Chạy một lần sau khi deploy:
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
  const questions: any[] = snap.data().questions || [];
  if (!questions.some((q) => "correctAnswer" in q)) continue;

  const classRef = snap.ref.parent.parent!;
  const keyRef = classRef.collection("answerKeys").doc(snap.id);
  const answerKey = questions.map((q) => ({
    id: q.id,
    type: q.type,
    correctAnswer: q.correctAnswer ?? null,
    points: q.points,
  }));
  const publicQuestions = questions.map(({ correctAnswer, ...rest }) => rest);

  console.log(`${dryRun ? "[dry-run] " : ""}${classRef.id}/${snap.id}: ${questions.length} câu`);
  if (!dryRun) {
    const batch = adminDb.batch();
    batch.set(keyRef, { questions: answerKey });
    batch.update(snap.ref, { questions: publicQuestions });
    await batch.commit();
  }
  migrated++;
}

console.log(`${dryRun ? "Sẽ chuyển" : "Đã chuyển"} ${migrated} bài tập.`);
