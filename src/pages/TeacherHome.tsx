import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, BookOpen, Bell, Plus, ChevronRight, Target, Calendar, BarChart3, Clock, ChevronLeft, Copy, CheckCircle2, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../context/FirebaseProvider';
import { cn } from '../utils/utils';
import { AssignmentBuilder } from '../features/classroom/AssignmentBuilder';
import { AssignmentGrader } from '../features/classroom/AssignmentGrader';
import { subscribeToDraftAssignments, deleteDraftAssignment, DraftAssignmentData, createAssignment } from '../services/assignmentService';
import { subscribeToTeacherClasses, ClassData } from '../services/classService';
import { getUserProfile, UserProfile } from '../services/userService';

export const TeacherHome: React.FC<{ onNavigate?: (tab: string) => void; onShowNotifications?: () => void; onCreateRoom?: () => void }> = ({ onNavigate, onShowNotifications, onCreateRoom }) => {
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [gradingAssignment, setGradingAssignment] = useState<any | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('5');
  const [generatedCode, setGeneratedCode] = useState('');
  const [selectedDueDate, setSelectedDueDate] = useState('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<UserProfile | null>(null);
  const { user } = useFirebase();

  // Fetch teacher profile
  useEffect(() => {
    const fetchTeacherProfile = async () => {
      if (!user) return;
      const profile = await getUserProfile(user.uid);
      setTeacherProfile(profile);
    };
    fetchTeacherProfile();
  }, [user]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  // Get teacher title based on gender
  const getTeacherTitle = () => {
    const gender = teacherProfile?.gender;
    if (gender === 'female') return 'Cô';
    if (gender === 'male') return 'Thầy';
    return 'Giáo viên';
  };

  const teacherName = teacherProfile?.name || user?.displayName || 'Giáo viên';

  const [draftAssignments, setDraftAssignments] = useState<DraftAssignmentData[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<ClassData[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const unsubscribeDrafts = subscribeToDraftAssignments(user.uid, (drafts) => {
      setDraftAssignments(drafts);
    });
    const unsubscribeClasses = subscribeToTeacherClasses(user.uid, (classes) => {
      setTeacherClasses(classes);
    });
    return () => {
      unsubscribeDrafts();
      unsubscribeClasses();
    };
  }, [user]);
  const [isCopied, setIsCopied] = useState(false);

  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    // Generate a random 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(code);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAssignClick = (draft: any) => {
    setSelectedDraft(draft);
    setShowAssignModal(true);
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản nháp này không?')) {
      try {
        await deleteDraftAssignment(draftId);
      } catch (error) {
        console.error('Error deleting draft:', error);
        alert('Đã xảy ra lỗi khi xóa bản nháp.');
      }
    }
  };

  const renderCreateClass = () => (
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
                disabled={!newClassName.trim()}
                className="w-full py-5 mt-4 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                Tạo lớp ngay <Plus size={20} />
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
                  onNavigate?.('classroom');
                }}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-200 active:scale-95 transition-all"
              >
                Đến trang quản lý lớp
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Trang chủ</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{getGreeting()}, {getTeacherTitle()} {teacherName}</p>
        </div>
        <button
          onClick={() => onShowNotifications?.()}
          className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors relative"
        >
          <Bell size={24} />
          <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-50"></span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-24">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowCreateClass(true)}
              className="bg-indigo-600 p-4 rounded-[1.5rem] text-white shadow-xl shadow-indigo-200 text-left active:scale-95 transition-transform relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                  <Plus size={18} />
                </div>
                <h3 className="text-sm font-black">Tạo lớp</h3>
                <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-0.5">Lấy mã lớp</p>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl group-hover:scale-150 transition-transform duration-500" />
            </button>

            <button
              onClick={() => setShowCreateAssignment(true)}
              className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm text-left active:scale-95 transition-transform group hover:border-indigo-500"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BookOpen size={18} />
              </div>
              <h3 className="text-sm font-black text-slate-900">Giao bài</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cho các lớp</p>
            </button>

            <button
              onClick={onCreateRoom}
              className="col-span-2 bg-gradient-to-r from-emerald-500 to-teal-500 p-5 rounded-[1.5rem] text-white shadow-xl shadow-emerald-200 text-left active:scale-95 transition-transform relative overflow-hidden group flex items-center justify-between"
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-2">
                  <Users size={20} />
                </div>
                <h3 className="text-base font-black">Tạo phòng Quiz</h3>
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">Tổ chức thi đấu trực tiếp</p>
              </div>
              <div className="relative z-10 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md group-hover:bg-white/30 transition-colors">
                <ChevronRight size={24} />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-500" />
            </button>
          </div>

          {/* Drafts Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Bản nháp / Soạn sẵn</h3>
              <button
                onClick={() => setShowCreateAssignment(true)}
                className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 active:scale-90 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {draftAssignments.map(draft => (
                <div key={draft.id} className="bg-white p-5 rounded-[2rem] border-2 border-dashed border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-600">
                      Bản nháp
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Tạo: {draft.updatedAt ? new Date(draft.updatedAt.toMillis()).toLocaleDateString('vi-VN') : ''}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">{draft.title}</h4>
                    <p className="text-xs font-bold text-slate-400">{draft.questions?.length || 0} câu hỏi</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedDraft(draft);
                        setShowCreateAssignment(true);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleAssignClick(draft)}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                    >
                      Giao bài ngay
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="w-10 flex items-center justify-center shrink-0 py-2.5 rounded-xl bg-red-50 text-red-500 font-bold text-xs hover:bg-red-100 transition-colors border border-red-100"
                      title="Xóa bản nháp"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classes Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Lớp học của tôi</h3>
              <button
                onClick={() => onNavigate?.('classroom')}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1"
              >
                Xem tất cả <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teacherClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all"
                  onClick={() => onNavigate?.('classroom')}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-lg bg-indigo-500 shadow-indigo-200"
                    )}>
                      {cls.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900">{cls.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mã lớp: {cls.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{cls.studentCount} HS</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giao: {cls.totalAssignments}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reminders */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider px-2">Nhắc nhở</h3>
            <div className="bg-amber-50 p-5 rounded-[2rem] border border-amber-100 flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-200">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900">Chấm bài tập Ôn tập Phân số</p>
                <p className="text-xs font-bold text-amber-700/70 mt-1 leading-relaxed">
                  Có 15 bài tập mới nộp từ lớp 5A cần được chấm điểm.
                </p>
                <button
                  onClick={() => setGradingAssignment({ title: 'Ôn tập Phân số', class: '5A' })}
                  className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                >
                  Chấm ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlays */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showCreateClass && renderCreateClass()}
          {showCreateAssignment && (
            <AssignmentBuilder
              initialDraft={selectedDraft}
              onClose={() => {
                setShowCreateAssignment(false);
                setSelectedDraft(null); // Clear after close
              }}
            />
          )}
          {showAssignModal && selectedDraft && (
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
                className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl max-h-[90vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-xl font-black text-slate-900">Giao bài tập</h3>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 space-y-6 pb-2">
                  <p className="text-xs font-medium text-indigo-600 mt-1">{selectedDraft.questions?.length || 0} câu hỏi</p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn lớp giao bài</label>
                      <div className="grid grid-cols-2 gap-2">
                        {teacherClasses.map(cls => (
                          <button
                            key={cls.id}
                            onClick={() => setSelectedClass(cls.id)}
                            className={cn(
                              "py-3 rounded-xl font-bold text-sm border-2 transition-colors",
                              selectedClass === cls.id
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                            )}
                          >
                            {cls.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hạn nộp bài</label>
                      <input
                        type="datetime-local"
                        value={selectedDueDate}
                        onChange={(e) => setSelectedDueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                  </div>
                </div>

                <div className="flex gap-3 pt-4 shrink-0 mt-auto border-t border-slate-100">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedClass) {
                        alert('Vui lòng chọn lớp học.');
                        return;
                      }
                      if (!selectedDueDate) {
                        alert('Vui lòng chọn hạn nộp bài.');
                        return;
                      }
                      const dueTime = new Date(selectedDueDate).getTime();
                      if (isNaN(dueTime)) {
                        alert('Hạn nộp bài không hợp lệ.');
                        return;
                      }
                      if (dueTime < Date.now()) {
                        alert('Hạn nộp bài không được ở trong quá khứ.');
                        return;
                      }
                      if (!user) return;

                      setIsSubmittingAssign(true);
                      try {
                        const targetClass = teacherClasses.find(c => c.id === selectedClass);
                        if (!targetClass) {
                          alert('Lớp học không tồn tại');
                          return;
                        }

                        await createAssignment(
                          selectedClass,
                          selectedDraft.title,
                          selectedDraft.description,
                          new Date(selectedDueDate),
                          targetClass.studentCount,
                          selectedDraft.questions,
                          selectedDraft.settings
                        );
                        alert('Đã giao bài thành công!');
                        setShowAssignModal(false);
                        setSelectedClass(null);
                        setSelectedDueDate('');
                      } catch (error) {
                        console.error('Error in quick assign:', error);
                        alert('Lỗi khi giao bài.');
                      } finally {
                        setIsSubmittingAssign(false);
                      }
                    }}
                    disabled={isSubmittingAssign}
                    className={cn(
                      "flex-1 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg",
                      isSubmittingAssign
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                        : (!selectedClass || !selectedDueDate)
                          ? "bg-slate-200 text-slate-400 shadow-none"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 active:scale-95"
                    )}
                  >
                    {isSubmittingAssign ? 'Đang giao...' : 'Xác nhận giao'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {gradingAssignment && (
            <AssignmentGrader
              onClose={() => setGradingAssignment(null)}
              assignmentTitle={gradingAssignment.title}
              className={gradingAssignment.class || 'N/A'}
              classId={gradingAssignment.classId || ''}
              assignmentId={gradingAssignment.id || ''}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
