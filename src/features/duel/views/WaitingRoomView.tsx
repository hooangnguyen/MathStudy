import React from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { cn } from '../../../utils/utils';
import { startDuel, leaveRoom } from '../../../services/duelService';
import { getRandomQuestions } from '../../../utils/duelQuestions';
import type { MathDuelController } from '../useMathDuel';

export const WaitingRoomView: React.FC<{ duel: MathDuelController }> = ({ duel }) => {
  const { user, userProfile, setState, roomId, setRoomId, roomCode, isHost, gameMode, roomPlayers, avatarMap } = duel;

  return (
    <motion.div
      key="waiting_room"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col p-6 items-center space-y-6"
    >
      <div className="w-full max-w-md bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center space-y-2">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Mã phòng của bạn</h2>
        <div className="text-5xl font-black tracking-widest text-indigo-600 bg-indigo-50 py-4 rounded-2xl border-2 border-dashed border-indigo-200">
          {roomCode}
        </div>
        <p className="text-xs font-bold text-slate-500 mt-2">Chia sẻ mã này cho các bạn để cùng tham gia nhé!</p>
      </div>

      <div className="w-full max-w-md flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-black text-slate-800">Người chơi ({roomPlayers.length})</h3>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Đang chờ...
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
          {roomPlayers.map((player) => (
            <div key={String(player.id)} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <img src={avatarMap[String(player.id)] || (player.isMe ? userProfile?.avatar : undefined) || player.avatar} alt={player.name} className="w-10 h-10 rounded-xl object-cover bg-slate-200" referrerPolicy="no-referrer" />
              <span className={cn("font-bold", player.isMe ? "text-indigo-600" : "text-slate-700")}>
                {player.name}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 shrink-0 space-y-3">
          {isHost ? (
            <button
              onClick={async () => {
                if (!roomId || roomPlayers.length < 2) return;
                const grade = userProfile?.grade || 5;
                const qList = await getRandomQuestions(grade, gameMode === 'time' ? 100 : 20);
                await startDuel(roomId, qList);
              }}
              disabled={roomPlayers.length < 2}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play fill="white" size={20} />
              BẮT ĐẦU NGAY
            </button>
          ) : (
            <div className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-sm text-center">
              Đang chờ chủ phòng bắt đầu...
            </div>
          )}
          <button
            onClick={async () => {
              if (roomId && user) {
                try { await leaveRoom(roomId, user.uid); } catch (_) { }
              }
              setRoomId(null);
              setState('lobby');
            }}
            className="w-full text-slate-400 font-bold text-sm hover:text-slate-600"
          >
            Rời phòng
          </button>
        </div>
      </div>
    </motion.div>
  );
};
