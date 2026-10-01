/** Luật tính kết quả trận đấu nhanh (1v1), dùng chung client/server. */

export const DUEL_DURATION_SECONDS = 300;
export const POINTS_CORRECT = 10;
export const POINTS_WRONG = -5;

/**
 * Giới hạn điểm người chơi tự báo về mức có thể đạt được:
 * tối đa 10 điểm/câu đã làm, và không nhanh hơn 1 câu mỗi giây.
 */
export const clampDuelScore = (score: unknown, progress: unknown, elapsedSeconds: number): number => {
  const s = Math.max(0, Math.floor(Number(score) || 0));
  const p = Math.max(0, Math.floor(Number(progress) || 0));
  const maxByProgress = p * POINTS_CORRECT;
  const maxByTime = Math.max(0, Math.floor(elapsedSeconds)) * POINTS_CORRECT;
  return Math.min(s, maxByProgress, maxByTime);
};

export type DuelOutcome = { winnerId: string | null; isDraw: boolean };

export const decideDuelOutcome = (
  player1Id: string,
  player2Id: string,
  score1: number,
  score2: number,
  surrenderedBy?: string | null
): DuelOutcome => {
  if (surrenderedBy === player1Id) return { winnerId: player2Id, isDraw: false };
  if (surrenderedBy === player2Id) return { winnerId: player1Id, isDraw: false };
  if (score1 === score2) return { winnerId: null, isDraw: true };
  return { winnerId: score1 > score2 ? player1Id : player2Id, isDraw: false };
};
