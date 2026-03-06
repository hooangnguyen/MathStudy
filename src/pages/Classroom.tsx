import React, { useState } from 'react';
import { BookOpen, Users, Target, ChevronRight, Plus, MessageSquare, Search, Filter, Star, Trophy, Flame, Calendar, Clock, CheckCircle2, PlayCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/utils';

interface ClassroomProps {
  studentClass: { id: string, name: string, teacher: string } | null;
  onJoinClass: (cls: { id: string, name: string, teacher: string } | null) => void;
}

const assignments = [
  { id: 1, title: 'Ôn tập phép cộng phân số', dueDate: 'Hôm nay, 23:59', status: 'pending', type: 'homework', score: null },
  { id: 2, title: 'Kiểm tra 15 phút', dueDate: 'Ngày mai, 10:00', status: 'pending', type: 'quiz', score: null },
  { id: 3, title: 'Bài tập cuối tuần', dueDate: 'Chủ nhật', status: 'completed', type: 'homework', score: '9/10' },
];

const classmates = [
  { name: 'Lê Bảo Ngọc', status: 'online', rank: 1, score: 1450, avatar: 'https://i.pravatar.cc/150?u=1' },
  { name: 'Trần Đức Anh', status: 'offline', rank: 2, score: 1320, avatar: 'https://i.pravatar.cc/150?u=2' },
  { name: 'Bạn (Hoàng Nam)', status: 'online', rank: 3, score: 1250, avatar: 'https://i.pravatar.cc/150?u=3', isMe: true },
  { name: 'Phạm Mai Anh', status: 'offline', rank: 4, score: 1100, avatar: 'https://i.pravatar.cc/150?u=4' },
];

export const Classroom: React.FC<ClassroomProps> = ({ studentClass, onJoinClass }) => {
  const [classCode, setClassCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleJoinClass = () => {
    if (!classCode.trim()) return;
    setIsJoining(true);
    // Simulate joining class
    setTimeout(() => {
      if (classCode === 'MATH5A') {
        onJoinClass({ id: 'MATH5A', name: 'Toán 5A', teacher: 'Cô Thu Hương' });
        setClassCode('');
        setShowJoinModal(false);
      } else {
        alert('Mã lớp không tồn tại! Thử với MATH5A');
      }
      setIsJoining(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-[#f7f7f7] font-sans relative">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Lớp học</h1>
            {studentClass && (
              <p className="text-sm font-bold text-slate-500">{studentClass.name} • {studentClass.teacher}</p>
            )}
          </div>
          {studentClass && (
            <button 
              onClick={() => setShowJoinModal(true)}
              className="w-10 h-10 rounded-2xl bg-[#1cb0f6]/10 flex items-center justify-center text-[#1cb0f6] hover:bg-[#1cb0f6]/20 transition-colors"
            >
              <Plus size={24} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-24">
        <div className="max-w-md mx-auto space-y-8">
          {studentClass ? (
            <div className="space-y-8">
              {/* Class Stats Card */}
              <div className="bg-[#58cc02] rounded-3xl p-6 text-white shadow-[0_6px_0_#46a302] relative overflow-hidden block">
                <div className="relative z-10">
                  <button 
                    onClick={() => setShowLeaderboard(true)}
                    className="w-full flex items-center justify-between mb-6 text-left active:scale-95 transition-transform"
                  >
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Trophy size={28} className="text-white" />
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-sm font-bold text-white/80 uppercase tracking-wider">Hạng của bạn</p>
                        <p className="text-3xl font-black">#3</p>
                      </div>
                      <ChevronRight size={24} className="text-white/80" />
                    </div>
                  </button>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Star size={16} className="text-yellow-300 fill-yellow-300" />
                        <span className="text-xs font-bold text-white/80 uppercase">Điểm bài gần nhất</span>
                      </div>
                      <p className="text-xl font-black">9/10</p>
                    </div>
                    <button 
                      onClick={() => setShowCalendar(true)}
                      className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm text-left active:scale-95 transition-transform"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Flame size={16} className="text-orange-300 fill-orange-300" />
                        <span className="text-xs font-bold text-white/80 uppercase">Chuỗi ngày</span>
                      </div>
                      <p className="text-xl font-black">14</p>
                    </button>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-xl" />
              </div>

              {/* Assignments */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-slate-900">Bài tập</h2>
                  <span className="text-sm font-bold text-[#1cb0f6]">1/3 Bài tuần này</span>
                </div>
                
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div 
                      key={assignment.id}
                      className={cn(
                        "bg-white rounded-3xl p-5 border-2 shadow-sm flex items-center gap-4 transition-all",
                        assignment.status === 'completed' 
                          ? "border-slate-200 opacity-75" 
                          : "border-slate-200 hover:border-[#1cb0f6]"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        assignment.status === 'completed' ? "bg-emerald-100 text-emerald-500" :
                        assignment.type === 'quiz' ? "bg-rose-100 text-rose-500" : "bg-blue-100 text-blue-500"
                      )}>
                        {assignment.status === 'completed' ? <CheckCircle2 size={24} /> : 
                         assignment.type === 'quiz' ? <Target size={24} /> : <BookOpen size={24} />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "text-base font-bold truncate",
                          assignment.status === 'completed' ? "text-slate-500 line-through" : "text-slate-900"
                        )}>
                          {assignment.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className={cn(
                            "text-xs font-bold flex items-center gap-1",
                            assignment.status === 'completed' ? "text-slate-400" : "text-orange-500"
                          )}>
                            <Calendar size={12} />
                            {assignment.dueDate}
                          </p>
                          {assignment.score && (
                            <p className="text-xs font-bold text-[#58cc02] flex items-center gap-1">
                              Điểm: {assignment.score}
                            </p>
                          )}
                        </div>
                      </div>

                      {assignment.status !== 'completed' ? (
                        <button className="px-4 py-2 bg-[#1cb0f6] text-white rounded-xl font-bold text-sm shadow-[0_4px_0_#1899d6] active:shadow-[0_0_0_#1899d6] active:translate-y-1 transition-all shrink-0">
                          Làm bài
                        </button>
                      ) : (
                        <div className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm shrink-0">
                          Đã nộp
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Learning Progress */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-slate-900">Tiến độ học tập</h2>
                </div>
                <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-5">
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-slate-500">Hoàn thành bài tập</span>
                      <span className="text-[#58cc02]">85%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#58cc02] rounded-full w-[85%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-slate-500">Độ chính xác</span>
                      <span className="text-[#1cb0f6]">92%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1cb0f6] rounded-full w-[92%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 pt-8">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-[#1cb0f6] mx-auto">
                  <Users size={48} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Tham gia lớp học</h2>
                  <p className="text-sm font-medium text-slate-500 max-w-[240px] mx-auto">
                    Nhập mã lớp từ giáo viên để nhận bài tập và thi đua cùng bạn bè.
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mã lớp học</label>
                  <input 
                    type="text" 
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="VÍ DỤ: MATH5A"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#1cb0f6] focus:bg-white rounded-2xl py-4 px-5 outline-none transition-all font-black text-lg tracking-widest placeholder:text-slate-300 placeholder:font-medium"
                  />
                </div>
                <button 
                  onClick={handleJoinClass}
                  disabled={isJoining || !classCode}
                  className="w-full bg-[#58cc02] text-white py-4 rounded-2xl font-black text-lg shadow-[0_4px_0_#46a302] active:shadow-[0_0_0_#46a302] active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isJoining ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    'Tham gia ngay'
                  )}
                </button>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-100 flex gap-3 items-start">
                <Target size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Gợi ý thử nghiệm</p>
                  <p className="text-xs font-medium text-amber-700 mt-1">
                    Sử dụng mã <span className="font-black bg-amber-200 px-1 rounded">MATH5A</span> để dùng thử tính năng.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Overlay */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 bg-[#f7f7f7] flex flex-col"
          >
            <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-xl font-black text-slate-900">Bảng xếp hạng lớp</h2>
              <button 
                onClick={() => setShowLeaderboard(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 no-scrollbar">
              {classmates.map((member, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "p-4 rounded-3xl border-2 flex items-center justify-between",
                    member.isMe ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 font-black text-lg text-center",
                      i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-slate-400"
                    )}>
                      {member.rank}
                    </div>
                    <img 
                      src={member.avatar} 
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className={cn(
                        "text-base font-bold",
                        member.isMe ? "text-indigo-900" : "text-slate-900"
                      )}>
                        {member.name}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        {member.score} điểm
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Overlay */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 bg-[#f7f7f7] flex flex-col"
          >
            <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-xl font-black text-slate-900">Lịch học tập</h2>
              <button 
                onClick={() => setShowCalendar(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 no-scrollbar">
              <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-slate-900">Tháng 3, 2026</h3>
                  <div className="flex items-center gap-2 text-sm font-bold text-orange-500">
                    <Flame size={18} className="fill-orange-500" />
                    14 ngày
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-slate-400">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {/* Empty slots for offset (assume month starts on Sunday for demo) */}
                  {Array.from({ length: 6 }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    const status = day < 15 ? (day === 5 ? 'missed' : 'completed') : day === 15 ? 'today' : 'future';
                    return (
                      <div key={day} className="aspect-square flex items-center justify-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          status === 'completed' ? "bg-[#58cc02] text-white shadow-[0_2px_0_#46a302]" :
                          status === 'missed' ? "bg-rose-100 text-rose-500" :
                          status === 'today' ? "bg-orange-100 text-orange-600 border-2 border-orange-500" :
                          "text-slate-400"
                        )}>
                          {status === 'completed' ? <CheckCircle2 size={16} /> :
                           status === 'missed' ? <X size={16} /> : day}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <div className="w-6 h-6 rounded-full bg-[#58cc02] flex items-center justify-center text-white"><CheckCircle2 size={12} /></div>
                    Đã hoàn thành bài tập
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center"><X size={12} /></div>
                    Chưa hoàn thành
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Join Class Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900">Tham gia lớp khác</h2>
                <button 
                  onClick={() => setShowJoinModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mã lớp học</label>
                  <input 
                    type="text" 
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="VÍ DỤ: MATH5A"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#1cb0f6] focus:bg-white rounded-2xl py-4 px-5 outline-none transition-all font-black text-lg tracking-widest placeholder:text-slate-300 placeholder:font-medium"
                  />
                </div>
                <button 
                  onClick={handleJoinClass}
                  disabled={isJoining || !classCode}
                  className="w-full bg-[#58cc02] text-white py-4 rounded-2xl font-black text-lg shadow-[0_4px_0_#46a302] active:shadow-[0_0_0_#46a302] active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isJoining ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    'Tham gia ngay'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
