import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFirebase } from '../context/FirebaseProvider';
import { createClass, subscribeToTeacherClasses, ClassData, reCalculateClassStats } from '../services/classService';
import { subscribeToClassAssignments, subscribeToDraftAssignments, AssignmentData, DraftAssignmentData } from '../services/assignmentService';
import { getUsersByIds, UserProfile } from '../services/userService';
import {
  Users, BookOpen, CheckCircle, Clock, TrendingUp,
  Search, Filter, MoreVertical, ChevronRight,
  MessageSquare, Bell, Settings, LogOut,
  LayoutDashboard, GraduationCap, FileText, BarChart3,
  Plus, Calendar, Target, AlertCircle, ChevronLeft, X, Copy, CheckCircle2, Trash2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { cn } from '../utils/utils';
import { AssignmentBuilder } from '../features/classroom/AssignmentBuilder';
import { Chat } from '../features/chat/Chat';
import { AssignmentGrader } from '../features/classroom/AssignmentGrader';

export const TeacherDashboard: React.FC = () => {
  const { user } = useFirebase();
  const [classesList, setClassesList] = useState<ClassData[]>([]);
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToTeacherClasses(user.uid, (classes) => {
      setClassesList(classes);
    });
    return () => unsubscribe();
  }, [user]);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classStudents, setClassStudents] = useState<UserProfile[]>([]);
  const currentClass = classesList.find(c => c.id === selectedClassId);

  useEffect(() => {
    const fetchStudents = async () => {
      if (currentClass?.studentIds && currentClass.studentIds.length > 0) {
        const students = await getUsersByIds(currentClass.studentIds);
        setClassStudents(students);
      } else {
        setClassStudents([]);
      }
    };
    fetchStudents();
  }, [currentClass]);

  const [classAssignments, setClassAssignments] = useState<AssignmentData[]>([]);
  useEffect(() => {
    if (!selectedClassId) {
      setClassAssignments([]);
      return;
    }
    const unsubscribe = subscribeToClassAssignments(selectedClassId, (assignments) => {
      setClassAssignments(assignments);
    });
    return () => unsubscribe();
  }, [selectedClassId]);



  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'students'>('overview');
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showDraftSelectionModal, setShowDraftSelectionModal] = useState(false);
  const [selectedInitialDraft, setSelectedInitialDraft] = useState<DraftAssignmentData | undefined>(undefined);
  const [activeChatStudent, setActiveChatStudent] = useState<string | null>(null);
  const [viewingStudentProfile, setViewingStudentProfile] = useState<any | null>(null);
  const [gradingAssignment, setGradingAssignment] = useState<any | null>(null);

  // Drafts state
  const [draftsList, setDraftsList] = useState<DraftAssignmentData[]>([]);
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToDraftAssignments(user.uid, (drafts) => {
      setDraftsList(drafts);
    });
    return () => unsubscribe();
  }, [user]);

  // Create Class State
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('5');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !user) return;
    setIsCreatingClass(true);
    try {
      const newClass = await createClass(user.uid, newClassName, parseInt(newClassGrade));
      setGeneratedCode(newClass.code);
    } catch (error) {
      console.error("Failed to create class", error);
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const handleRefreshStats = async (e: React.MouseEvent, classId: string) => {
    e.stopPropagation();
    setIsRefreshing(classId);
    try {
      await reCalculateClassStats(classId);
    } catch (error) {
      console.error("Failed to refresh stats", error);
    } finally {
      setIsRefreshing(null);
    }
  };

  const renderClassList = () => (
    <div className="space-y-6 px-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Danh sách lớp học</h3>
        <button
          onClick={() => setShowCreateClass(true)}
          className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {classesList.map((cls) => (
          <div
            key={cls.id}
            onClick={() => setSelectedClassId(cls.id)}
            className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Users size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">{cls.name}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cls.studentCount} Học sinh</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleRefreshStats(e, cls.id)}
                  disabled={isRefreshing === cls.id}
                  className={cn(
                    "w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all",
                    isRefreshing === cls.id && "animate-spin"
                  )}
                  title="Làm mới dữ liệu"
                >
                  <RefreshCw size={16} />
                </button>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tỉ lệ nộp bài</p>
                <div className="flex items-end gap-2">
                  <p className="text-xl font-black text-slate-900">{(cls.submitted || 0)}/{(cls.totalExpectedSubmissions || 0)}</p>
                  <p className="text-xs font-bold text-emerald-500 mb-1">
                    {cls.totalExpectedSubmissions > 0 ? Math.round(((cls.submitted || 0) / cls.totalExpectedSubmissions) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Điểm trung bình</p>
                <p className="text-xl font-black text-indigo-600">{cls.avgScore}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white mb-3 shadow-lg shadow-indigo-200">
              <Users size={20} />
            </div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sĩ số</p>
            <p className="text-2xl font-black text-indigo-900">{currentClass?.studentCount || 40}</p>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-10 -mt-10 blur-xl" />
        </div>
        <div
          className="bg-amber-50 p-4 rounded-3xl border border-amber-100 relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
          onClick={() => {
            navigator.clipboard.writeText(currentClass?.code || 'MATH5A');
            alert(`Đã copy mã lớp: ${currentClass?.code || 'MATH5A'}`);
          }}
        >
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white mb-3 shadow-lg shadow-amber-200">
              <Target size={20} />
            </div>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Mã lớp (Nhấn để copy)</p>
            <p className="text-2xl font-black text-amber-900">{currentClass?.code || 'MATH5A'}</p>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 blur-xl" />
        </div>
      </div>

      {/* Quick Action: Create Assignment */}
      <button
        onClick={() => setShowDraftSelectionModal(true)}
        className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <div className="text-left">
            <h4 className="text-lg font-black text-slate-900">Giao bài tập mới</h4>
            <p className="text-sm font-bold text-slate-400">Tạo câu hỏi và giao cho học sinh ngay</p>
          </div>
        </div>
        <ChevronRight size={24} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
      </button>



      {/* Active Assignments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Bài tập đã giao</h3>
        </div>

        <div className="space-y-4">
          {classAssignments.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-[2rem] border border-slate-100">
              <FileText size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-400">Chưa có bài tập nào được giao.</p>
            </div>
          ) : (
            classAssignments.map(assignment => (
              <div key={assignment.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                    assignment.status === 'Đang diễn ra' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                  )}>
                    {assignment.status}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Hạn: {assignment.dueDate ? (() => {
                      const d = assignment.dueDate.toDate();
                      const pad = (n: number) => n.toString().padStart(2, '0');
                      return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                    })() : 'Không giới hạn'}
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">{assignment.title}</h4>
                  <p className="text-xs font-bold text-slate-400">Lớp {currentClass?.name} • {assignment.total} học sinh</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black">
                    <span className="text-slate-400">Tiến độ nộp bài</span>
                    <span className="text-slate-900">{assignment.completed}/{assignment.total}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${assignment.total > 0 ? (assignment.completed / assignment.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setGradingAssignment(assignment)}
                  className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Chấm bài chi tiết
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-x-hidden overflow-y-auto no-scrollbar bg-slate-50 pb-20">
      {/* Header */}
      <header className="p-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedClassId && (
            <button
              onClick={() => setSelectedClassId(null)}
              className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-black text-slate-900">Lớp học</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {selectedClassId ? `${currentClass?.name} • Cô Thu Hương` : 'Quản lý lớp học'}
            </p>
          </div>
        </div>

        {selectedClassId && (
          <button
            onClick={() => setShowDraftSelectionModal(true)}
            className="px-6 py-2.5 bg-[#1cb0f6] text-white rounded-2xl font-black shadow-[0_4px_0_#1899d6] active:shadow-[0_0_0_#1899d6] active:translate-y-1 transition-all text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            Giao bài
          </button>
        )}
      </header>

      {!selectedClassId ? (
        <div className="py-4">
          {renderClassList()}
        </div>
      ) : (
        <>
          {/* Sub-tabs */}
          <div className="px-6 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Tổng quan' },
              { id: 'students', label: 'Học sinh' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all",
                  activeSubTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-400 border border-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="px-6 py-2">
            {activeSubTab === 'overview' && renderOverview()}
            {activeSubTab === 'students' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Danh sách lớp</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">Sắp xếp:</span>
                    <select className="text-[10px] font-black text-indigo-600 bg-transparent outline-none">
                      <option>Tên A-Z</option>
                      <option>Điểm cao</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  {classStudents.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-3xl border border-slate-100">
                      <Users size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-400">Chưa có học sinh nào tham gia lớp này.</p>
                    </div>
                  ) : (
                    classStudents.map(student => (
                      <div key={student.uid} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="relative cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setViewingStudentProfile(student)}>
                            <img
                              src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.uid}`}
                              className="w-12 h-12 rounded-2xl object-cover bg-slate-50 border border-slate-100"
                              referrerPolicy="no-referrer"
                            />
                            <div className={cn(
                              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                              "bg-slate-300" // Mock status or derive from lastActive
                            )} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setViewingStudentProfile(student)}>{student.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">Chuỗi ngày: {student.streak} • Điểm: {student.points}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveChatStudent(student.name)}
                            className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc chắn muốn xóa học sinh ${student.name} khỏi lớp?`)) {
                                // Handle delete
                                alert('Chức năng xóa học sinh đang được phát triển.');
                              }
                            }}
                            className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Overlays */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showCreateClass && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[100] bg-white flex flex-col md:rounded-l-3xl md:left-64 md:w-[calc(100%-16rem)]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <button onClick={() => {
                  setShowCreateClass(false);
                  setGeneratedCode('');
                  setNewClassName('');
                }} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors">
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-xl font-black text-slate-900">Tạo lớp học mới</h3>
                <div className="w-10" />
              </div>

              <div className="flex-1 overflow-y-auto p-6 no-scrollbar bg-slate-50">
                <div className="max-w-md mx-auto space-y-8">
                  {!generatedCode ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6"
                    >
                      <div className="w-16 h-16 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto mb-6">
                        <Users size={32} />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tên lớp học</label>
                        <input
                          type="text"
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          placeholder="Ví dụ: Toán 5A"
                          className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl text-base font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none placeholder:text-slate-300"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Khối lớp</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(grade => (
                            <button
                              key={grade}
                              onClick={() => setNewClassGrade(grade)}
                              className={cn(
                                "p-3 rounded-2xl border-2 text-sm font-black transition-all",
                                newClassGrade === grade
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                                  : "border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50"
                              )}
                            >
                              Khối {grade}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleCreateClass}
                        disabled={!newClassName.trim() || isCreatingClass}
                        className="w-full py-5 mt-4 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCreatingClass ? 'Đang tạo...' : <>Tạo lớp ngay <Plus size={20} /></>}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 text-center"
                    >
                      <div className="w-20 h-20 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 mx-auto">
                        <CheckCircle2 size={40} />
                      </div>

                      <div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Tạo lớp thành công!</h3>
                        <p className="text-sm font-bold text-slate-400">Lớp <span className="text-indigo-600">{newClassName}</span> đã sẵn sàng.</p>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mã tham gia lớp học</p>
                        <p className="text-4xl font-black text-indigo-600 tracking-[0.2em]">{generatedCode}</p>

                        <button
                          onClick={handleCopyCode}
                          className="mt-6 w-full py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors active:scale-95"
                        >
                          {isCopied ? (
                            <><CheckCircle2 size={18} /> Đã sao chép</>
                          ) : (
                            <><Copy size={18} /> Sao chép mã</>
                          )}
                        </button>
                      </div>

                      <p className="text-xs font-bold text-slate-400 leading-relaxed px-4">
                        Hãy gửi mã này cho học sinh để các em có thể tham gia vào lớp học của bạn.
                      </p>

                      <button
                        onClick={() => {
                          setShowCreateClass(false);
                          setGeneratedCode('');
                          setNewClassName('');
                        }}
                        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-200 active:scale-95 transition-all"
                      >
                        Đóng
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}



          {showDraftSelectionModal && currentClass && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6"
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl max-h-[80vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-xl font-black text-slate-900">Giao bài cho lớp {currentClass.name}</h3>
                  <button
                    onClick={() => setShowDraftSelectionModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                  <button
                    onClick={() => {
                      setSelectedInitialDraft(undefined);
                      setShowDraftSelectionModal(false);
                      setShowCreateAssignment(true);
                    }}
                    className="w-full bg-indigo-50 p-4 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-600 flex flex-col items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
                  >
                    <Plus size={24} />
                    <span className="font-bold text-sm">Tạo bài mới hoàn toàn</span>
                  </button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-slate-500 font-bold uppercase tracking-wider text-[10px]">Hoặc chọn từ bản nháp</span>
                    </div>
                  </div>

                  {draftsList.map(draft => (
                    <button
                      key={draft.id}
                      onClick={() => {
                        setSelectedInitialDraft(draft);
                        setShowDraftSelectionModal(false);
                        setShowCreateAssignment(true);
                      }}
                      className="w-full bg-white p-4 rounded-2xl border border-slate-200 text-left hover:border-indigo-500 hover:shadow-md transition-all group"
                    >
                      <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{draft.title}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs font-bold text-slate-400">{draft.questions?.length || 0} câu hỏi</p>
                        <p className="text-[10px] font-bold text-slate-400">Tạo: {draft.updatedAt ? new Date(draft.updatedAt.toMillis()).toLocaleDateString('vi-VN') : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {showCreateAssignment && currentClass && (
            <AssignmentBuilder
              classId={currentClass.id}
              totalStudents={currentClass.studentCount}
              initialDraft={selectedInitialDraft}
              onClose={() => setShowCreateAssignment(false)}
            />
          )}
          {activeChatStudent && (
            <Chat
              onClose={() => setActiveChatStudent(null)}
              studentName={activeChatStudent}
              isTeacherView={true}
            />
          )}

          {viewingStudentProfile && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[100] bg-white flex flex-col md:rounded-l-3xl md:left-64 md:w-[calc(100%-16rem)]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <button onClick={() => setViewingStudentProfile(null)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors">
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-xl font-black text-slate-900">Hồ sơ học sinh</h3>
                <div className="w-10" />
              </div>

              <div className="flex-1 overflow-y-auto p-6 no-scrollbar bg-slate-50">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <img
                      src={viewingStudentProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewingStudentProfile.uid}`}
                      className="w-24 h-24 rounded-[2rem] object-cover bg-slate-50 border border-slate-100 mb-4 shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                    <h2 className="text-2xl font-black text-slate-900">{viewingStudentProfile.name}</h2>
                    <p className="text-sm font-bold text-slate-400 mt-1">Lớp {currentClass?.name}</p>

                    <div className="grid grid-cols-2 gap-4 w-full mt-6">
                      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Tổng điểm</p>
                        <p className="text-2xl font-black text-indigo-900">{viewingStudentProfile.points}</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Chuỗi ngày</p>
                        <p className="text-2xl font-black text-emerald-900">{viewingStudentProfile.streak}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Thành tích nổi bật</h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                      <div className="min-w-[100px] bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-2xl text-white flex flex-col items-center justify-center gap-2 shadow-lg shadow-orange-200">
                        <span className="text-2xl">⭐</span>
                        <span className="text-[10px] font-bold text-center">Thợ săn sao</span>
                      </div>
                      <div className="min-w-[100px] bg-gradient-to-br from-indigo-400 to-purple-600 p-4 rounded-2xl text-white flex flex-col items-center justify-center gap-2 shadow-lg shadow-purple-200">
                        <span className="text-2xl">⚔️</span>
                        <span className="text-[10px] font-bold text-center">Chiến thần</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {gradingAssignment && (
            <AssignmentGrader
              onClose={() => setGradingAssignment(null)}
              assignmentTitle={gradingAssignment.title}
              className={currentClass?.name || gradingAssignment.class}
              classId={gradingAssignment.classId || selectedClassId || ''}
              assignmentId={gradingAssignment.id || ''}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
