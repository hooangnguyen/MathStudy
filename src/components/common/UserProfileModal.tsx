import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Calendar, Mail, Phone, Trophy, Zap, Star, BookOpen, Flame, Target, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/utils';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    avatar?: string;
    role?: string;
    email?: string;
    phone?: string;
    address?: string;
    joinDate?: string;
  } | null;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user }) => {
  if (!user) return null;

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
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[150] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[160] p-4 pointer-events-none"
          >
            <div className="bg-slate-50 w-full max-w-md h-[85vh] rounded-[2rem] overflow-hidden shadow-2xl pointer-events-auto flex flex-col relative">
              
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
              >
                <X size={18} />
              </button>

              {/* Header Section with Gradient Background */}
              <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 pt-8 pb-16 px-6 shrink-0 overflow-hidden rounded-b-[2.5rem] shadow-lg shadow-purple-500/10">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />
                
                {/* Profile Info */}
                <div className="flex items-center gap-5 relative z-10 mt-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-white p-1 shadow-xl shadow-black/10">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-full h-full rounded-full object-cover border-2 border-slate-50"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-2xl border-2 border-slate-50">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white drop-shadow-sm">{user.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                        {user.role || 'Học sinh'}
                      </span>
                      <span className="text-[10px] text-indigo-100 font-medium">ID: 889922</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-amber-300">
                      <Trophy size={12} className="fill-amber-300" />
                      <span className="text-[10px] font-black uppercase tracking-wider drop-shadow-sm">Kim Cương III</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats Grid */}
              <div className="px-6 -mt-10 relative z-20 shrink-0">
                <div className="bg-white rounded-2xl p-3 shadow-xl shadow-slate-200/50 border border-slate-100 grid grid-cols-4 gap-2 divide-x divide-slate-100">
                  {[
                    { label: 'Bài học', value: '42', icon: BookOpen, color: 'text-indigo-500' },
                    { label: 'Chuỗi', value: '12', icon: Flame, color: 'text-orange-500' },
                    { label: 'Kỷ lục', value: '#1', icon: Target, color: 'text-emerald-500' },
                    { label: 'Điểm', value: '8.5k', icon: Star, color: 'text-amber-500' },
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-col items-center justify-center space-y-1 px-1">
                      <stat.icon size={14} className={stat.color} />
                      <p className="text-base font-black text-slate-800">{stat.value}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                
                {/* Contact Info (Simplified) */}
                <div className="space-y-3">
                   <h3 className="text-sm font-black text-slate-800">Thông tin</h3>
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        <span className="text-xs font-medium">{user.email || 'user@example.com'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        <span className="text-xs font-medium">{user.phone || '0987 654 321'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="text-xs font-medium">{user.address || 'Hà Nội, Việt Nam'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-xs font-medium">Tham gia từ {user.joinDate || 'Tháng 9, 2023'}</span>
                      </div>
                   </div>
                </div>

                {/* Achievements */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800">Huy chương</h3>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">4 / 12</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                    {achievements.map((ach, i) => (
                      <div key={i} className="flex flex-col items-center space-y-2 min-w-[100px] bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-xl shadow-lg relative",
                          ach.color,
                          ach.shadow
                        )}>
                          <div className="absolute inset-1 rounded-[0.8rem] border border-white/30" />
                          {ach.icon}
                        </div>
                        <div className="text-center">
                          <h4 className="text-[10px] font-black text-slate-800 truncate w-full">{ach.title}</h4>
                          <div className="flex justify-center gap-0.5 mt-1">
                            {[...Array(5)].map((_, j) => (
                              <div key={j} className={cn(
                                "w-1 h-1 rounded-full",
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
                <div className="space-y-3 pb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800">Lịch sử đấu</h3>
                    <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center gap-1">
                      Xem tất cả <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {duelHistory.map((duel) => (
                      <div key={duel.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                            duel.result === 'win' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                          )}>
                            {duel.result === 'win' ? <Trophy size={16} className="fill-emerald-500/20" /> : <Zap size={16} className="fill-rose-500/20" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">vs {duel.opponent}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{duel.time}</p>
                              <span className="w-0.5 h-0.5 bg-slate-200 rounded-full" />
                              <p className="text-[9px] font-black text-indigo-500 uppercase">+{duel.xp} XP</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm text-slate-800 tracking-tight">{duel.score}</p>
                          <p className={cn(
                            "text-[9px] font-black uppercase tracking-widest",
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
