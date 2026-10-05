import { Router } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import { handle, HttpError } from "./http";
import { getQuestionBank } from "./questionBank";
import {
  QUESTIONS_PER_LESSON,
  getLessonTopics,
  isLessonAnswerCorrect,
  lessonPoints,
  topicForLesson,
} from "../shared/lesson";

export const lessonsRouter = Router();

/**
 * Hoàn thành một bài học. Server chấm lượt trả lời đầu tiên của từng câu theo
 * ngân hàng câu hỏi và cộng điểm — mỗi bài chỉ được cộng một lần.
 */
lessonsRouter.post(
  "/complete",
  handle(async (req, res) => {
    const uid = req.uid!;
    const { lessonId, topic, answers } = req.body ?? {};
    if (!Number.isInteger(lessonId) || lessonId < 1 || typeof topic !== "string") {
      throw new HttpError(400, "Bài học không hợp lệ");
    }
    if (!Array.isArray(answers) || answers.length === 0 || answers.length > QUESTIONS_PER_LESSON) {
      throw new HttpError(400, "Bài làm không hợp lệ");
    }

    const userRef = adminDb.doc(`users/${uid}`);
    const result = await adminDb.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) throw new HttpError(404, "Không tìm thấy tài khoản");
      const user = userDoc.data()!;
      if ((user.completedLessons || []).includes(lessonId)) {
        return { score: null, pointsAwarded: 0, alreadyCompleted: true };
      }

      const grade = Number(user.grade) || 1;
      const bank = getQuestionBank(grade);
      if (topicForLesson(getLessonTopics(bank, grade), lessonId) !== topic) {
        throw new HttpError(400, "Bài học không thuộc chủ đề này");
      }

      const topicQuestions = new Map(bank.filter((q) => q.topic === topic).map((q) => [q.id, q]));
      const expectedCount = Math.min(QUESTIONS_PER_LESSON, topicQuestions.size);
      const ids = new Set(answers.map((a: any) => a?.questionId));
      if (answers.length !== expectedCount || ids.size !== answers.length) {
        throw new HttpError(400, "Số câu trả lời không khớp với bài học");
      }

      let correct = 0;
      for (const a of answers) {
        const q = topicQuestions.get(a?.questionId);
        if (!q) throw new HttpError(400, "Câu hỏi không thuộc bài học");
        if (isLessonAnswerCorrect(q, a.answer)) correct++;
      }

      const score = Math.round((correct / answers.length) * 100);
      const pointsAwarded = lessonPoints(score);
      tx.update(userRef, {
        completedLessons: FieldValue.arrayUnion(lessonId),
        points: FieldValue.increment(pointsAwarded),
        lastActive: FieldValue.serverTimestamp(),
      });
      return { score, pointsAwarded, alreadyCompleted: false };
    });

    res.json({ success: true, ...result });
  })
);
