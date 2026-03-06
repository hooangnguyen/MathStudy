import React from 'react';
import { Bell, X, Zap, Trophy, MessageSquare, Star, ChevronRight, FileText, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/utils';

interface Notification {
  id: string;
  type: 'duel' | 'system' | 'achievement' | 'ai' | 'submission' | 'student_join';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationsProps {
  onBack: () => void;
  userRole?: 'student' | 'teacher';
}

export const Notifications: React.FC<NotificationsProps> = ({ onBack, userRole = 'student' }) => {
  const studentNotifications: Notification[] = [
    {
      id: '1',
      type: 'duel',
      title: 'Thách đấu mới!',
      message: 'Hoàng Nam vừa thách đấu bạn trong Đấu trường Số học.',
      time: '2 phút trước',
      read: false
    },
    {
      id: '2',
      type: 'achievement',
      title: 'Thăng hạng!',
      message: 'Chúc mừng! Bạn đã đạt hạng Kim Cương III.',
      time: '1 giờ trước',
      read: false
    },
    {
      id: '4',
      type: 'system',
      title: 'Cập nhật hệ thống',
      message: 'MathMastery vừa cập nhật thêm 50 bài tập mới cho Lớp 5.',
      time: '1 ngày trước',
      read: true
    }
  ];

  const teacherNotifications: Notification[] = [
    {
      id: 't1',
      type: 'submission',
      title: 'Nộp bài mới',
      message: 'Có 15 học sinh lớp 5A vừa nộp bài tập "Phép cộng phân số".',
      time: '10 phút trước',
      read: false
    },
    {
      id: 't2',
      type: 'student_join',
      title: 'Học sinh mới tham gia',
      message: 'Học sinh Nguyễn Văn A vừa tham gia lớp 5B bằng mã lớp.',
      time: '2 giờ trước',
      read: false
    },
    {
      id: 't3',
      type: 'system',
      title: 'Báo cáo tuần',
      message: 'Báo cáo hiệu suất học tập tuần này của các lớp đã sẵn sàng.',
      time: '1 ngày trước',
      read: true
    }
  ];

  const notifications = userRole === 'teacher' ? teacherNotifications : studentNotifications;

  const getIcon = (type: string) => {
    switch (type) {
      case 'duel': return <Zap className="text-orange-500" size={20} />;
      case 'achievement': return <Trophy className="text-yellow-500" size={20} />;
      case 'submission': return <FileText className="text-indigo-500" size={20} />;
      case 'student_join': return <Users className="text-emerald-500" size={20} />;
      default: return <Bell className="text-blue-500" size={20} />;
    }
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
        className="relative bg-white rounded-t-[3rem] shadow-2xl max-h-[85%] flex flex-col overflow-hidden"
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />

        <div className="p-6 pt-2 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-black">Thông báo</h1>
          <button className="text-xs font-bold text-primary uppercase tracking-wider">Đánh dấu đã đọc</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-3 no-scrollbar pb-10">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "p-4 rounded-[2rem] border transition-all flex gap-4 items-start",
                notif.read ? "bg-white border-slate-100" : "bg-indigo-50/50 border-indigo-100 shadow-sm"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                notif.read ? "bg-slate-50" : "bg-white shadow-sm"
              )}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-slate-900 text-sm">{notif.title}</h3>
                  <span className="text-[10px] font-bold text-slate-400">{notif.time}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
