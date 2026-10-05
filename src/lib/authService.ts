import { auth } from './firebase';

export const sendOTP = async (email: string) => {
    const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    return response.json();
};

export const verifyOTP = async (email: string, otp: string) => {
    const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
    });
    return response.json();
};

/**
 * Header chứa Firebase ID token của người dùng hiện tại.
 * Server yêu cầu header này cho các API cần đăng nhập (ví dụ /api/ai/*).
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await auth.currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};
