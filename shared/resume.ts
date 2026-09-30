/**
 * Tính trạng thái để khôi phục phòng/trận sau khi người chơi bị văng
 * (tải lại trang, mất mạng, chuyển tab). Hàm thuần, dùng chung và có unit test.
 */
import { DUEL_DURATION_SECONDS } from './duel';

type TimestampLike = { toMillis?: () => number } | null | undefined;
const toMillis = (t: TimestampLike, fallback: number) => t?.toMillis?.() ?? fallback;

export interface RoomLike {
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  timeLimit: number;
  currentPlayers: string[];
  participantProgress?: Record<string, { score: number; progress: number; finished: boolean }>;
  startedAt?: TimestampLike;
}

export type RoomResume =
  | { kind: 'gone' }
  | { kind: 'waiting' }
  | { kind: 'finished'; score: number }
  | { kind: 'playing'; currentQuestion: number; score: number; timeLeft: number };

export const resumeRoom = (room: RoomLike | null, uid: string, now: number): RoomResume => {
  if (!room || !room.currentPlayers.includes(uid)) return { kind: 'gone' };
  if (room.status === 'waiting') return { kind: 'waiting' };

  const progress = room.participantProgress?.[uid];
  const score = progress?.score ?? 0;
  if (room.status === 'finished' || progress?.finished) return { kind: 'finished', score };

  const elapsed = (now - toMillis(room.startedAt, now)) / 1000;
  const timeLeft = Math.ceil(room.timeLimit - elapsed);
  if (timeLeft <= 0) return { kind: 'finished', score };
  return { kind: 'playing', currentQuestion: progress?.progress ?? 0, score, timeLeft };
};

export interface QuickDuelLike {
  player1Id: string;
  player2Id: string;
  status: string;
  result?: unknown;
  startedAt?: TimestampLike;
  player1Score?: number;
  player2Score?: number;
  player1Progress?: number;
  player2Progress?: number;
  player1Correct?: number;
  player2Correct?: number;
  player1TimeLeftAtFinish?: number | null;
  player2TimeLeftAtFinish?: number | null;
}

export type QuickDuelResume =
  | { kind: 'gone' }
  | {
      kind: 'playing';
      isPlayer1: boolean;
      opponentId: string;
      score: number;
      opponentScore: number;
      progress: number;
      correct: number;
      finishedAll: boolean;
      /** Luôn ≥ 1: nếu đã hết giờ thì bộ đếm kết thúc ngay ở giây tiếp theo và gọi server chốt kết quả. */
      timeLeft: number;
    };

export const resumeQuickDuel = (duel: QuickDuelLike | null, uid: string, now: number): QuickDuelResume => {
  if (!duel || (duel.player1Id !== uid && duel.player2Id !== uid)) return { kind: 'gone' };
  if (duel.result || duel.status !== 'playing') return { kind: 'gone' };

  const isPlayer1 = duel.player1Id === uid;
  const elapsed = (now - toMillis(duel.startedAt, now)) / 1000;
  return {
    kind: 'playing',
    isPlayer1,
    opponentId: isPlayer1 ? duel.player2Id : duel.player1Id,
    score: (isPlayer1 ? duel.player1Score : duel.player2Score) ?? 0,
    opponentScore: (isPlayer1 ? duel.player2Score : duel.player1Score) ?? 0,
    progress: (isPlayer1 ? duel.player1Progress : duel.player2Progress) ?? 0,
    correct: (isPlayer1 ? duel.player1Correct : duel.player2Correct) ?? 0,
    finishedAll: (isPlayer1 ? duel.player1TimeLeftAtFinish : duel.player2TimeLeftAtFinish) != null,
    timeLeft: Math.max(1, Math.ceil(DUEL_DURATION_SECONDS - elapsed)),
  };
};
