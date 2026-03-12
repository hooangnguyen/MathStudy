import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Edit2, History, Shield, Zap, Trophy, Star, ChevronRight, BookOpen, Flame, Target, Swords } from 'lucide-react';
import { cn } from '../utils/utils';
import { Achievement } from '../services/userService';
import { getDuelHistory, DuelMatch } from '../services/duelService';

interface ProfileProps {
  onSettings: () => void;
  onEditProfile: () => void;
  userId?: string;
  userData?: {
    role?: 'student' | 'teacher';
    name?: string;
    grade?: number;
    avatar?: string;
    points?: number;
    streak?: number;
    achievements?: Achievement[];
    completedLessons?: number[];
    totalCompletedAssignments?: number;
    school?: string;
    subject?: string;
  };
  userRole?: 'student' | 'teacher' | null;
}

const formatTimeAgo = (timestamp: any): string => {
  if (!timestamp) return '';
  const ms = timestamp?.toMillis?.() || timestamp?.seconds * 1000 || new Date(timestamp).getTime();
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(ms).toLocaleDateString('vi-VN');
};

export const Profile: React.FC<ProfileProps> = ({ onSettings, onEditProfile, userData, userRole, userId }) => {
  const [duelHistory, setDuelHistory] = useState<DuelMatch[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!userId || userRole !== 'student') return;
    setLoadingHistory(true);
    getDuelHistory(userId, 10)
      .then(setDuelHistory)
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [userId, userRole]);

  const getAchievementStyle = (id: string) => {
    const styles: Record<string, { color: string, shadow: string }> = {
      'star_hunter': { color: 'from-amber-300 to-orange-500', shadow: 'shadow-orange-500/30' },
      'math_expert': { color: 'from-slate-300 to-slate-500', shadow: 'shadow-slate-500/30' },
      'perseverance': { color: 'from-rose-400 to-red-600', shadow: 'shadow-red-500/30' },
      'warrior': { color: 'from-indigo-400 to-purple-600', shadow: 'shadow-purple-500/30' },
    };
    return styles[id] || { color: 'from-blue-400 to-indigo-600', shadow: 'shadow-indigo-500/30' };
  };

  const displayAchievements = userData?.achievements?.length
    ? userData.achievements.map(ach => ({ ...ach, ...getAchievementStyle(ach.id) }))
    : [
      { id: 'star_hunter', title: 'Thợ săn sao', icon: '⭐', level: 3, label: 'Bạc', ...getAchievementStyle('star_hunter') },
      { id: 'math_expert', title: 'Chuyên gia số học', icon: '🧮', level: 1, label: 'Đồng', ...getAchievementStyle('math_expert') },
    ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-indigo-50/20 to-rose-50/10">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 pt-6 pb-16 px-6 shrink-0 overflow-hidden rounded-b-[2.5rem] shadow-2xl shadow-purple-500/20">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-400/20 rounded-full -ml-20 -mb-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-fuchsia-400/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />

        <div className="flex items-center justify-between relative z-10 mb-5">
          <h1 className="text-2xl font-black text-white tracking-wide">Hồ sơ của tôi</h1>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onSettings}
            className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all border border-white/20"
          >
            <SettingsIcon size={20} />
          </motion.button>
        </div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-[1.5rem] bg-white p-1 shadow-2xl shadow-black/10">
              <img
                src={userData?.avatar || "https://picsum.photos/seed/student/200"}
                alt="Avatar"
                className="w-full h-full rounded-[1.2rem] object-cover border-2 border-slate-50"
                referrerPolicy="no-referrer"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={onEditProfile}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white shadow-xl border-2 border-slate-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              <Edit2 size={16} />
            </motion.button>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-white drop-shadow-sm">{userData?.name || 'Người dùng'}</h2>
            <div className="flex items-center gap-3">
              {userData?.role === 'teacher' ? (
                <span className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-[11px] font-bold text-white uppercase tracking-wider border border-white/10">
                  {userData?.subject || 'Giáo viên'}
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-[11px] font-bold text-white uppercase tracking-wider border border-white/10">
                  Lớp {userData?.grade || '1'}
                </span>
              )}
            </div>
            {userData?.role === 'teacher' ? (
              <div className="flex items-center gap-2 mt-1.5 text-indigo-100">
                <Shield size={14} className="fill-white/20" />
                <span className="text-xs font-black uppercase tracking-wider drop-shadow-sm">{userData?.school || 'Chưa cập nhật trường'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1.5 text-amber-200">
                <Trophy size={14} className="fill-amber-300" />
                <span className="text-xs font-black uppercase tracking-wider drop-shadow-sm">
                  {duelHistory.length > 0
                    ? `${duelHistory.filter(d => d.winnerId === userId).length} Thắng / ${duelHistory.length} Trận`
                    : 'Chưa có trận đấu'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Stats Grid */}
      {userData?.role !== 'teacher' && (
        <div className="px-5 -mt-10 relative z-20 shrink-0">
          <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] p-5 shadow-xl shadow-purple-500/10 border border-white/50 grid grid-cols-4 gap-3">
            {[
              { label: 'Bài học', value: userData?.completedLessons?.length || '0', icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { label: 'Bài tập', value: userData?.totalCompletedAssignments || '0', icon: Swords, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { label: 'Chuỗi', value: userData?.streak || '0', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
              { label: 'Điểm', value: (userData?.points || 0).toLocaleString(), icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center justify-center py-2"
              >
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-2", stat.bg)}>
                  <stat.icon size={18} className={stat.color} />
                </div>
                <p className="text-lg font-black text-slate-800">{stat.value}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar pb-24">
        {userData?.role !== 'teacher' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">Huy chương</h3>
              <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                {userData?.achievements?.length || 0} / 12
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
              {displayAchievements.map((ach, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="flex flex-col items-center space-y-3 min-w-[110px] bg-white/80 backdrop-blur-sm p-4 rounded-[1.5rem] border border-white/50 shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-3xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-lg relative",
                    ach.color,
                    ach.shadow
                  )}>
                    <div className="absolute inset-1 rounded-[1.3rem] border border-white/30" />
                    {ach.icon}
                    <div className="absolute -bottom-2.5 bg-white px-2.5 py-0.5 rounded-full shadow-md border border-slate-100">
                      <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{ach.label}</span>
                    </div>
                  </div>
                  <div className="text-center pt-2">
                    <h4 className="text-xs font-black text-slate-800">{ach.title}</h4>
                    <div className="flex justify-center gap-1 mt-1.5">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className={cn("w-1.5 h-1.5 rounded-full", j < ach.level ? 'bg-amber-400' : 'bg-slate-100')} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Duel History - students only */}
        {userRole === 'student' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">Lịch sử đấu</h3>
              <span className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <History size={11} /> {duelHistory.length} trận
              </span>
            </div>

            {loadingHistory ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 animate-pulse h-20" />
                ))}
              </div>
            ) : duelHistory.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-[1.5rem] p-8 border border-white/50 shadow-md flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                  <Swords size={28} className="text-slate-400" />
                </div>
                <p className="font-black text-slate-700">Chưa có trận đấu nào</p>
                <p className="text-xs text-slate-400">Hãy vào Đấu trường để thử sức!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {duelHistory.map((duel) => {
                  const isWin = duel.winnerId === userId;
                  const isDraw = duel.isDraw;
                  const myScore = duel.player1Id === userId ? duel.player1Score : duel.player2Score;
                  const opponentScore = duel.player1Id === userId ? duel.player2Score : duel.player1Score;
                  const opponentName = duel.player1Id === userId ? duel.player2Name : duel.player1Name;
                  const resultLabel = isDraw ? 'Hòa' : isWin ? 'Thắng' : 'Thua';
                  const lpChange = duel.lpChange || 0;

                  return (
                    <motion.div
                      key={duel.id}
                      whileHover={{ scale: 1.01, y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      className="bg-white/80 backdrop-blur-sm p-4 rounded-[1.5rem] border border-white/50 shadow-md hover:shadow-xl transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                          isDraw ? "bg-amber-50 text-amber-500" :
                            isWin ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                        )}>
                          {isDraw ? <Star size={20} className="fill-amber-400/30" /> :
                            isWin ? <Trophy size={20} className="fill-emerald-500/20" /> :
                              <Zap size={20} className="fill-rose-500/20" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">vs {opponentName}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatTimeAgo(duel.createdAt)}</p>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <p className={cn(
                              "text-[10px] font-black uppercase",
                              lpChange > 0 ? "text-emerald-500" : lpChange < 0 ? "text-rose-500" : "text-amber-500"
                            )}>
                              {lpChange > 0 ? `+${lpChange}` : lpChange} LP
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-slate-800 tracking-tight">{myScore} - {opponentScore}</p>
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          isDraw ? "text-amber-500" : isWin ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {resultLabel}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
