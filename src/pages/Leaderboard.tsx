import React, { useState } from 'react';
import { Trophy, Medal, Crown, ChevronDown, Zap, Star, Users, Swords } from 'lucide-react';
import { cn } from '../utils/utils';
import { MultiplayerLeaderboard } from '../features/duel/MultiplayerLeaderboard';

export const Leaderboard: React.FC = () => {
  const [type, setType] = useState<'solo' | 'multiplayer'>('solo');
  const [selectedGrade, setSelectedGrade] = useState('Lớp 5');
  const grades = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'];

  const rankings = [
    { id: 1, name: 'Trần Đức Anh', points: 12500, wins: 142, avatar: 'https://picsum.photos/seed/1/100', trend: 'up' },
    { id: 2, name: 'Lê Bảo Ngọc', points: 11800, wins: 128, avatar: 'https://picsum.photos/seed/2/100', trend: 'down' },
    { id: 3, name: 'Nguyễn Văn Minh', points: 11200, wins: 115, avatar: 'https://picsum.photos/seed/student/100', trend: 'up' },
    { id: 4, name: 'Phạm Minh Tuấn', points: 10500, wins: 98, avatar: 'https://picsum.photos/seed/4/100', trend: 'same' },
    { id: 5, name: 'Hoàng Thùy Linh', points: 9800, wins: 85, avatar: 'https://picsum.photos/seed/5/100', trend: 'up' },
    { id: 6, name: 'Đỗ Hùng Dũng', points: 9200, wins: 72, avatar: 'https://picsum.photos/seed/6/100', trend: 'down' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Type Toggle */}
      <div className="bg-white px-6 pt-6 shrink-0">
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setType('solo')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              type === 'solo' ? "bg-white text-primary shadow-sm" : "text-slate-400"
            )}
          >
            <Zap size={14} fill={type === 'solo' ? "currentColor" : "none"} />
            Đấu Đơn
          </button>
          <button
            onClick={() => setType('multiplayer')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              type === 'multiplayer' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
            )}
          >
            <Swords size={14} />
            Đối Kháng
          </button>
        </div>
      </div>

      {type === 'multiplayer' ? (
        <MultiplayerLeaderboard />
      ) : (
        <>
          {/* Header */}
          <div className="bg-white p-6 pb-4 shrink-0 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black tracking-tight">Xếp hạng</h1>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                <Trophy size={14} className="text-yellow-500" />
                <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Mùa 12</span>
              </div>
            </div>

            {/* Grade Selector - Horizontal Scroll */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
              {grades.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={cn(
                    "whitespace-nowrap px-6 py-2.5 rounded-2xl font-black text-sm transition-all active:scale-95",
                    selectedGrade === g 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Podium */}
            <div className="flex items-end justify-center gap-2 pt-4 pb-2">
              {/* 2nd */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 p-1">
                    <img src={rankings[1].avatar} className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">2</div>
                </div>
                <div className="h-16 w-20 bg-white rounded-t-2xl border-x border-t border-slate-100 flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[10px] font-black text-slate-400">11.8k</span>
                </div>
              </div>

              {/* 1st */}
              <div className="flex flex-col items-center space-y-2">
                <Crown className="text-yellow-400 fill-yellow-400 mb-[-8px]" size={24} />
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-yellow-400 p-1 shadow-lg shadow-yellow-100">
                    <img src={rankings[0].avatar} className="w-full h-full rounded-2xl object-cover border-2 border-white" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white text-xs font-bold border-4 border-white">1</div>
                </div>
                <div className="h-24 w-24 bg-white rounded-t-3xl border-x border-t border-slate-100 flex flex-col items-center justify-center shadow-md">
                  <span className="text-xs font-black text-primary">12.5k</span>
                </div>
              </div>

              {/* 3rd */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 p-1">
                    <img src={rankings[2].avatar} className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">3</div>
                </div>
                <div className="h-12 w-20 bg-white rounded-t-2xl border-x border-t border-slate-100 flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[10px] font-black text-slate-400">11.2k</span>
                </div>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-20">
            <div className="flex justify-between px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Hạng / Tên</span>
              <div className="flex gap-8">
                <span>Trận thắng</span>
                <span>Điểm</span>
              </div>
            </div>
            {rankings.map((user, i) => (
              <div key={user.id} className={cn(
                "p-4 rounded-[2rem] flex items-center justify-between transition-all",
                user.name === 'Nguyễn Văn Minh' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white border border-slate-100"
              )}>
                <div className="flex items-center gap-4">
                  <span className={cn("w-6 text-center font-black", user.name === 'Nguyễn Văn Minh' ? "text-white" : "text-slate-400")}>
                    {i + 1}
                  </span>
                  <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <span className="font-bold text-sm truncate max-w-[100px]">{user.name}</span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-1">
                    <Zap size={12} className={user.name === 'Nguyễn Văn Minh' ? "text-white/70" : "text-orange-500"} />
                    <span className="font-black text-sm">{user.wins}</span>
                  </div>
                  <span className="font-black text-sm min-w-[50px] text-right">{user.points.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
