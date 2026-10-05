import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Mã ngẫu nhiên đúng `length` ký tự. (Cách cũ `Math.random().toString(36).substring(2, 8)`
 * đôi khi cho ra mã ngắn hơn 6 ký tự, khiến không ai nhập được mã để vào phòng/lớp.)
 * Bỏ các ký tự dễ nhầm (0/O, 1/I/L) khi đọc mã cho cả lớp.
 */
export const randomCode = (length = 6, alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'): string => {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => alphabet[v % alphabet.length]).join('');
};
