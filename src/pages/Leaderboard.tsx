import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, ChevronDown, Zap, Star, Users, Swords } from 'lucide-react';
import { cn } from '../utils/utils';
import { MultiplayerLeaderboard } from '../features/duel/MultiplayerLeaderboard';
import { getTopUsers, UserProfile } from '../services/userService';

export const Leaderboard: React.FC = () => {
  const [type, setType] = useState<'solo' | 'multiplayer'>('solo');
  const [selectedGrade, setSelectedGrade] = useState('Khối Tiều Học');
  const grades = ['Mầm Non', 'Khối Tiểu Học', 'Khối THCS', 'Khối THPT'];
  const [rankings, setRankings] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const users = await getTopUsers(50, type);
      setRankings(users);
      setLoading(false);
    };

    fetchLeaderboard();
  }, [type]);

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
            {!loading && rankings.length >= 3 && (
              <div className="flex items-end justify-center gap-2 pt-4 pb-2">
                {/* 2nd */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 p-1">
                      <img src={rankings[1].avatar || 'https://picsum.photos/seed/student/100'} className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">2</div>
                  </div>
                  <div className="h-16 w-20 bg-white rounded-t-2xl border-x border-t border-slate-100 flex flex-col items-center justify-center shadow-sm p-1 text-center">
                    <span className="text-[10px] font-bold text-slate-500 truncate w-full">{rankings[1].name.split(' ').pop()}</span>
                    <span className="text-[10px] font-black text-slate-400">{(rankings[1].points / 1000).toFixed(1)}k</span>
                  </div>
                </div>

                {/* 1st */}
                <div className="flex flex-col items-center space-y-2">
                  <Crown className="text-yellow-400 fill-yellow-400 mb-[-8px]" size={24} />
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-yellow-400 p-1 shadow-lg shadow-yellow-100">
                      <img src={rankings[0].avatar || 'https://picsum.photos/seed/student/100'} className="w-full h-full rounded-2xl object-cover border-2 border-white" referrerPolicy="no-referrer" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white text-xs font-bold border-4 border-white">1</div>
                  </div>
                  <div className="h-24 w-24 bg-white rounded-t-3xl border-x border-t border-slate-100 flex flex-col items-center justify-center shadow-md p-1 text-center">
                    <span className="text-xs font-bold text-slate-600 truncate w-full">{rankings[0].name.split(' ').pop()}</span>
                    <span className="text-xs font-black text-primary">{(rankings[0].points / 1000).toFixed(1)}k</span>
                  </div>
                </div>

                {/* 3rd */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-orange-100 p-1">
                      <img src={rankings[2].avatar || 'https://picsum.photos/seed/student/100'} className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">3</div>
                  </div>
                  <div className="h-12 w-20 bg-white rounded-t-2xl border-x border-t border-slate-100 flex flex-col items-center justify-center shadow-sm p-1 text-center">
                    <span className="text-[10px] font-bold text-slate-500 truncate w-full">{rankings[2].name.split(' ').pop()}</span>
                    <span className="text-[10px] font-black text-slate-400">{(rankings[2].points / 1000).toFixed(1)}k</span>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-20">
            <div className="flex justify-between px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Hạng / Tên</span>
              <div className="flex gap-8">
                <span>Số dư điểm</span>
              </div>
            </div>
            {!loading && rankings.map((user, i) => (
              <div key={user.uid} className={cn(
                "p-4 rounded-[2rem] flex items-center justify-between transition-all bg-white border border-slate-100"
              )}>
                <div className="flex items-center gap-4">
                  <span className="w-6 text-center font-black text-slate-400">
                    {i + 1}
                  </span>
                  <img src={user.avatar || 'https://picsum.photos/seed/student/100'} className="w-10 h-10 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <span className="font-bold text-sm truncate max-w-[120px]">{user.name}</span>
                </div>
                <div className="flex items-center gap-8">
                  <span className="font-black text-sm min-w-[50px] text-right text-orange-500">{user.points?.toLocaleString() || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
