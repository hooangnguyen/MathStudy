import type { QuizPlayer } from './types';

export interface RankedPlayer extends QuizPlayer {
  /** Hạng kiểu thi đấu: bằng điểm thì cùng hạng (1, 1, 3, ...) */
  rank: number;
}

/** Xếp hạng theo điểm giảm dần; bằng điểm thì cùng hạng, xếp tên theo ABC cho ổn định. */
export const rankPlayers = (players: QuizPlayer[]): RankedPlayer[] => {
  const sorted = [...players].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name, 'vi')
  );
  let rank = 0;
  return sorted.map((p, i) => {
    if (i === 0 || (p.score ?? 0) !== (sorted[i - 1].score ?? 0)) rank = i + 1;
    return { ...p, rank };
  });
};
