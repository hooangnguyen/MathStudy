/** Quy tắc hạng/LP dùng chung cho client (hiển thị) và server (tính chính thức). */

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'challenger';

export const getRankTier = (lp: number): RankTier => {
  if (lp >= 1000) return 'challenger';
  if (lp >= 750) return 'diamond';
  if (lp >= 500) return 'platinum';
  if (lp >= 250) return 'gold';
  if (lp >= 100) return 'silver';
  return 'bronze';
};

/** LP người thắng nhận được, dựa trên chênh lệch LP với người thua. */
export const calculateLPChange = (winnerLP: number, loserLP: number, isDraw: boolean): number => {
  if (isDraw) return 5;

  let lpChange = 20;
  const lpDiff = winnerLP - loserLP;
  if (lpDiff < -200) {
    lpChange += 15; // thắng người hạng cao hơn nhiều
  } else if (lpDiff > 200) {
    lpChange -= 10; // thắng người hạng thấp hơn nhiều
  }
  return Math.max(5, Math.min(35, lpChange));
};
