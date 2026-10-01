/**
 * Theo dõi ai còn kết nối trong phòng dựa trên tín hiệu định kỳ (lastSeen) mỗi người tự ghi.
 * So sánh với tín hiệu mới nhất trong phòng (không dùng giờ máy người dùng),
 * nên không bị sai khi đồng hồ điện thoại lệch.
 */

export const HEARTBEAT_INTERVAL_MS = 15_000;
/** Quá thời gian này không có tín hiệu thì coi là mất kết nối. */
export const STALE_AFTER_MS = 90_000;

type TimestampLike = { toMillis?: () => number } | null | undefined;

/**
 * Danh sách người chơi mất kết nối.
 * Người chưa có tín hiệu nào (phòng tạo bằng bản cũ) hoặc tín hiệu đang chờ server xác nhận
 * được coi là còn kết nối.
 */
export const findStalePlayers = (
  players: string[],
  lastSeen: Record<string, TimestampLike> | undefined
): string[] => {
  const seen = new Map<string, number>();
  for (const uid of players) {
    const ms = lastSeen?.[uid]?.toMillis?.();
    if (typeof ms === 'number') seen.set(uid, ms);
  }
  if (seen.size === 0) return [];
  const newest = Math.max(...seen.values());
  return players.filter((uid) => seen.has(uid) && newest - seen.get(uid)! > STALE_AFTER_MS);
};
