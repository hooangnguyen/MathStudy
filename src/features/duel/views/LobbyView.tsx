import React from 'react';
import { motion } from 'motion/react';
import { Zap, Trophy, Swords, ShieldCheck, Crown, Users, Plus, Key, ClipboardList } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { MathDuelController } from '../useMathDuel';

export const LobbyView: React.FC<{ duel: MathDuelController }> = ({ duel }) => {
  const { userRole, onNavigate, setState, userRank, userRankPosition, getUserRankInfo } = duel;

  return (
    <motion.div
      key="lobby"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col p-4 md:p-6 items-center justify-center space-y-6 md:space-y-8"
    >
      <div className="w-24 h-24 md:w-32 md:h-32 bg-indigo-100 rounded-3xl md:rounded-[3rem] flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100">
        <Swords className="w-12 h-12 md:w-16 md:h-16" strokeWidth={2.5} />
      </div>
      <div className="text-center space-y-1 md:space-y-2">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Đấu trường Toán học</h1>
        <p className="text-sm md:text-base text-slate-500 font-medium">Thách đấu với các bạn cùng lớp ngay!</p>
      </div>

      {userRole === 'teacher' ? (
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => setState('create_room')}
            className="w-full bg-primary text-white p-6 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/30 active:scale-95 transition-transform flex flex-col items-center justify-center gap-2"
          >
            <Users size={32} />
            TẠO PHÒNG QUIZ
          </button>
        </div>
      ) : (
        <>
          {/* Rank Display */}
          <div className="flex flex-col items-center space-y-1 md:space-y-2">
            <div className="flex items-center gap-1.5 md:gap-2">
              <ShieldCheck className={cn("w-6 h-6 md:w-7 md:h-7", getUserRankInfo().color)} />
              <span className={cn("text-xl md:text-2xl font-black uppercase tracking-wider", getUserRankInfo().color)}>
                {getUserRankInfo().name}
              </span>
            </div>
            <div className="text-xs md:text-sm font-bold text-slate-400">{userRank?.lp || 0} Điểm Xếp Hạng (LP)</div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-sm">
            <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 flex flex-col items-center space-y-1">
              <Trophy className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase">Thắng</span>
              <span className="text-lg md:text-xl font-black">{userRank?.wins || 0}</span>
            </div>
            <button
              onClick={() => setState('leaderboard')}
              className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 flex flex-col items-center space-y-1 hover:border-indigo-200 hover:bg-indigo-50 transition-colors active:scale-95"
            >
              <Crown className="text-indigo-500 w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase">BXH Hệ thống</span>
              <span className="text-lg md:text-xl font-black text-indigo-600">Hạng {userRankPosition || '-'}</span>
            </button>
          </div>

          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() => setState('searching')}
              className="w-full bg-primary text-white py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black text-base md:text-lg shadow-xl shadow-primary/30 active:scale-95 transition-transform flex items-center justify-center gap-2 md:gap-3"
            >
              <Zap className="w-5 h-5 md:w-6 md:h-6" fill="white" />
              TÌM ĐỐI THỦ NGẪU NHIÊN
            </button>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <button
                onClick={() => setState('create_room')}
                className="bg-indigo-100 text-indigo-700 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] font-bold text-xs md:text-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5 md:gap-2"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                Tạo phòng
              </button>
              <button
                onClick={() => setState('join_room')}
                className="bg-emerald-100 text-emerald-700 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] font-bold text-xs md:text-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5 md:gap-2"
              >
                <Key className="w-4 h-4 md:w-5 md:h-5" />
                Vào phòng
              </button>
            </div>

            <button
              onClick={() => onNavigate?.('quiz')}
              className="w-full bg-teal-100 text-teal-700 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] font-bold text-xs md:text-sm shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5 md:gap-2 mt-2 md:mt-3"
            >
              <ClipboardList className="w-4 h-4 md:w-5 md:h-5" />
              Tham gia Quiz Lớp học (Nhập mã)
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};
