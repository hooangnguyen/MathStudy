import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Calendar, Mail, Phone, Trophy, Zap, Star, BookOpen, Flame, Target, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/utils';
import { useFirebase } from '../../context/FirebaseProvider';
import { getUserProfile, getAchievements, UserProfile as UserProfileType, Achievement } from '../../services/userService';
import { getOnlineStatus } from '../../services/userService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    avatar?: string;
    role?: string;
    uid?: string;
  } | null;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user }) => {
  const { user: currentUser } = useFirebase();
  const [profileData, setProfileData] = useState<UserProfileType | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isOpen || !user?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load user profile
        const profile = await getUserProfile(user.uid);
        setProfileData(profile);

        // Load achievements
        const userAchievements = await getAchievements(user.uid);
        setAchievements(userAchievements);

        // Check online status
        const status = await getOnlineStatus([user.uid]);
        setIsOnline(status[user.uid] || false);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isOpen, user?.uid]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  if (!user) return null;

  const stats = [
    { label: 'Bài học', value: profileData?.completedLessons?.length || 0, icon: BookOpen, color: 'text-indigo-500' },
    { label: 'Chuỗi', value: profileData?.streak || 0, icon: Flame, color: 'text-orange-500' },
    { label: 'Điểm', value: profileData?.points || 0, icon: Star, color: 'text-amber-500' },
    { label: 'Xếp hạng', value: '#-', icon: Target, color: 'text-emerald-500' },
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

                {/* Online/Offline Status */}
                <div className="absolute top-4 left-4 z-50">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-md flex items-center gap-1.5",
                    isOnline ? "bg-emerald-500/20 text-emerald-100" : "bg-slate-500/20 text-slate-200"
                  )}>
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      isOnline ? "bg-emerald-400" : "bg-slate-400"
                    )} />
                    {isOnline ? 'Đang hoạt động' : 'Offline'}
                  </span>
                </div>

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
                    {isOnline && (
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-3 border-white rounded-full" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white drop-shadow-sm">{user.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                        {user.role || (profileData?.role === 'teacher' ? 'Giáo viên' : 'Học sinh')}
                      </span>
                      {profileData?.grade && (
                        <span className="px-2 py-0.5 rounded-lg bg-white/10 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                          Lớp {profileData.grade}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-amber-300">
                      <Trophy size={12} className="fill-amber-300" />
                      <span className="text-[10px] font-black uppercase tracking-wider drop-shadow-sm">{profileData?.points || 0} điểm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats Grid */}
              <div className="px-6 -mt-10 relative z-20 shrink-0">
                <div className="bg-white rounded-2xl p-3 shadow-xl shadow-slate-200/50 border border-slate-100 grid grid-cols-4 gap-2 divide-x divide-slate-100">
                  {stats.map((stat, i) => (
                    <div key={i} className="flex flex-col items-center justify-center space-y-1 px-1">
                      <stat.icon size={14} className={stat.color} />
                      <p className="text-base font-black text-slate-800">
                        {typeof stat.value === 'number' && stat.value >= 1000
                          ? `${(stat.value / 1000).toFixed(1)}k`
                          : stat.value}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">

                {/* Contact Info */}
                <div className="space-y-3">
                   <h3 className="text-sm font-black text-slate-800">Thông tin</h3>
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                      {profileData?.school && (
                        <div className="flex items-center gap-3 text-slate-600">
                          <MapPin size={14} className="text-slate-400" />
                          <span className="text-xs font-medium">{profileData.school}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-xs font-medium">Tham gia từ {formatDate(profileData?.createdAt)}</span>
                      </div>
                   </div>
                </div>

                {/* Achievements */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800">Huy chương</h3>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {achievements.length}
                    </span>
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full" />
                    </div>
                  ) : achievements.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                      {achievements.map((ach) => (
                        <div key={ach.id} className="flex flex-col items-center space-y-2 min-w-[100px] bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center text-xl shadow-lg shadow-orange-500/30">
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
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      Chưa có huy chương nào
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
