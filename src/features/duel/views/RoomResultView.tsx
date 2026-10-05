import React from 'react';
import { motion } from 'motion/react';
import { Crown } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { cn } from '../../../lib/utils';
import type { MathDuelController } from '../useMathDuel';

export const RoomResultView: React.FC<{ duel: MathDuelController }> = ({ duel }) => {
  const { userProfile, setState, roomId, roomCode, isHost, roomResults, avatarMap } = duel;

  return (
    <motion.div
      key="room_result"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center p-6 space-y-8 overflow-y-auto no-scrollbar"
    >
      <div className="text-center space-y-2 mt-4">
        <h2 className="text-3xl font-black tracking-tight text-slate-800">
          KẾT QUẢ TRẬN ĐẤU
        </h2>
        <p className="text-slate-500 font-bold">
          Phòng: {roomCode}
        </p>
      </div>

      {/* Podium for Top 3 */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 h-48 mt-8 mb-4">
        {/* Top 2 */}
        {roomResults[1] && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-2">
              <img src={avatarMap[String(roomResults[1].id)] || (roomResults[1].isMe ? userProfile?.avatar : undefined) || roomResults[1].avatar} alt="" className="w-14 h-14 rounded-full border-4 border-slate-300 object-cover bg-slate-200" referrerPolicy="no-referrer" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-white">2</div>
            </div>
            <div className="w-20 h-24 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-2xl flex flex-col items-center justify-start pt-4 border-x border-t border-slate-300/50 shadow-inner">
              <span className="font-black text-slate-500">{roomResults[1].score}</span>
            </div>
            <span className="text-xs font-bold text-slate-600 mt-2 truncate w-20 text-center">{roomResults[1].name}</span>
          </motion.div>
        )}

        {/* Top 1 */}
        {roomResults[0] && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center z-10"
          >
            <div className="relative mb-2">
              <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500" size={28} />
              <img src={avatarMap[String(roomResults[0].id)] || (roomResults[0].isMe ? userProfile?.avatar : undefined) || roomResults[0].avatar} alt="" className="w-16 h-16 rounded-full border-4 border-yellow-400 object-cover bg-slate-200" referrerPolicy="no-referrer" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-white">1</div>
            </div>
            <div className="w-24 h-32 bg-gradient-to-t from-yellow-200 to-yellow-100 rounded-t-2xl flex flex-col items-center justify-start pt-4 border-x border-t border-yellow-300/50 shadow-inner">
              <span className="font-black text-yellow-700">{roomResults[0].score}</span>
            </div>
            <span className="text-xs font-black text-yellow-600 mt-2 truncate w-24 text-center">{roomResults[0].name}</span>
          </motion.div>
        )}

        {/* Top 3 */}
        {roomResults[2] && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-2">
              <img src={avatarMap[String(roomResults[2].id)] || (roomResults[2].isMe ? userProfile?.avatar : undefined) || roomResults[2].avatar} alt="" className="w-14 h-14 rounded-full border-4 border-amber-600 object-cover bg-slate-200" referrerPolicy="no-referrer" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-white">3</div>
            </div>
            <div className="w-20 h-20 bg-gradient-to-t from-amber-200/50 to-amber-100/50 rounded-t-2xl flex flex-col items-center justify-start pt-4 border-x border-t border-amber-300/50 shadow-inner">
              <span className="font-black text-amber-700">{roomResults[2].score}</span>
            </div>
            <span className="text-xs font-bold text-slate-600 mt-2 truncate w-20 text-center">{roomResults[2].name}</span>
          </motion.div>
        )}
      </div>

      {/* Other players list */}
      <div className="w-full max-w-md space-y-2">
        {roomResults.slice(3).map((player, index) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            key={player.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl border",
              player.isMe ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100"
            )}
          >
            <div className="flex items-center gap-4">
              <span className="font-black text-slate-400 w-4 text-center">{index + 4}</span>
              <img src={avatarMap[String(player.id)] || (player.isMe ? userProfile?.avatar : undefined) || player.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-200" referrerPolicy="no-referrer" />
              <span className={cn("font-bold", player.isMe ? "text-indigo-700" : "text-slate-700")}>
                {player.name}
              </span>
            </div>
            <span className={cn("font-black", player.isMe ? "text-indigo-600" : "text-slate-500")}>
              {player.score}
            </span>
          </motion.div>
        ))}
      </div>

      <button
        onClick={async () => {
          if (isHost && roomId) {
            try {
              await updateDoc(doc(db, 'duelRooms', roomId), {
                status: 'waiting',
                participantProgress: {},
                roomQuestions: null
              });
            } catch (e) {}
          }
          setState('waiting_room');
        }}
        className="w-full max-w-md bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-transform mt-4"
      >
        VỀ PHÒNG CHỜ
      </button>
    </motion.div>
  );
};
