import React from 'react';
import { motion } from 'motion/react';
import { Trophy, X, Crown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { MathDuelController } from '../useMathDuel';

export const ResultView: React.FC<{ duel: MathDuelController }> = ({ duel }) => {
  const { user, userProfile, setState, score, matchOutcome, opponentSurrendered, lpDelta, opponentInfo } = duel;

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-6 space-y-8"
    >
      <div className="relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className={cn(
            "w-40 h-40 rounded-[3.5rem] flex items-center justify-center shadow-2xl",
            matchOutcome === 'win' ? "bg-yellow-400 text-white" : "bg-slate-200 text-slate-400"
          )}
        >
          {matchOutcome === 'win' ? <Trophy size={80} /> : <X size={80} />}
        </motion.div>
        {matchOutcome === 'win' && (
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-lg border border-yellow-100"
          >
            <Crown className="text-yellow-400" size={24} />
          </motion.div>
        )}
      </div>

      <div className="text-center space-y-3">
        {opponentSurrendered && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-red-100 border border-red-200 text-red-600 px-4 py-1.5 rounded-full font-bold text-sm"
          >
            Đối thủ đã đầu hàng!
          </motion.div>
        )}
        <h2 className="text-4xl font-black tracking-tight">
          {matchOutcome === 'win' ? "CHIẾN THẮNG!" : matchOutcome === 'draw' ? "HÒA NHAU!" : "THẤT BẠI!"}
        </h2>
        <p className="text-slate-500 font-bold">
          {lpDelta === null ? 'Đang cập nhật điểm xếp hạng...' : `${lpDelta > 0 ? '+' : ''}${lpDelta} Điểm Xếp Hạng (LP)`}
        </p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-6 border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {userProfile?.name?.charAt(0) || user?.email?.charAt(0) || 'B'}
            </div>
            <span className="font-bold">{userProfile?.name || 'Bạn'}</span>
          </div>
          <span className="text-2xl font-black text-indigo-600">{score.player}</span>
        </div>
        <div className="h-px bg-slate-100" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold">
              {opponentInfo?.name?.charAt(0) || 'Đ'}
            </div>
            <span className="font-bold">{opponentInfo?.name || 'Đối thủ'}</span>
          </div>
          <span className="text-2xl font-black text-red-600">{score.opponent}</span>
        </div>
      </div>

      <button
        onClick={() => setState('lobby')}
        className="w-full max-w-sm bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-transform"
      >
        QUAY LẠI
      </button>
    </motion.div>
  );
};
