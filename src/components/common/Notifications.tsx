import React, { useState, useEffect } from 'react';
import { Bell, X, Zap, Trophy, MessageSquare, Star, FileText, Users, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/utils';
import { useFirebase } from '../../context/FirebaseProvider';
import { subscribeToNotifications, markAsRead, markAllAsRead, Notification } from '../../services/notificationService';

interface NotificationsProps {
  onBack: () => void;
  userRole?: 'student' | 'teacher';
  onNavigateToSource?: (notification: Notification) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onBack, userRole = 'student', onNavigateToSource }) => {
  const { user } = useFirebase();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user || notifications.length === 0) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAllAsRead(user.uid, unreadIds);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'duel': return <Zap className="text-orange-500" size={20} />;
      case 'achievement': return <Trophy className="text-yellow-500" size={20} />;
      case 'submission': return <FileText className="text-indigo-500" size={20} />;
      case 'assignment': return <FileText className="text-emerald-500" size={20} />;
      case 'student_join': return <Users className="text-blue-500" size={20} />;
      default: return <Bell className="text-slate-400" size={20} />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Vừa xong';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onBack}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative bg-white rounded-t-[3rem] shadow-2xl h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />

        <div className="p-6 pt-2 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-black">Thông báo</h1>
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              Đánh dấu đã đọc
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-3 no-scrollbar pb-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <div className="w-16 h-16 bg-slate-100 rounded-full mb-4" />
              <div className="h-4 w-32 bg-slate-100 rounded" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                <Bell size={40} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Chưa có thông báo nào</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">Chúng tôi sẽ báo cho bạn khi có tin mới!</p>
              </div>
            </div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={async () => {
                  if (!notif.read) await markAsRead(notif.id);
                  onBack();
                  onNavigateToSource?.(notif);
                }}
                className={cn(
                  "p-4 rounded-[2rem] border transition-all flex gap-4 items-start cursor-pointer active:scale-[0.98]",
                  notif.read ? "bg-white border-slate-100" : "bg-indigo-50/50 border-indigo-100 shadow-sm"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  notif.read ? "bg-slate-50" : "bg-white shadow-sm"
                )}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1 text-left">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-slate-900 text-sm">{notif.title}</h3>
                    <span className="text-[10px] font-bold text-slate-400">{formatTime(notif.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.message}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
