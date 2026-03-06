import React, { useState } from 'react';
import { 
  ChevronLeft, 
  User, 
  Bell, 
  Volume2, 
  Moon, 
  Globe, 
  HelpCircle, 
  Info, 
  ChevronRight,
  Smartphone,
  Type,
  Music,
  Eye,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/utils';

interface SettingsProps {
  onBack: () => void;
  onLogout: () => void;
  onEditProfile: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  onBack, 
  onLogout,
  onEditProfile
}) => {
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
    <button 
      onClick={onToggle}
      className={cn(
        "w-12 h-6 rounded-full transition-colors relative",
        active ? "bg-primary" : "bg-slate-200"
      )}
    >
      <motion.div 
        animate={{ x: active ? 24 : 2 }}
        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </button>
  );

  const SettingItem = ({ 
    icon: Icon, 
    label, 
    value, 
    onClick, 
    toggle, 
    color = "text-slate-600" 
  }: { 
    icon: any, 
    label: string, 
    value?: string, 
    onClick?: () => void, 
    toggle?: { active: boolean, onToggle: () => void },
    color?: string
  }) => (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer",
        !toggle && "active:bg-slate-100"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center", color)}>
          <Icon size={20} />
        </div>
        <span className="font-bold text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm font-medium text-slate-400">{value}</span>}
        {toggle ? (
          <Toggle active={toggle.active} onToggle={toggle.onToggle} />
        ) : (
          <ChevronRight size={18} className="text-slate-300" />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-100 flex items-center gap-4 shrink-0">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black">Cài đặt</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {/* Account Section */}
        <div className="p-6 pb-2">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tài khoản</h2>
        </div>
        <div className="border-y border-slate-50">
          <SettingItem 
            icon={User} 
            label="Thông tin cá nhân" 
            value="Nguyễn Văn Minh" 
            color="text-blue-500" 
            onClick={onEditProfile}
          />
          <SettingItem icon={Globe} label="Ngôn ngữ" value="Tiếng Việt" color="text-emerald-500" />
        </div>

        {/* Learning Section */}
        <div className="p-6 pb-2 pt-8">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Học tập</h2>
        </div>
        <div className="border-y border-slate-50">
          <SettingItem icon={Type} label="Cỡ chữ" value="Mặc định" color="text-indigo-500" />
          <SettingItem 
            icon={Bell} 
            label="Thông báo nhắc học" 
            toggle={{ active: notifications, onToggle: () => setNotifications(!notifications) }}
            color="text-rose-500"
          />
        </div>

        {/* Audio & Visual Section */}
        <div className="p-6 pb-2 pt-8">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Âm thanh & Hiển thị</h2>
        </div>
        <div className="border-y border-slate-50">
          <SettingItem 
            icon={Volume2} 
            label="Hiệu ứng âm thanh" 
            toggle={{ active: soundEffects, onToggle: () => setSoundEffects(!soundEffects) }}
            color="text-cyan-500"
          />
          <SettingItem 
            icon={Moon} 
            label="Chế độ tối" 
            toggle={{ active: darkMode, onToggle: () => setDarkMode(!darkMode) }}
            color="text-slate-800"
          />
          <SettingItem icon={Eye} label="Chế độ bảo vệ mắt" value="Tắt" color="text-amber-500" />
        </div>

        {/* Support Section */}
        <div className="p-6 pb-2 pt-8">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Hỗ trợ</h2>
        </div>
        <div className="border-y border-slate-50">
          <SettingItem icon={HelpCircle} label="Trung tâm trợ giúp" color="text-blue-400" />
          <SettingItem icon={Info} label="Về MathMastery" value="v1.2.4" color="text-slate-400" />
        </div>

        <div className="p-6 mt-4">
          <button 
            onClick={onLogout}
            className="w-full p-5 bg-rose-50 rounded-[2rem] flex items-center justify-center gap-2 text-rose-600 font-bold hover:bg-rose-100 transition-colors"
          >
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>

        <div className="p-8 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Made with ❤️ for young mathematicians
          </p>
        </div>
      </div>
    </div>
  );
};
