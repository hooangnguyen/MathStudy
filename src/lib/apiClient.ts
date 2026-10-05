import { getAuthHeaders } from './authService';

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

/** POST JSON tới API của server kèm ID token; ném ApiError nếu server báo lỗi. */
export const postApi = async <T = any>(path: string, body: unknown): Promise<T> => {
    const response = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(await getAuthHeaders()),
        },
        body: JSON.stringify(body ?? {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
        throw new ApiError(response.status, data.error || 'Không kết nối được máy chủ, vui lòng thử lại.');
    }
    return data as T;
};
