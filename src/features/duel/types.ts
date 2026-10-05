export type DuelState = 'lobby' | 'searching' | 'playing' | 'result' | 'leaderboard' | 'create_room' | 'join_room' | 'waiting_room' | 'room_playing' | 'room_result';

export interface MathDuelProps {
  userRole?: 'student' | 'teacher' | null;
  initialState?: DuelState;
  onDuelStateChange?: (state: DuelState) => void;
  onExitDuel?: () => void;
  exitDuelToken?: number;
  onNavigate?: (tab: string) => void;
}

export interface RoomPlayer {
  id: number | string;
  name: string;
  avatar: string;
  isMe: boolean;
  offline?: boolean; // mất kết nối (không có tín hiệu quá 90 giây)
  score?: number;
  progress?: number;
}
