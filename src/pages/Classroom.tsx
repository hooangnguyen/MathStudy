import React, { useState } from 'react';
import { BookOpen, Users, Target, ChevronRight, Plus, MessageSquare, Search, Filter, Star, Trophy, Flame, Calendar, Clock, CheckCircle2, PlayCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/utils';

import { subscribeToStudentClass, joinClass, ClassData } from '../services/classService';
import { subscribeToClassAssignments, getStudentSubmissions, AssignmentData, SubmissionData } from '../services/assignmentService';
import { getUsersByIds, UserProfile } from '../services/userService';
import { useFirebase } from '../context/FirebaseProvider';
import { AssignmentViewer } from '../features/classroom/AssignmentViewer';
import { AssignmentResultView } from '../features/classroom/AssignmentResultView';

interface ClassroomProps {
  enrolledClassId?: string;
  onJoinSuccess: (classId: string) => void;
}

export const Classroom: React.FC<ClassroomProps> = ({ enrolledClassId, onJoinSuccess }) => {
  const { user } = useFirebase();
  const [studentClass, setStudentClass] = useState<ClassData | null>(null);
  const [classCode, setClassCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classAssignments, setClassAssignments] = useState<AssignmentData[]>([]);
  const [studentSubmissions, setStudentSubmissions] = useState<Record<string, SubmissionData>>({});
  const [takingAssignment, setTakingAssignment] = useState<AssignmentData | null>(null);
  const [viewingResult, setViewingResult] = useState<{ submission: SubmissionData, title: string } | null>(null);

  // Stats states
  const [classRankings, setClassRankings] = useState<UserProfile[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [latestScore, setLatestScore] = useState<number | null>(null);

  React.useEffect(() => {
    if (!enrolledClassId) return;
    const unsubscribe = subscribeToStudentClass(enrolledClassId, async (data) => {
      setStudentClass(data);
      if (data && data.studentIds) {
        const profiles = await getUsersByIds(data.studentIds);
        // Sort by points descending
        const sorted = profiles.sort((a, b) => (b.points || 0) - (a.points || 0));
        setClassRankings(sorted);
        const rankIndex = sorted.findIndex(p => p.uid === user?.uid);
        setMyRank(rankIndex !== -1 ? rankIndex + 1 : null);
      }
    });

    const unsubAssignments = subscribeToClassAssignments(enrolledClassId, (assignments) => {
      setClassAssignments(assignments);
    });

    return () => {
      unsubscribe();
      unsubAssignments();
    };
  }, [enrolledClassId]);

  React.useEffect(() => {
    const fetchSubmissions = async () => {
      if (!enrolledClassId || !user || classAssignments.length === 0) return;
      const ids = classAssignments.map(a => a.id);
      const subs = await getStudentSubmissions(enrolledClassId, user.uid, ids);
      setStudentSubmissions(subs);

      // Calculate latest score
      const subList = Object.values(subs);
      if (subList.length > 0) {
        // Sort by submittedAt descending (newest first)
        subList.sort((a, b) => {
          if (!a.submittedAt) return 1;
          if (!b.submittedAt) return -1;
          return b.submittedAt.toMillis() - a.submittedAt.toMillis();
        });
        setLatestScore(subList[0].score);
      } else {
        setLatestScore(null);
      }
    };
    fetchSubmissions();
  }, [classAssignments, enrolledClassId, user]);

  // Derived Statistics
  const totalAssigned = classAssignments.length;
  const totalCompleted = Object.keys(studentSubmissions).length;
  const completionPercentage = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  let totalScoreSum = 0;
  Object.values(studentSubmissions).forEach(sub => totalScoreSum += sub.score);
  // Base score is out of 10. Accuracy is average score / 10 * 100.
  const accuracyPercentage = totalCompleted > 0 ? Math.round((totalScoreSum / totalCompleted) * 10) : 0;

  const handleJoinClass = async () => {
    if (!classCode.trim() || !user) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const cls = await joinClass(user.uid, classCode);
      onJoinSuccess(cls.id);
      setClassCode('');
      setShowJoinModal(false);
    } catch (error: any) {
      setJoinError(error.message || 'Lỗi khi tham gia lớp học');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f7f7f7] font-sans relative">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Lớp học</h1>
            {studentClass && (
              <p className="text-sm font-bold text-slate-500">{studentClass.name}</p>
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
                        <p className="text-3xl font-black">{myRank ? `#${myRank}` : '--'}</p>
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
                      <p className="text-xl font-black">{latestScore !== null ? `${latestScore}/10` : '--'}</p>
                    </div>
                    <button
                      onClick={() => setShowCalendar(true)}
                      className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm text-left active:scale-95 transition-transform"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Flame size={16} className="text-orange-300 fill-orange-300" />
                        <span className="text-xs font-bold text-white/80 uppercase">Chuỗi ngày</span>
                      </div>
                      {/* Using finding user profile from classRankings to get streak, or fallback to 0 */}
                      <p className="text-xl font-black">{classRankings.find(p => p.uid === user?.uid)?.streak || 0}</p>
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
                  <span className="text-sm font-bold text-[#1cb0f6]">{Object.keys(studentSubmissions).length}/{classAssignments.length} Bài đã làm</span>
                </div>

                <div className="space-y-4">
                  {classAssignments.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm font-bold text-slate-400">Chưa có bài tập nào.</p>
                    </div>
                  ) : classAssignments.map((assignment) => {
                    const submission = studentSubmissions[assignment.id];
                    const isCompleted = !!submission;

                    let dueDateStr = 'Không giới hạn';
                    if (assignment.dueDate) {
                      const d = assignment.dueDate.toDate();
                      const pad = (n: number) => n.toString().padStart(2, '0');
                      dueDateStr = `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                    }

                    return (
                      <div
                        key={assignment.id}
                        className={cn(
                          "bg-white rounded-3xl p-5 border-2 shadow-sm flex items-center gap-4 transition-all",
                          isCompleted
                            ? "border-slate-200 opacity-75"
                            : "border-slate-200 hover:border-[#1cb0f6]"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                          isCompleted ? "bg-emerald-100 text-emerald-500" : "bg-blue-100 text-blue-500"
                        )}>
                          {isCompleted ? <CheckCircle2 size={24} /> : <BookOpen size={24} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={cn(
                            "text-base font-bold truncate",
                            isCompleted ? "text-slate-500 line-through" : "text-slate-900"
                          )}>
                            {assignment.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <p className={cn(
                              "text-xs font-bold flex items-center gap-1",
                              isCompleted ? "text-slate-400" : "text-orange-500"
                            )}>
                              <Calendar size={12} />
                              {dueDateStr}
                            </p>
                            {isCompleted && assignment.settings?.showScoreImmediate && (
                              <p className="text-xs font-bold text-[#58cc02] flex items-center gap-1">
                                Điểm: {submission.score}/10
                              </p>
                            )}
                          </div>
                        </div>

                        {!isCompleted ? (
                          <button
                            onClick={() => setTakingAssignment(assignment)}
                            className="px-4 py-2 bg-[#1cb0f6] text-white rounded-xl font-bold text-sm shadow-[0_4px_0_#1899d6] active:shadow-[0_0_0_#1899d6] active:translate-y-1 transition-all shrink-0"
                          >
                            Làm bài
                          </button>
                        ) : (
                          <button
                            onClick={() => setViewingResult({ submission, title: assignment.title })}
                            className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-200 hover:text-slate-600 transition-colors shrink-0"
                          >
                            Xem bài
                          </button>
                        )}
                      </div>
                    );
                  })}
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
                      <span className={cn(completionPercentage === 100 ? "text-[#58cc02]" : "text-[#1cb0f6]")}>{completionPercentage}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", completionPercentage === 100 ? "bg-[#58cc02]" : "bg-[#1cb0f6]")} style={{ width: `${completionPercentage}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-slate-500">Độ chính xác</span>
                      <span className={cn(accuracyPercentage >= 80 ? "text-[#58cc02]" : accuracyPercentage >= 50 ? "text-orange-400" : "text-rose-500")}>{accuracyPercentage}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", accuracyPercentage >= 80 ? "bg-[#58cc02]" : accuracyPercentage >= 50 ? "bg-orange-400" : "bg-rose-500")} style={{ width: `${accuracyPercentage}%` }} />
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
                    onChange={(e) => {
                      setClassCode(e.target.value.toUpperCase());
                      setJoinError(null);
                    }}
                    placeholder="VÍ DỤ: MATH5A"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#1cb0f6] focus:bg-white rounded-2xl py-4 px-5 outline-none transition-all font-black text-lg tracking-widest placeholder:text-slate-300 placeholder:font-medium"
                  />
                  {joinError && <p className="text-xs font-bold text-rose-500 ml-1">{joinError}</p>}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {classRankings.length === 0 ? (
                <div className="text-center py-6 text-slate-500">Chưa có dữ liệu xếp hạng</div>
              ) : (
                classRankings.map((mate, i) => (
                  <div
                    key={mate.uid}
                    className={cn(
                      "bg-slate-50 rounded-2xl p-4 flex items-center justify-between",
                      mate.uid === user?.uid && "border-2 border-[#1cb0f6] bg-[#1cb0f6]/5 relative z-10"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm",
                        i === 0 ? "bg-yellow-100 text-yellow-600" :
                          i === 1 ? "bg-slate-200 text-slate-600" :
                            i === 2 ? "bg-orange-100 text-orange-600" :
                              "bg-slate-100 text-slate-400"
                      )}>
                        {i + 1}
                      </div>
                      <div className="relative">
                        <img src={mate.avatar || 'https://picsum.photos/seed/student/100'} alt={mate.name} className="w-12 h-12 rounded-xl object-cover" />
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                          // In a real app we might have a presence system. Mocking online state randomly here or just defaulting to online.
                          "bg-emerald-500"
                        )} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                          {mate.name}
                          {mate.uid === user?.uid && (
                            <span className="text-[10px] bg-[#1cb0f6]/10 text-[#1cb0f6] px-2 py-0.5 rounded-full uppercase tracking-wider">Bạn</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{mate.points || 0}</p>
                      <p className="text-xs font-bold text-slate-400">Điểm</p>
                    </div>
                  </div>
                ))
              )}
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
                    onChange={(e) => {
                      setClassCode(e.target.value.toUpperCase());
                      setJoinError(null);
                    }}
                    placeholder="VÍ DỤ: MATH5A"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#1cb0f6] focus:bg-white rounded-2xl py-4 px-5 outline-none transition-all font-black text-lg tracking-widest placeholder:text-slate-300 placeholder:font-medium"
                  />
                  {joinError && <p className="text-xs font-bold text-rose-500 ml-1">{joinError}</p>}
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

      {/* Assignment Viewer */}
      <AnimatePresence>
        {takingAssignment && (
          <AssignmentViewer
            assignment={takingAssignment}
            onClose={() => setTakingAssignment(null)}
            onSubmitted={() => {
              // Optionally re-fetch submissions or update state to reflect completion
              // For now, just close the viewer.
              setTakingAssignment(null);
            }}
          />
        )}
      </AnimatePresence>
      {/* Assignment Result View */}
      <AnimatePresence>
        {viewingResult && (
          <AssignmentResultView
            submission={viewingResult.submission}
            assignmentTitle={viewingResult.title}
            onClose={() => setViewingResult(null)}
          />
        )}
      </AnimatePresence>
    </div >
  );
};
