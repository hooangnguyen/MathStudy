/**
 * Ghi nhớ phòng/trận người dùng đang tham gia để khôi phục khi tải lại trang,
 * mở lại app hoặc quay lại tab (trạng thái React bị mất trong các trường hợp đó).
 */
export type ActiveSessionKind = 'duel-room' | 'quiz-room' | 'quick-duel';

interface ActiveSession {
  kind: ActiveSessionKind;
  id: string;
  savedAt: number;
}

// Phòng/trận cũ hơn mức này coi như đã kết thúc
const MAX_AGE_MS = 3 * 60 * 60 * 1000;
const keyFor = (uid: string) => `ms_active_session_${uid}`;

export const saveActiveSession = (uid: string, kind: ActiveSessionKind, id: string) => {
  try {
    localStorage.setItem(keyFor(uid), JSON.stringify({ kind, id, savedAt: Date.now() }));
  } catch { /* bộ nhớ trình duyệt bị chặn: bỏ qua, chỉ mất khả năng khôi phục */ }
};

export const loadActiveSession = (uid: string, kind: ActiveSessionKind): ActiveSession | null => {
  try {
    const raw = localStorage.getItem(keyFor(uid));
    if (!raw) return null;
    const session = JSON.parse(raw) as ActiveSession;
    if (session.kind !== kind || Date.now() - session.savedAt > MAX_AGE_MS) return null;
    return session;
  } catch {
    return null;
  }
};

/** Xoá phiên đã lưu; truyền `kind` để chỉ xoá nếu đúng loại (tránh xoá phiên của màn khác). */
export const clearActiveSession = (uid: string, kind?: ActiveSessionKind) => {
  try {
    if (kind) {
      const raw = localStorage.getItem(keyFor(uid));
      if (raw && JSON.parse(raw).kind !== kind) return;
    }
    localStorage.removeItem(keyFor(uid));
  } catch { /* ignore */ }
};
