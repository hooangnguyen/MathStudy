import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Palette, Play } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { startDuel } from '../duelService';
import { getRandomQuestions } from '../duelQuestions';
import type { MathDuelController } from '../useMathDuel';
import { RoomInvite } from '../../rooms/RoomInvite';
import { CharacterDialog } from '../../rooms/CharacterDialog';
import { Character, parseCharacter } from '../../rooms/characters';

export const WaitingRoomView: React.FC<{ duel: MathDuelController }> = ({ duel }) => {
  const { userProfile, user, roomId, roomCode, isHost, gameMode, roomPlayers, hostOffline, leaveCurrentRoom, changeCharacter } = duel;
  const [editing, setEditing] = useState(false);
  const me = roomPlayers.find((p) => p.isMe);
  const opponent = roomPlayers.find((p) => !p.isMe);

  return (
    <motion.div
      key="waiting_room"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col p-6 items-center space-y-6"
    >
      <div className="w-full max-w-md">
        <RoomInvite code={roomCode} playerCount={roomPlayers.length} />
      </div>

      <div className="w-full max-w-md flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-black text-slate-800">Người chơi ({roomPlayers.length})</h3>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Đang chờ...
          </div>
        </div>

        {/* 1 đấu 1: hai nhân vật đứng đối mặt */}
        <div className="flex-1 flex items-center justify-center gap-2 py-2">
          {[me, opponent].map((player, i) => (
            <React.Fragment key={i}>
              {i === 1 && (
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-white font-black text-lg flex items-center justify-center shadow-lg"
                >
                  VS
                </motion.span>
              )}
              <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                {player ? (
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
                    <Character value={player.character} uid={String(player.id)} className={cn('w-24 h-24', i === 1 && '-scale-x-100')} />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="w-24 h-24 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center text-4xl font-black text-slate-300"
                  >
                    ?
                  </motion.div>
                )}
                <span className={cn('mt-1 font-bold max-w-full truncate', player?.isMe ? 'text-indigo-600' : 'text-slate-700')}>
                  {player ? player.name : 'Chờ bạn...'}
                </span>
                {player?.offline && <span className="text-[11px] font-bold text-rose-500">Mất kết nối</span>}
                {player?.isMe && (
                  <button onClick={() => setEditing(true)} aria-label="Đổi nhân vật" className="mt-1 h-9 px-3 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold flex items-center gap-1.5 whitespace-nowrap">
                    <Palette size={15} /> Đổi
                  </button>
                )}
              </div>
            </React.Fragment>
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
          {hostOffline && (
            <div className="w-full bg-amber-50 text-amber-700 py-3 px-4 rounded-2xl font-bold text-xs text-center">
              Chủ phòng đang mất kết nối. Bạn có thể chờ thêm hoặc rời phòng.
            </div>
          )}
          <button
            onClick={leaveCurrentRoom}
            className="w-full text-slate-400 font-bold text-sm hover:text-slate-600"
          >
            Rời phòng
          </button>
        </div>
      </div>
      {editing && (
        <CharacterDialog
          initial={parseCharacter(me?.character, user?.uid)}
          onSave={changeCharacter}
          onClose={() => setEditing(false)}
        />
      )}
    </motion.div>
  );
};
