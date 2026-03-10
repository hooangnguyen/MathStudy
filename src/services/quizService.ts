/**
 * Quiz lớp học - service riêng biệt với Đối kháng (MathDuel)
 * Giáo viên tạo phòng từ bản nháp, học sinh vào bằng mã phòng.
 */
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  createDuelRoom,
  joinDuelRoom,
  subscribeToRoom,
  startDuel,
  updateRoomProgress,
  leaveRoom,
  generateNumericRoomCode,
  DuelRoom
} from './duelService';
import type { DraftAssignmentData, QuestionData } from './assignmentService';

export interface QuizQuestion {
  question: string;
  answer: string;
  options: string[];
  type?: 'multiple_choice' | 'checkbox';
  correctIndices?: number[]; // For checkbox: array of correct option indices
}

function mapDraftToQuizQuestions(draft: DraftAssignmentData, grade: number): QuizQuestion[] {
  const result: QuizQuestion[] = [];

  for (const q of draft.questions) {
    if (q.type === 'multiple_choice') {
      const correctIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
      result.push({
        question: q.text,
        answer: (q.options[correctIndex] ?? '').trim(),
        options: q.options && q.options.length > 0 ? q.options : ['A', 'B', 'C', 'D'],
        type: 'multiple_choice'
      });
    } else if (q.type === 'checkbox') {
      const correctArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
      result.push({
        question: q.text,
        answer: '', // Not used for checkbox
        options: q.options && q.options.length > 0 ? q.options : ['A', 'B', 'C', 'D'],
        type: 'checkbox',
        correctIndices: correctArr.filter((i) => typeof i === 'number')
      });
    }
  }

  return result;
}

export interface QuizRoomData extends DuelRoom {
  quizQuestions?: string; // JSON string of QuizQuestion[]
}

/** Tạo phòng quiz từ bản nháp (chỉ giáo viên) */
export const createQuizRoom = async (
  hostId: string,
  hostName: string,
  draft: DraftAssignmentData,
  timeLimit: number,
  grade: number
): Promise<DuelRoom> => {
  const questions = mapDraftToQuizQuestions(draft, grade);
  if (questions.length === 0) {
    throw new Error('Đề này chưa có câu trắc nghiệm nào.');
  }

  const numericCode = generateNumericRoomCode();
  const room = await createDuelRoom(hostId, hostName, 'time', timeLimit, 60, numericCode);
  await updateDoc(doc(db, 'duelRooms', room.id), {
    quizQuestions: JSON.stringify(questions)
  });

  return { ...room, quizQuestions: JSON.stringify(questions) } as QuizRoomData;
};

export {
  joinDuelRoom as joinQuizRoom,
  subscribeToRoom as subscribeToQuizRoom,
  startDuel as startQuiz,
  updateRoomProgress as updateQuizProgress,
  leaveRoom as leaveQuizRoom
};

export const getQuizQuestionsFromRoom = (room: QuizRoomData | DuelRoom | null): QuizQuestion[] => {
  const q = (room as QuizRoomData)?.quizQuestions;
  if (!q) return [];
  try {
    return JSON.parse(q) as QuizQuestion[];
  } catch {
    return [];
  }
};
