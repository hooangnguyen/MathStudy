import { useEffect } from 'react';
import { heartbeatRoom } from './duelService';
import { HEARTBEAT_INTERVAL_MS } from '../../../shared/presence';

/**
 * Gửi tín hiệu "còn kết nối" cho phòng khi đang ở màn hình phòng: định kỳ, và ngay khi
 * quay lại tab (trình duyệt làm chậm bộ đếm giờ của tab chạy nền).
 */
export const useRoomPresence = (roomId: string | null, userId: string | undefined, active: boolean) => {
  useEffect(() => {
    if (!roomId || !userId || !active) return;
    const beat = () => {
      if (document.visibilityState === 'visible') heartbeatRoom(roomId, userId).catch(() => { });
    };
    beat();
    const timer = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener('visibilitychange', beat);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', beat);
    };
  }, [roomId, userId, active]);
};
