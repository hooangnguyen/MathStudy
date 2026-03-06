import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ShieldCheck, Zap, Star, ChevronLeft, Search, Crown, Users, TrendingUp, Medal } from 'lucide-react';
import { cn } from '../../utils/utils';

const RANKS = {
  bronze: { name: 'Đồng', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-700', icon: '🥉' },
  silver: { name: 'Bạc', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-400', icon: '🥈' },
  gold: { name: 'Vàng', color: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-400', icon: '🥇' },
  platinum: { name: 'Bạch Kim', color: 'text-teal-500', bg: 'bg-teal-100', border: 'border-teal-400', icon: '💎' },
  diamond: { name: 'Kim Cương', color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-400', icon: '💠' },
  challenger: { name: 'Thách Đấu', color: 'text-rose-500', bg: 'bg-rose-100', border: 'border-rose-400', icon: '👑' },
};

const multiplayerRankings = [
  { id: 1, name: 'Trần Đức Anh', rankTier: RANKS.challenger, lp: 1250, winRate: '78%', streak: 5, avatar: 'https://picsum.photos/seed/1/100' },
  { id: 2, name: 'Lê Bảo Ngọc', rankTier: RANKS.challenger, lp: 1180, winRate: '72%', streak: 3, avatar: 'https://picsum.photos/seed/2/100' },
  { id: 3, name: 'Hoàng Nam (Bạn)', rankTier: RANKS.diamond, lp: 980, winRate: '65%', streak: 2, avatar: 'https://picsum.photos/seed/student/100', isMe: true },
  { id: 4, name: 'Phạm Minh Tuấn', rankTier: RANKS.diamond, lp: 850, winRate: '60%', streak: 0, avatar: 'https://picsum.photos/seed/4/100' },
  { id: 5, name: 'Hoàng Thùy Linh', rankTier: RANKS.platinum, lp: 720, winRate: '58%', streak: 1, avatar: 'https://picsum.photos/seed/5/100' },
  { id: 6, name: 'Đỗ Hùng Dũng', rankTier: RANKS.gold, lp: 540, winRate: '52%', streak: 0, avatar: 'https://picsum.photos/seed/6/100' },
  { id: 7, name: 'Nguyễn Thị Mai', rankTier: RANKS.gold, lp: 510, winRate: '50%', streak: 2, avatar: 'https://picsum.photos/seed/7/100' },
  { id: 8, name: 'Bùi Quang Huy', rankTier: RANKS.silver, lp: 320, winRate: '45%', streak: 0, avatar: 'https://picsum.photos/seed/8/100' },
];

interface MultiplayerLeaderboardProps {
  onBack?: () => void;
}

export const MultiplayerLeaderboard: React.FC<MultiplayerLeaderboardProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<'global' | 'friends' | 'class'>('global');

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white p-6 pb-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h1 className="text-2xl font-black tracking-tight text-slate-900">BXH Đối Kháng</h1>
          </div>
          <div className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} />
            Mùa 5
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-4">
          {(['global', 'friends', 'class'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                filter === t 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {t === 'global' ? 'Thế giới' : t === 'friends' ? 'Bạn bè' : 'Lớp học'}
            </button>
          ))}
        </div>

        {/* Top 3 Podium (Mini) */}
        <div className="flex items-end justify-center gap-4 py-4">
          {/* 2nd */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <img src={multiplayerRankings[1].avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-300" referrerPolicy="no-referrer" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">2</div>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase">{multiplayerRankings[1].rankTier.name}</span>
          </div>

          {/* 1st */}
          <div className="flex flex-col items-center">
            <Crown className="text-yellow-400 fill-yellow-400 mb-1" size={20} />
            <div className="relative mb-2">
              <img src={multiplayerRankings[0].avatar} className="w-18 h-18 rounded-3xl object-cover border-4 border-yellow-400 shadow-lg shadow-yellow-100" referrerPolicy="no-referrer" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white text-xs font-bold border-4 border-white">1</div>
            </div>
            <span className="text-[10px] font-black text-yellow-600 uppercase">{multiplayerRankings[0].rankTier.name}</span>
          </div>

          {/* 3rd */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <img src={multiplayerRankings[2].avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-600" referrerPolicy="no-referrer" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">3</div>
            </div>
            <span className="text-[10px] font-black text-amber-700 uppercase">{multiplayerRankings[2].rankTier.name}</span>
          </div>
        </div>
      </div>

      {/* Rankings List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 no-scrollbar">
        <div className="flex justify-between px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          <span>Hạng / Người chơi</span>
          <div className="flex gap-10">
            <span>Tỉ lệ thắng</span>
            <span>LP</span>
          </div>
        </div>

        {multiplayerRankings.map((user, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={user.id} 
            className={cn(
              "p-4 rounded-[2rem] border-2 flex items-center justify-between transition-all",
              user.isMe ? "bg-indigo-50 border-indigo-200 shadow-md shadow-indigo-100" : "bg-white border-slate-100"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-6 font-black text-sm text-center",
                i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-slate-300"
              )}>
                {i + 1}
              </div>
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className={cn("w-12 h-12 rounded-2xl object-cover border-2", user.rankTier.border)}
                  referrerPolicy="no-referrer"
                />
                <div className={cn("absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm")}>
                  <ShieldCheck size={14} className={user.rankTier.color} />
                </div>
              </div>
              <div>
                <p className={cn(
                  "text-sm font-black",
                  user.isMe ? "text-indigo-900" : "text-slate-900"
                )}>
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn("text-[10px] font-black uppercase tracking-tighter", user.rankTier.color)}>
                    {user.rankTier.name}
                  </span>
                  {user.streak > 0 && (
                    <span className="text-[10px] font-bold text-orange-500 flex items-center gap-0.5">
                      <Zap size={10} fill="currentColor" />
                      {user.streak} chuỗi
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="text-xs font-black text-slate-700">{user.winRate}</div>
                <div className="text-[8px] font-bold text-slate-400 uppercase">Thắng</div>
              </div>
              <div className="text-right min-w-[40px]">
                <div className={cn("text-sm font-black", user.rankTier.color)}>{user.lp}</div>
                <div className="text-[8px] font-bold text-slate-400 uppercase">Điểm</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* My Rank Sticky Footer */}
      <div className="absolute bottom-4 left-4 right-4 bg-slate-900 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 p-0.5">
            <img src="https://picsum.photos/seed/student/100" className="w-full h-full rounded-lg object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase">Hạng của bạn</div>
            <div className="text-sm font-black">#3 • Kim Cương I</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-indigo-400">980 LP</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sắp thăng hạng!</div>
        </div>
      </div>
    </div>
  );
};
