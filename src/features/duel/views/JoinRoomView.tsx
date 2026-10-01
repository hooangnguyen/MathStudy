import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import type { MathDuelController } from '../useMathDuel';

export const JoinRoomView: React.FC<{ duel: MathDuelController }> = ({ duel }) => {
  const { setState, roomCode, setRoomCode, handleJoinRoom } = duel;

  return (
    <motion.div
      key="join_room"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col p-6 items-center justify-center"
    >
      <div className="w-full max-w-sm bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">Vào phòng</h2>
          <button onClick={() => setState('lobby')} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2 text-center">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nhập mã phòng</label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="VD: A1B2C3"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-center text-slate-800 outline-none focus:border-primary uppercase tracking-widest"
            maxLength={6}
          />
        </div>

        <button
          onClick={handleJoinRoom}
          disabled={roomCode.length !== 6}
          className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          VÀO PHÒNG
        </button>
      </div>
    </motion.div>
  );
};
