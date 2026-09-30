import { Router } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import { handle, HttpError } from "./http";
import { gradeAssignment, type AnswerKeyItem } from "../shared/grading";

export const assignmentsRouter = Router();

/**
 * Học sinh nộp bài. Server tự chấm theo đáp án (học sinh không đọc được đáp án),
 * lưu bài nộp và cập nhật thống kê trong cùng một transaction.
 */
assignmentsRouter.post(
  "/submit",
  handle(async (req, res) => {
    const uid = req.uid!;
    const { classId, assignmentId, answers } = req.body ?? {};
    if (typeof classId !== "string" || typeof assignmentId !== "string" || !classId || !assignmentId) {
      throw new HttpError(400, "Thiếu thông tin bài tập");
    }
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      throw new HttpError(400, "Bài làm không hợp lệ");
    }

    const classRef = adminDb.doc(`classes/${classId}`);
    const assignmentRef = classRef.collection("assignments").doc(assignmentId);
    const answerKeyRef = classRef.collection("answerKeys").doc(assignmentId);
    const submissionRef = assignmentRef.collection("submissions").doc(uid);
    const userRef = adminDb.doc(`users/${uid}`);

    const result = await adminDb.runTransaction(async (tx) => {
      const [classDoc, assignmentDoc, answerKeyDoc, submissionDoc, userDoc] = await Promise.all([
        tx.get(classRef),
        tx.get(assignmentRef),
        tx.get(answerKeyRef),
        tx.get(submissionRef),
        tx.get(userRef),
      ]);

      if (!classDoc.exists) throw new HttpError(404, "Lớp không tồn tại");
      const classData = classDoc.data()!;
      if (!(classData.studentIds || []).includes(uid)) throw new HttpError(403, "Bạn không thuộc lớp này");
      if (!assignmentDoc.exists) throw new HttpError(404, "Bài tập không tồn tại");
      if (submissionDoc.exists) throw new HttpError(409, "Bạn đã nộp bài này rồi");

      const assignment = assignmentDoc.data()!;
      const questions: any[] = assignment.questions || [];
      // Bài tập tạo trước khi tách đáp án vẫn lưu correctAnswer trong đề
      const key: AnswerKeyItem[] = answerKeyDoc.exists ? answerKeyDoc.data()!.questions || [] : questions;
      const keyById = new Map(key.map((k) => [String(k.id), k]));

      const { score, results } = gradeAssignment(key, answers);
      const correctById = new Map(results.map((r) => [String(r.questionId), r.isCorrect]));

      const formattedAnswers = questions.map((q) => ({
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        options: q.options ?? null,
        correctAnswer: keyById.get(String(q.id))?.correctAnswer ?? null,
        answer: answers[String(q.id)] ?? null,
        isCorrect: correctById.get(String(q.id)) ?? null,
      }));

      const studentName = userDoc.data()?.name || "Học sinh ẩn danh";
      const oldCompleted = assignment.completed || 0;
      const newCompleted = oldCompleted + 1;
      const newAvg = Number(((((assignment.avgScore || 0) * oldCompleted) + score) / newCompleted).toFixed(1));

      tx.set(submissionRef, {
        id: uid,
        studentName,
        score,
        answers: formattedAnswers,
        submittedAt: FieldValue.serverTimestamp(),
      });
      tx.update(assignmentRef, { completed: newCompleted, avgScore: newAvg });
      tx.update(classRef, { submitted: FieldValue.increment(1) });
      if (userDoc.exists) tx.update(userRef, { totalCompletedAssignments: FieldValue.increment(1) });

      if (classData.teacherId) {
        const notifRef = adminDb.collection("notifications").doc();
        tx.set(notifRef, {
          id: notifRef.id,
          userId: classData.teacherId,
          type: "submission",
          title: "Nộp bài mới",
          message: `Học sinh ${studentName} vừa nộp bài cho "${assignment.title}"`,
          metadata: { classId, assignmentId, studentId: uid },
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      return { score, showScore: !!assignment.settings?.showScoreImmediate };
    });

    res.json({ success: true, showScore: result.showScore, score: result.showScore ? result.score : undefined });
  })
);
