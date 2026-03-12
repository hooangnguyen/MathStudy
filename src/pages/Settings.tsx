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

import { UserPreferences, saveUserProfile } from '../services/userService';

interface SettingsProps {
  uid?: string;
  preferences?: UserPreferences;
  onBack: () => void;
  onLogout: () => void;
  onEditProfile: () => void;
  userName?: string;
  onPreferencesChanged?: (newPrefs: UserPreferences) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  uid,
  preferences,
  onBack,
  onLogout,
  onEditProfile,
  userName = 'Người dùng',
  onPreferencesChanged
}) => {
  const [notifications, setNotifications] = useState(preferences?.notifications ?? true);
  const [soundEffects, setSoundEffects] = useState(preferences?.soundEffects ?? true);
  const [darkMode, setDarkMode] = useState(preferences?.darkMode ?? false);

  const saveSetting = async (key: keyof UserPreferences, value: boolean) => {
    if (!uid) return;
    try {
      const newPrefs = {
        notifications,
        soundEffects,
        darkMode,
        ...preferences,
        [key]: value
      };
      // We do not wait for the API call to finish to keep UI snappy
      saveUserProfile(uid, { preferences: newPrefs });
      if (onPreferencesChanged) onPreferencesChanged(newPrefs);
    } catch (err) {
      console.error("Failed to save preference", err);
    }
  };

  const handleToggle = (key: keyof UserPreferences, value: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(value);
    saveSetting(key, value);
  };

  const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
    <motion.button
      onClick={onToggle}
      className={cn(
        "w-12 h-6 rounded-full transition-colors relative",
        active ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-slate-200"
      )}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={{ x: active ? 26 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
      />
    </motion.button>
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
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={onClick ? { scale: 0.99 } : {}}
      className={cn(
        "flex items-center justify-between p-4 cursor-pointer border-b border-slate-50 last:border-b-0",
        onClick && !toggle && "hover:bg-slate-50/50"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center", color)}>
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
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-indigo-50/20 to-rose-50/10">
      {/* Header */}
      <div className="p-5 bg-white/80 backdrop-blur-xl border-b border-white/20 flex items-center gap-4 shrink-0">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-90 transition-transform"
        >
          <ChevronLeft size={24} />
        </motion.button>
        <h1 className="text-xl font-black">Cài đặt</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {/* Account Section */}
        <div className="p-5 pb-2">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tài khoản</h2>
        </div>
        <div className="mx-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-md overflow-hidden">
          <SettingItem
            icon={User}
            label="Thông tin cá nhân"
            value={userName}
            color="text-blue-500"
            onClick={onEditProfile}
          />
          <SettingItem icon={Globe} label="Ngôn ngữ" value="Tiếng Việt" color="text-emerald-500" />
        </div>

        {/* Learning Section */}
        <div className="p-5 pb-2 pt-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Học tập</h2>
        </div>
        <div className="mx-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-md overflow-hidden">
          <SettingItem icon={Type} label="Cỡ chữ" value="Mặc định" color="text-indigo-500" />
          <SettingItem
            icon={Bell}
            label="Thông báo nhắc học"
            toggle={{ active: notifications, onToggle: () => handleToggle('notifications', !notifications, setNotifications) }}
            color="text-rose-500"
          />
        </div>

        {/* Audio & Visual Section */}
        <div className="p-5 pb-2 pt-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Âm thanh & Hiển thị</h2>
        </div>
        <div className="mx-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-md overflow-hidden">
          <SettingItem
            icon={Volume2}
            label="Hiệu ứng âm thanh"
            toggle={{ active: soundEffects, onToggle: () => handleToggle('soundEffects', !soundEffects, setSoundEffects) }}
            color="text-cyan-500"
          />
          <SettingItem
            icon={Moon}
            label="Chế độ tối"
            toggle={{ active: darkMode, onToggle: () => handleToggle('darkMode', !darkMode, setDarkMode) }}
            color="text-slate-800"
          />
          <SettingItem icon={Eye} label="Chế độ bảo vệ mắt" value="Tắt" color="text-amber-500" />
        </div>

        {/* Support Section */}
        <div className="p-5 pb-2 pt-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Hỗ trợ</h2>
        </div>
        <div className="mx-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-md overflow-hidden">
          <SettingItem icon={HelpCircle} label="Trung tâm trợ giúp" color="text-blue-400" />
          <SettingItem icon={Info} label="Về MathMastery" value="v1.2.4" color="text-slate-400" />
        </div>

        <div className="p-5 mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full p-5 bg-gradient-to-r from-rose-500 to-red-500 rounded-[2rem] flex items-center justify-center gap-2 text-white font-bold shadow-lg shadow-rose-500/25 hover:shadow-xl transition-all"
          >
            <LogOut size={20} /> Đăng xuất
          </motion.button>
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
