export type DuelState = 'lobby' | 'searching' | 'playing' | 'result' | 'leaderboard' | 'create_room' | 'join_room' | 'waiting_room' | 'room_playing' | 'room_result';

export interface MathDuelProps {
  userRole?: 'student' | 'teacher' | null;
  initialState?: DuelState;
  onDuelStateChange?: (state: DuelState) => void;
  onExitDuel?: () => void;
  exitDuelToken?: number;
  onNavigate?: (tab: string) => void;
  /** Mã phòng lấy từ link /join/<mã>: tự vào phòng khi mở màn hình */
  autoJoinCode?: string | null;
  onAutoJoinHandled?: () => void;
}

export interface RoomPlayer {
  id: number | string;
  name: string;
  avatar: string;
  /** Nhân vật đại diện trong phòng ("loài.màu.phụ-kiện") */
  character?: string;
  isMe: boolean;
  offline?: boolean; // mất kết nối (không có tín hiệu quá 90 giây)
  score?: number;
  progress?: number;
}
