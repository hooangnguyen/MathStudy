import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../utils/utils';
import { MathRenderer } from '../../../components/common/MathRenderer';
import type { MathDuelController } from '../useMathDuel';

export const PlayingView: React.FC<{ duel: MathDuelController }> = ({ duel }) => {
  const { user, userProfile, isWaitingForOpponent, timeLeft, score, currentQuestion, opponentInfo, getUserRankInfo, avatarMap, questions, handleAnswer } = duel;

  return (
    <motion.div
      key="playing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col"
    >
      {/* Duel Header */}
      <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 overflow-hidden border-2 border-indigo-500 flex items-center justify-center">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xl font-black text-indigo-600">{userProfile?.name?.charAt(0) || user?.email?.charAt(0) || 'B'}</span>
            )}
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase">Bạn ({getUserRankInfo().name})</div>
            <div className="text-lg font-black text-indigo-600">{score.player}</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center border-4 font-black text-xl",
            timeLeft <= 5 ? "border-red-500 text-red-500 animate-pulse" : "border-slate-100 text-slate-700"
          )}>
            {timeLeft}
          </div>
          <div className="text-[10px] font-black text-slate-400 mt-1">GIÂY</div>
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase">{opponentInfo?.name || 'Đối thủ'}</div>
            <div className="text-lg font-black text-red-600">{score.opponent}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center border-2 border-red-500 overflow-hidden">
            {(opponentInfo?.avatar || (opponentInfo?.id && avatarMap[opponentInfo.id])) ? (
              <img src={opponentInfo?.avatar || avatarMap[opponentInfo!.id]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xl font-bold text-red-600">{opponentInfo?.name?.charAt(0) || 'Đ'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Question Area */}
      {isWaitingForOpponent ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6">
          <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">Hoàn thành!</h3>
            <p className="text-slate-500 font-medium">Bạn đã hoàn thành xong các câu hỏi. Vui lòng chờ đối thủ...</p>
          </div>
        </div>
      ) : (
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
                onClick={() => handleAnswer(opt)}
                className="bg-white border-2 border-slate-100 p-4 sm:p-6 rounded-[2rem] text-lg sm:text-2xl font-black text-slate-700 hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                <span className="pointer-events-none"><MathRenderer content={opt} /></span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
