/** Một người chơi trong phòng quiz (không tính giáo viên chủ phòng). */
export interface QuizPlayer {
  id: string;
  name: string;
  /** Nhân vật đại diện "loài.màu.phụ-kiện"; trống → nhân vật mặc định theo id */
  character?: string;
  isMe: boolean;
  score?: number;
  progress?: number;
  offline?: boolean;
}
