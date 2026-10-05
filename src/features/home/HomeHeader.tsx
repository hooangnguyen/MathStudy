import React from 'react';
import { Bell, Flame, Star } from 'lucide-react';
import { Avatar } from '../../components/common/Avatar';

interface HomeHeaderProps {
  name?: string;
  avatar?: string;
  grade?: number;
  streak: number;
  points: number;
  unreadCount: number;
  onShowNotifications: () => void;
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

/** Lời chào + chuỗi ngày học + điểm, chữ to và rõ cho học sinh nhỏ tuổi. */
export const HomeHeader: React.FC<HomeHeaderProps> = ({ name, avatar, grade, streak, points, unreadCount, onShowNotifications }) => {
  const firstName = (name || 'bạn').trim().split(/\s+/).slice(-2).join(' ');
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar src={avatar} name={name} className="w-12 h-12 rounded-2xl shrink-0" textClassName="text-xl" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-500">{greeting()} 👋</p>
          <h1 className="text-xl font-black text-slate-900 truncate">{firstName}</h1>
        </div>
        <button
          onClick={onShowNotifications}
          aria-label="Thông báo"
          className="relative w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-500 rounded-full border-2 border-white text-[11px] font-black text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-orange-100 p-3 flex items-center gap-2.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <Flame size={22} className="text-orange-500 fill-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black text-slate-900 leading-tight">{streak}</p>
            <p className="text-xs font-semibold text-slate-500 whitespace-nowrap">ngày học liền</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 p-3 flex items-center gap-2.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Star size={22} className="text-amber-500 fill-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black text-slate-900 leading-tight">{points.toLocaleString('vi-VN')}</p>
            <p className="text-xs font-semibold text-slate-500 whitespace-nowrap">điểm{grade ? ` · Lớp ${grade}` : ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
