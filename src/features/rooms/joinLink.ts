/**
 * Link mời vào phòng: <trang web>/join/<mã>.
 * - Mã 6 chữ số → phòng quiz lớp, mã có chữ cái → phòng đấu.
 * - Mở link khi chưa đăng nhập: mã được giữ lại, đăng nhập xong sẽ tự vào phòng.
 */

const PENDING_KEY = 'ms_pending_join';
const CODE_RE = /^[A-Za-z0-9]{6}$/;

export type RoomKind = 'quiz' | 'duel';

export const roomKindOf = (code: string): RoomKind => (/^\d{6}$/.test(code) ? 'quiz' : 'duel');

/** Chuẩn hoá mã gõ tay hoặc dán cả link (vd. "https://.../join/123456" → "123456"). */
export const normalizeRoomCode = (raw: string): string => {
  const text = raw.trim();
  const fromLink = text.match(/\/join\/([A-Za-z0-9]+)/) || text.match(/[?&]join=([A-Za-z0-9]+)/);
  const code = (fromLink ? fromLink[1] : text).replace(/[^A-Za-z0-9]/g, '').slice(0, 6);
  return /^\d+$/.test(code) ? code : code.toUpperCase();
};

export const buildJoinUrl = (code: string): string => `${window.location.origin}/join/${code}`;

/** Địa chỉ ngắn để đọc to hoặc chiếu lên màn hình (không có https://). */
export const displayJoinUrl = (code: string): string => `${window.location.host}/join/${code}`;

const readPending = (): string | null => {
  try {
    return sessionStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
};

/**
 * Đọc mã phòng từ địa chỉ trang (/join/<mã> hoặc ?join=<mã>) khi mở app, lưu lại để dùng sau khi đăng nhập
 * và đưa địa chỉ về "/" để tải lại trang không vào phòng lần nữa.
 */
export const captureJoinCodeFromUrl = (): string | null => {
  const { pathname, search } = window.location;
  const match = pathname.match(/^\/join\/([^/]+)\/?$/);
  const raw = match ? decodeURIComponent(match[1]) : new URLSearchParams(search).get('join');
  if (raw === null && !match) return readPending();

  const code = normalizeRoomCode(raw ?? '');
  window.history.replaceState(null, '', '/');
  if (!CODE_RE.test(code)) return readPending();
  try {
    sessionStorage.setItem(PENDING_KEY, code);
  } catch {
    /* trình duyệt chặn storage: vẫn dùng được trong lần mở này */
  }
  return code;
};

export const getPendingJoinCode = (): string | null => readPending();

export const clearPendingJoinCode = () => {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* bỏ qua */
  }
};
