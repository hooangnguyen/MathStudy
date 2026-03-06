import React from 'react';
import { Settings as SettingsIcon, Edit2, Award, History, Heart, Shield, LogOut, Zap, Trophy, Star, ChevronRight, BookOpen, Flame, Target } from 'lucide-react';
import { cn } from '../utils/utils';

interface ProfileProps {
  onSettings: () => void;
  onEditProfile: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onSettings, onEditProfile }) => {
  const achievements = [
    { title: 'Thợ săn sao', icon: '⭐', level: 3, color: 'from-amber-300 to-orange-500', label: 'Bạc', shadow: 'shadow-orange-500/30' },
    { title: 'Chuyên gia số học', icon: '🧮', level: 1, color: 'from-slate-300 to-slate-500', label: 'Đồng', shadow: 'shadow-slate-500/30' },
    { title: 'Kiên trì', icon: '🔥', level: 5, color: 'from-rose-400 to-red-600', label: 'Vàng', shadow: 'shadow-red-500/30' },
    { title: 'Chiến thần', icon: '⚔️', level: 2, color: 'from-indigo-400 to-purple-600', label: 'Bạc', shadow: 'shadow-purple-500/30' },
  ];

  const duelHistory = [
    { id: 1, opponent: 'Hoàng Nam', result: 'win', score: '100 - 80', time: '10 phút trước', xp: 25 },
    { id: 2, opponent: 'Lê Bảo Ngọc', result: 'loss', score: '70 - 90', time: '2 giờ trước', xp: 5 },
    { id: 3, opponent: 'Trần Đức Anh', result: 'win', score: '110 - 60', time: 'Hôm qua', xp: 20 },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header Section with Gradient Background */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 pt-8 pb-24 px-6 shrink-0 overflow-hidden rounded-b-[3rem] shadow-lg shadow-purple-500/10">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        {/* Top Bar */}
        <div className="flex items-center justify-between relative z-10 mb-8">
          <h1 className="text-xl font-black text-white tracking-wide">Hồ sơ của tôi</h1>
          <button 
            onClick={onSettings}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all border border-white/20"
          >
            <SettingsIcon size={20} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl shadow-black/10">
              <img 
                src="https://picsum.photos/seed/student/200" 
                alt="Avatar" 
                className="w-full h-full rounded-full object-cover border-2 border-slate-50"
                referrerPolicy="no-referrer"
              />
            </div>
            <button 
              onClick={onEditProfile}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 active:scale-90 transition-all"
            >
              <Edit2 size={14} />
            </button>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-white drop-shadow-sm">Nguyễn Văn Minh</h2>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                Lớp 5A
              </span>
              <span className="text-xs text-indigo-100 font-medium">ID: 889922</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-amber-300">
              <Trophy size={14} className="fill-amber-300" />
              <span className="text-xs font-black uppercase tracking-wider drop-shadow-sm">Kim Cương III</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Stats Grid */}
      <div className="px-6 -mt-12 relative z-20 shrink-0">
        <div className="bg-white rounded-3xl p-4 shadow-xl shadow-slate-200/50 border border-slate-100 grid grid-cols-4 gap-2 divide-x divide-slate-100">
          {[
            { label: 'Bài học', value: '42', icon: BookOpen, color: 'text-indigo-500' },
            { label: 'Chuỗi', value: '12', icon: Flame, color: 'text-orange-500' },
            { label: 'Kỷ lục', value: '#1', icon: Target, color: 'text-emerald-500' },
            { label: 'Điểm', value: '8.5k', icon: Star, color: 'text-amber-500' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center space-y-1.5 px-2">
              <stat.icon size={16} className={stat.color} />
              <p className="text-lg font-black text-slate-800">{stat.value}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-24">
        {/* Achievements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800">Huy chương</h3>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">4 / 12</span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
            {achievements.map((ach, i) => (
              <div key={i} className="flex flex-col items-center space-y-3 min-w-[110px] bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={cn(
                  "w-16 h-16 rounded-3xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-lg relative",
                  ach.color,
                  ach.shadow
                )}>
                  <div className="absolute inset-1 rounded-[1.3rem] border border-white/30" />
                  {ach.icon}
                  <div className="absolute -bottom-2.5 bg-white px-2.5 py-0.5 rounded-full shadow-sm border border-slate-100">
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{ach.label}</span>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <h4 className="text-xs font-black text-slate-800">{ach.title}</h4>
                  <div className="flex justify-center gap-1 mt-1.5">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        j < ach.level ? 'bg-amber-400' : 'bg-slate-100'
                      )} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Duel History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800">Lịch sử đấu</h3>
            <button className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center gap-1">
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {duelHistory.map((duel) => (
              <div key={duel.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                    duel.result === 'win' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                  )}>
                    {duel.result === 'win' ? <Trophy size={20} className="fill-emerald-500/20" /> : <Zap size={20} className="fill-rose-500/20" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">vs {duel.opponent}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{duel.time}</p>
                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                      <p className="text-[10px] font-black text-indigo-500 uppercase">+{duel.xp} XP</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg text-slate-800 tracking-tight">{duel.score}</p>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    duel.result === 'win' ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {duel.result === 'win' ? 'Thắng' : 'Thua'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
