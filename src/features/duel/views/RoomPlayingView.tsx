import React from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { cn } from '../../../utils/utils';
import { MathRenderer } from '../../../components/common/MathRenderer';
import type { MathDuelController } from '../useMathDuel';

export const RoomPlayingView: React.FC<{ duel: MathDuelController }> = ({ duel }) => {
  const { userRole, userProfile, setState, timeLeft, score, currentQuestion, roomCode, gameMode, roomPlayers, questions, handleRoomAnswer } = duel;

  return (
    <motion.div
      key="room_playing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col"
    >
      {userRole === 'teacher' ? (
        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
          {/* Teacher Header */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between shrink-0">
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã phòng</div>
              <div className="text-2xl font-black text-indigo-600 tracking-widest">{roomCode}</div>
            </div>

            <div className="flex flex-col items-center">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center border-4 font-black text-2xl",
                (gameMode === 'time' && timeLeft <= 5) ? "border-red-500 text-red-500 animate-pulse" : "border-slate-100 text-slate-700"
              )}>
                {timeLeft}
              </div>
              <div className="text-[10px] font-black text-slate-400 mt-1">
                {gameMode === 'time' ? 'CÒN LẠI' : 'ĐÃ QUA'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sĩ số</div>
              <div className="text-2xl font-black text-emerald-600">{roomPlayers.length} HS</div>
            </div>
          </div>

          {/* Live Leaderboard */}
          <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col overflow-hidden">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 shrink-0">Bảng xếp hạng trực tiếp</h3>
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-2">
              {roomPlayers.sort((a, b) => (b.score || 0) - (a.score || 0)).map((player, index) => (
                <motion.div
                  layout
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm",
                    index === 0 ? "bg-yellow-100 text-yellow-600" :
                      index === 1 ? "bg-slate-200 text-slate-600" :
                        index === 2 ? "bg-amber-100 text-amber-700" : "bg-white text-slate-400 border border-slate-200"
                  )}>
                    {index + 1}
                  </div>
                  <img src={player.avatar} className="w-10 h-10 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">{player.name}</span>
                      <span className="font-black text-indigo-600 text-sm">{player.score || 0} điểm</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-indigo-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${((player.progress || 0) / questions.length) * 100}%` }}
                        transition={{ type: "spring", stiffness: 50 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Finish Button */}
          <button
            onClick={() => setState('room_result')}
            className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-rose-200 active:scale-95 transition-transform shrink-0"
          >
            KẾT THÚC
          </button>
        </div>
      ) : (
        <>
          {/* Room Duel Header */}
          <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 overflow-hidden border-2 border-indigo-500">
                {userProfile?.avatar ? (
                  <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-xl font-black text-indigo-600">{userProfile?.name?.charAt(0) || 'B'}</span>
                )}
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase">Điểm của bạn</div>
                <div className="text-lg font-black text-indigo-600">{score.player}</div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center border-4 font-black text-xl",
                (gameMode === 'time' && timeLeft <= 5) ? "border-red-500 text-red-500 animate-pulse" : "border-slate-100 text-slate-700"
              )}>
                {timeLeft}
              </div>
              <div className="text-[10px] font-black text-slate-400 mt-1">
                {gameMode === 'time' ? 'CÒN LẠI' : 'ĐÃ QUA'}
              </div>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase">Xếp hạng</div>
                <div className="text-lg font-black text-emerald-600">#1 / {roomPlayers.length}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center border-2 border-emerald-500 text-emerald-600">
                <Trophy size={24} />
              </div>
            </div>
          </div>

          {/* Question Area */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-12">
            <div className="text-center space-y-4">
              <span className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Câu hỏi {currentQuestion + 1} / {questions.length}
              </span>
              <h3 className="text-xl sm:text-2xl lg:text-5xl font-black tracking-tight text-slate-800">
                <MathRenderer content={questions[currentQuestion].q} />
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {questions[currentQuestion].options.map((opt, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRoomAnswer(opt, i)}
                  className="bg-white border-2 border-slate-100 p-4 sm:p-6 rounded-[2rem] text-lg sm:text-2xl font-black text-slate-700 hover:border-primary hover:text-primary transition-all shadow-sm"
                >
                  <span className="pointer-events-none"><MathRenderer content={opt} /></span>
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};
