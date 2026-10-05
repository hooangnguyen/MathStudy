import React, { useState } from 'react';
import { BookOpen, Users, Target, ChevronRight, Plus, MessageSquare, Search, Filter, Star, Trophy, Flame, Calendar, Clock, CheckCircle2, PlayCircle, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/utils';
import { Avatar } from '../components/common/Avatar';

import { subscribeToStudentClass, joinClass, ClassData, getStudentClasses } from '../services/classService';
import { subscribeToClassAssignments, getStudentSubmissions, AssignmentData, SubmissionData } from '../services/assignmentService';
import { getUsersByIds, UserProfile } from '../services/userService';
import { useFirebase } from '../context/FirebaseProvider';
import { AssignmentViewer } from '../features/classroom/AssignmentViewer';
import { AssignmentResultView } from '../features/classroom/AssignmentResultView';

interface ClassroomProps {
  enrolledClasses?: string[];
  onJoinSuccess: (classId: string) => void;
  deepLink?: {
    classId?: string;
    assignmentId?: string;
    action?: 'take' | 'result' | 'grade' | 'students';
  };
  onAssignmentInProgressChange?: (inProgress: boolean) => void;
  exitAssignmentToken?: number;
}

export const Classroom: React.FC<ClassroomProps> = ({ enrolledClasses, onJoinSuccess, deepLink, onAssignmentInProgressChange, exitAssignmentToken }) => {
  const { user } = useFirebase();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

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
  const deepLinkHandledRef = React.useRef(false);
  const lastExitTokenRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    onAssignmentInProgressChange?.(!!takingAssignment);
  }, [takingAssignment, onAssignmentInProgressChange]);

  React.useEffect(() => {
    if (exitAssignmentToken == null) return;
    if (lastExitTokenRef.current === exitAssignmentToken) return;
    lastExitTokenRef.current = exitAssignmentToken;
    setTakingAssignment(null);
  }, [exitAssignmentToken]);

  // Handle deep link class selection
  React.useEffect(() => {
    if (deepLink?.classId && !deepLinkHandledRef.current) {
      setSelectedClassId(deepLink.classId);
    }
  }, [deepLink]);

  // Fetch all classes for the list view
  React.useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return;
      setIsLoadingClasses(true);
      try {
        const classes = await getStudentClasses(user.uid);
        setAllClasses(classes);
      } catch (error) {
        console.error("Failed to load classes", error);
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [user, enrolledClasses]);

  const classesBySubject = React.useMemo(() => {
    const grouped: Record<string, ClassData[]> = {};
    allClasses.forEach(cls => {
      const subject = cls.subject || 'Khác';
      if (!grouped[subject]) grouped[subject] = [];
      grouped[subject].push(cls);
    });
    return grouped;
  }, [allClasses]);

  // Stats states for detail view
  const [classRankings, setClassRankings] = useState<UserProfile[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [latestScore, setLatestScore] = useState<number | null>(null);

  React.useEffect(() => {
    if (!selectedClassId) return;
    const unsubscribe = subscribeToStudentClass(selectedClassId, async (data) => {
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

    const unsubAssignments = subscribeToClassAssignments(selectedClassId, (assignments) => {
      setClassAssignments(assignments);
    });

    return () => {
      unsubscribe();
      unsubAssignments();
    };
  }, [selectedClassId, user?.uid]);

  React.useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedClassId || !user || classAssignments.length === 0) return;
      const ids = classAssignments.map(a => a.id);
      const subs = await getStudentSubmissions(selectedClassId, user.uid, ids);
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
  }, [classAssignments, selectedClassId, user]);

  // Open assignment/result directly when coming from a notification
  React.useEffect(() => {
    if (deepLinkHandledRef.current) return;
    if (!deepLink?.assignmentId) return;
    if (!classAssignments || classAssignments.length === 0) return;

    const assignment = classAssignments.find(a => a.id === deepLink.assignmentId);
    if (!assignment) return;

    const submission = studentSubmissions?.[assignment.id];
    const isCompleted = !!submission;

    if (deepLink.action === 'result') {
      if (!submission) return;
      deepLinkHandledRef.current = true;
      setViewingResult({ submission, title: assignment.title });
      return;
    }

    deepLinkHandledRef.current = true;
    if (!isCompleted) setTakingAssignment(assignment);
    else setViewingResult({ submission, title: assignment.title });
  }, [deepLink, classAssignments, studentSubmissions]);

  // Derived Statistics
  const totalAssigned = classAssignments.length;
  const totalCompleted = Object.keys(studentSubmissions).length;
  const completionPercentage = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  let totalScoreSum = 0;
  Object.values(studentSubmissions).forEach(sub => totalScoreSum += sub.score);
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
      
      // Auto select the new class
      setSelectedClassId(cls.id);
    } catch (error: any) {
      setJoinError(error.message || 'Lỗi khi tham gia lớp học');
    } finally {
      setIsJoining(false);
    }
  };

  const renderJoinModal = () => (
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
              <h2 className="text-xl font-black text-slate-900">Tham gia lớp học</h2>
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
  );

  // LIST VIEW: Showing all classes grouped by subject
  if (!selectedClassId) {
    return (
      <div className="flex flex-col h-full bg-slate-50 relative font-sans">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-5 py-4 sticky top-0 z-40 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Lớp học của bạn</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{allClasses.length} lớp đang tham gia</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowJoinModal(true)}
            className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors shadow-sm"
          >
            <Plus size={24} />
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar pb-24">
          <div className="max-w-4xl mx-auto space-y-8">
            {isLoadingClasses ? (
              <div className="flex justify-center py-10">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
              </div>
            ) : allClasses.length === 0 ? (
              <div className="text-center space-y-4 pt-12">
                <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-[#1cb0f6] mx-auto">
                  <Users size={48} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Chưa tham gia lớp nào</h2>
                  <p className="text-sm font-medium text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                    Hãy xin giáo viên mã lớp để tham gia và bắt đầu nhận bài tập nhé!
                  </p>
                </div>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="mt-4 px-8 py-4 bg-[#58cc02] text-white rounded-2xl font-black text-lg shadow-[0_4px_0_#46a302] active:translate-y-1 active:shadow-none transition-all"
                >
                  Nhập mã lớp
                </button>
              </div>
            ) : (
              Object.entries(classesBySubject).map(([subject, classes]) => (
                <div key={subject} className="space-y-4">
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                    <BookOpen size={16} className="text-slate-300" /> {subject}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classes.map((cls) => (
                      <motion.button
                        key={cls.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedClassId(cls.id)}
                        className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 text-left group hover:border-indigo-100 hover:shadow-md transition-all w-full"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {cls.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black text-slate-900 truncate">{cls.name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {cls.studentCount} Học sinh
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <ChevronRight size={18} />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {renderJoinModal()}
      </div>
    );
  }

  // DETAIL VIEW: Showing specific class details
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-indigo-50/20 to-rose-50/10 font-sans relative">
      {/* Background Decorative */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-rose-200/20 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-5 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedClassId(null);
              setStudentClass(null);
              setClassRankings([]);
            }}
            className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 line-clamp-1">{studentClass?.name || 'Đang tải...'}</h1>
            {studentClass?.subject && (
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Môn {studentClass.subject}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-24">
        <div className="max-w-md mx-auto space-y-8">
          {studentClass && (
            <div className="space-y-8">
              {/* Class Stats Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden block">
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-xl" />
                <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full blur-xl" />

                <div className="relative z-10">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowLeaderboard(true)}
                    className="w-full flex items-center justify-between mb-6 text-left"
                  >
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                      <Trophy size={28} className="text-white" />
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-sm font-bold text-white/80 uppercase tracking-wider">Hạng của bạn</p>
                        <p className="text-3xl font-black">{myRank ? `#${myRank}` : '--'}</p>
                      </div>
                      <ChevronRight size={24} className="text-white/80" />
                    </div>
                  </motion.button>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm shadow-md">
                      <div className="flex items-center gap-2 mb-1">
                         <Star size={16} className="text-yellow-300 fill-yellow-300" />
                         <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Điểm gần nhất</span>
                      </div>
                      <p className="text-xl font-black">{latestScore !== null ? `${latestScore}/10` : '--'}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCalendar(true)}
                      className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm text-left shadow-md"
                    >
                      <div className="flex items-center gap-2 mb-1">
                         <Flame size={16} className="text-orange-300 fill-orange-300" />
                         <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Chuỗi ngày</span>
                      </div>
                      <p className="text-xl font-black">{classRankings.find(p => p.uid === user?.uid)?.streak || 0}</p>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Assignments */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-slate-900">Bài tập</h2>
                  <span className="text-xs font-bold text-sky-500 bg-sky-50 px-2 py-1 rounded-lg">{Object.keys(studentSubmissions).length}/{classAssignments.length} Bài đã làm</span>
                </div>

                <div className="space-y-3">
                  {classAssignments.length === 0 ? (
                    <div className="text-center py-10 bg-white/50 rounded-3xl border border-dashed border-slate-200">
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
                      <motion.div
                        key={assignment.id}
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          "bg-white/80 backdrop-blur-sm rounded-[1.5rem] p-5 border border-white/50 shadow-sm flex items-center gap-4 transition-all",
                          isCompleted
                            ? "opacity-75"
                            : "hover:border-sky-200 hover:shadow-xl"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
                          isCompleted ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-sky-50 text-sky-500 border-sky-100"
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
                              "text-[10px] font-bold flex items-center gap-1 tracking-wider uppercase",
                              isCompleted ? "text-slate-400" : "text-orange-500"
                            )}>
                              <Calendar size={12} />
                              {dueDateStr}
                            </p>
                            {isCompleted && assignment.settings?.showScoreImmediate && (
                              <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 tracking-wider uppercase">
                                Điểm: {submission.score}/10
                              </p>
                            )}
                          </div>
                        </div>

                        {!isCompleted ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTakingAssignment(assignment)}
                            className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-500/25 hover:shadow-xl transition-all shrink-0"
                          >
                            Làm bài
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewingResult({ submission, title: assignment.title })}
                            className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 hover:text-slate-700 transition-colors shrink-0"
                          >
                            Xem bài
                          </motion.button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Learning Progress */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-slate-900">Tiến độ học tập</h2>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-[1.5rem] p-6 border border-white/50 shadow-sm space-y-5">
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                      <span className="text-slate-400">Hoàn thành bài tập</span>
                      <span style={{ color: completionPercentage === 100 ? '#58cc02' : '#1cb0f6' }}>{completionPercentage}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ backgroundColor: completionPercentage === 100 ? '#58cc02' : '#1cb0f6' }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                      <span className="text-slate-400">Độ chính xác</span>
                      <span style={{ color: accuracyPercentage >= 80 ? '#58cc02' : accuracyPercentage >= 50 ? '#ff9600' : '#ff4d4d' }}>{accuracyPercentage}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${accuracyPercentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        style={{ backgroundColor: accuracyPercentage >= 80 ? '#58cc02' : accuracyPercentage >= 50 ? '#ff9600' : '#ff4d4d' }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
              {classRankings.length === 0 ? (
                <div className="text-center py-6 text-slate-500 font-bold">Chưa có dữ liệu xếp hạng</div>
              ) : (
                classRankings.map((mate, i) => (
                  <div
                    key={mate.uid}
                    className={cn(
                      "bg-slate-50 rounded-2xl p-4 flex items-center justify-between",
                      mate.uid === user?.uid && "border-2 border-[#1cb0f6] bg-[#1cb0f6]/5 relative z-10 shadow-sm"
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
                        <Avatar src={mate.avatar} name={mate.name} className="w-12 h-12 rounded-xl" textClassName="text-lg" />
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                          "bg-emerald-500"
                        )} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                          {mate.name}
                          {mate.uid === user?.uid && (
                            <span className="text-[10px] font-black bg-[#1cb0f6]/10 text-[#1cb0f6] px-2 py-0.5 rounded-full uppercase tracking-wider">Bạn</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-lg">{mate.points || 0}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm</p>
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
                  <h3 className="text-lg font-black text-slate-900">Tháng này</h3>
                  <div className="flex items-center gap-2 text-sm font-bold text-orange-500">
                    <Flame size={18} className="fill-orange-500" />
                    {classRankings.find(p => p.uid === user?.uid)?.streak || 0} ngày
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

                <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <div className="w-5 h-5 rounded-full bg-[#58cc02] flex items-center justify-center text-white"><CheckCircle2 size={10} /></div>
                    Đã học bài
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center"><X size={10} /></div>
                    Chưa học
                  </div>
                </div>
              </div>
            </div>
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
