/** Tên của khách (vào phòng không cần tài khoản), nhớ trên máy để lần sau điền sẵn. */

const NAME_KEY = 'ms_guest_name';
export const GUEST_NAME_MAX = 20;

export const loadGuestName = (): string => {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};

export const saveGuestName = (name: string) => {
  try {
    localStorage.setItem(NAME_KEY, name.trim().slice(0, GUEST_NAME_MAX));
  } catch {
    /* bỏ qua */
  }
};
