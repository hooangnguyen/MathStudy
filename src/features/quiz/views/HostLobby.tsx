import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Users, X } from 'lucide-react';
import { RoomInvite } from '../../rooms/RoomInvite';
import { Character } from '../../rooms/characters';
import type { QuizPlayer } from '../types';

/** Phòng chờ của giáo viên: mời học sinh (QR/link), xem nhân vật từng bạn vào, mời ra, bắt đầu. */
export const HostLobby: React.FC<{
  roomCode: string;
  quizTitle?: string;
  players: QuizPlayer[];
  onKick: (player: QuizPlayer) => void;
  onStart: () => void;
  onLeave: () => void;
}> = ({ roomCode, quizTitle, players, onKick, onStart, onLeave }) => (
  <div className="flex-1 flex flex-col p-4 sm:p-6 gap-4">
    <RoomInvite
      code={roomCode}
      title={quizTitle}
      playerCount={players.length}
      presentable
      presenterExtra={players.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 max-w-5xl">
          <AnimatePresence>
            {players.slice(-24).map((p) => (
              <motion.div
                key={p.id}
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-white/15"
              >
                <Character value={p.character} uid={p.id} className="w-11 h-11" />
                <span className="text-lg font-bold max-w-[10rem] truncate">{p.name}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    />

    <section className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-slate-800 flex items-center gap-2">
          <Users size={20} className="text-indigo-500" />
          Đã tham gia ({players.length})
        </h3>
        <div className="flex items-center gap-1.5 text-emerald-600">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold">Đang chờ</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar -mx-1 px-1">
        {players.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Users size={44} className="mx-auto mb-3 opacity-40" />
            <p className="font-bold">Chưa có học sinh nào</p>
            <p className="text-sm mt-1">Học sinh quét mã QR hoặc nhập mã phòng để vào</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <AnimatePresence>
              {players.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                  className="relative flex flex-col items-center p-2 pt-3 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <button
                    onClick={() => onKick(p)}
                    aria-label={`Mời ${p.name} ra khỏi phòng`}
                    title="Mời ra khỏi phòng"
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shadow-sm"
                  >
                    <X size={15} />
                  </button>
                  <Character value={p.character} uid={p.id} className="w-16 h-16" />
                  <span className="mt-1 text-sm font-bold text-slate-800 max-w-full truncate">{p.name}</span>
                  {p.offline && <span className="text-[11px] font-bold text-rose-500">Mất kết nối</span>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <button
        onClick={onStart}
        disabled={players.length < 1}
        className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-indigo-700 transition-all"
      >
        <Play size={24} fill="white" />
        BẮT ĐẦU QUIZ
      </button>
      <button onClick={onLeave} className="w-full mt-2 text-slate-500 font-bold text-sm hover:text-slate-700 py-2">
        Rời phòng
      </button>
    </section>
  </div>
);
