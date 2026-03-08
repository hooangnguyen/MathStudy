import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, CheckCircle2, XCircle, AlertCircle, FileText, Send, User, CheckSquare, Type } from 'lucide-react';
import { cn } from '../../utils/utils';
import { subscribeToSubmissions, updateSubmissionGrade, SubmissionData } from '../../services/assignmentService';
import { subscribeToStudentClass, ClassData } from '../../services/classService';
import { getUsersByIds, UserProfile } from '../../services/userService';

interface AssignmentGraderProps {
  onClose: () => void;
  assignmentTitle: string;
  className: string;
  classId: string;
  assignmentId: string;
}

interface Answer {
  questionId: number;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean | null; // null means needs manual grading
  type: 'multiple_choice' | 'essay' | 'short_answer' | 'checkbox';
}

interface StudentSubmission {
  id: string;
  name: string;
  status: 'submitted' | 'late' | 'not_submitted';
  submittedAt?: any;
  score?: number;
  feedback?: string;
  answers: any[];
}



export const AssignmentGrader: React.FC<AssignmentGraderProps> = ({ onClose, assignmentTitle, className, classId, assignmentId }) => {
  const [selectedStudent, setSelectedStudent] = useState<StudentSubmission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<string>('');
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time fetching of submissions and class students
  useEffect(() => {
    if (!classId || !assignmentId) return;

    let classUnsubscribe: () => void;
    const submissionsUnsubscribe = subscribeToSubmissions(classId, assignmentId, async (realSubmissions) => {
      // Get class data to know all students
      classUnsubscribe = subscribeToStudentClass(classId, async (classData) => {
        if (!classData || !classData.studentIds) return;

        const profiles = await getUsersByIds(classData.studentIds);

        const fullList: StudentSubmission[] = profiles.map(profile => {
          const sub = realSubmissions.find(s => s.id === profile.uid);
          if (sub) {
            return {
              id: profile.uid,
              name: profile.name,
              status: 'submitted',
              submittedAt: sub.submittedAt,
              score: sub.score,
              feedback: (sub as any).feedback,
              answers: sub.answers || []
            };
          } else {
            return {
              id: profile.uid,
              name: profile.name,
              status: 'not_submitted',
              answers: []
            };
          }
        });

        setSubmissions(fullList);
        setIsLoading(false);

        // Update selected student if they are in the list
        if (selectedStudent) {
          const updatedCurrent = fullList.find(s => s.id === selectedStudent.id);
          if (updatedCurrent) setSelectedStudent(updatedCurrent);
        }
      });
    });

    return () => {
      submissionsUnsubscribe();
      if (classUnsubscribe) classUnsubscribe();
    };
  }, [classId, assignmentId]);

  // Auto-calculate score when answers change
  useEffect(() => {
    if (selectedStudent && selectedStudent.status !== 'not_submitted') {
      const totalQuestions = selectedStudent.answers.length;
      if (totalQuestions === 0) return;

      const correctCount = selectedStudent.answers.filter(a => a.isCorrect === true).length;
      // Calculate score on 10-point scale
      const calculatedScore = (correctCount / totalQuestions) * 10;

      // Only update score if it hasn't been manually edited (or we can just overwrite it as a suggestion)
      // The requirement says "auto add points... after teacher completes". 
      // We'll update the suggested score in real-time.
      setScore(Number.isInteger(calculatedScore) ? calculatedScore.toString() : calculatedScore.toFixed(1));
    }
  }, [selectedStudent]);

  const handleSaveGrade = async () => {
    if (!selectedStudent || !classId || !assignmentId) return;

    try {
      const finalScore = parseFloat(score);
      if (isNaN(finalScore)) {
        alert('Vui lòng nhập điểm hợp lệ');
        return;
      }

      await updateSubmissionGrade(classId, assignmentId, selectedStudent.id, {
        score: finalScore,
        feedback,
        answers: selectedStudent.answers
      });

      alert('Đã lưu điểm thành công!');
      setSelectedStudent(null);
      setScore('');
      setFeedback('');
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Lỗi khi lưu điểm.');
    }
  };

  const handleMarkQuestion = (questionId: number, isCorrect: boolean) => {
    if (!selectedStudent) return;

    const updatedAnswers = selectedStudent.answers.map(a =>
      a.questionId === questionId ? { ...a, isCorrect } : a
    );

    setSelectedStudent({
      ...selectedStudent,
      answers: updatedAnswers
    });
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice': return <CheckCircle2 size={18} />;
      case 'checkbox': return <CheckSquare size={18} />;
      case 'short_answer': return <Type size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Trắc nghiệm';
      case 'checkbox': return 'Hộp kiểm';
      case 'short_answer': return 'Điền từ ngắn';
      case 'essay': return 'Tự luận';
      default: return 'Câu hỏi';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-slate-50 flex flex-col md:rounded-l-3xl md:left-64 md:w-[calc(100%-16rem)]"
    >
      <div className="p-4 lg:p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between shrink-0 bg-white shadow-sm z-10 gap-4">
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Mobile Back Button (when student selected) */}
          <button
            onClick={() => setSelectedStudent(null)}
            className={cn(
              "w-10 h-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors lg:hidden",
              selectedStudent ? "flex" : "hidden"
            )}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Main Close Button (hidden on mobile when student selected) */}
          <button
            onClick={onClose}
            className={cn(
              "w-10 h-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors",
              selectedStudent ? "hidden lg:flex" : "flex"
            )}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="min-w-0">
            <h3 className="text-lg lg:text-xl font-black text-slate-900 truncate">{assignmentTitle}</h3>
            <p className="text-xs lg:text-sm font-bold text-slate-500">Lớp {className}</p>
          </div>
        </div>
        <div className="flex gap-2 text-xs lg:text-sm font-bold overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          <div className="px-3 py-1.5 lg:px-4 lg:py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 whitespace-nowrap">
            Đã nộp: {submissions.filter(s => s.status !== 'not_submitted').length}/{submissions.length}
          </div>
          <div className="px-3 py-1.5 lg:px-4 lg:py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 whitespace-nowrap">
            Đã chấm: {submissions.filter(s => s.score !== undefined).length}/{submissions.filter(s => s.status !== 'not_submitted').length}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Student List Sidebar */}
        <div className={cn(
          "w-full lg:w-80 border-r border-slate-200 bg-white flex-col shrink-0 absolute lg:relative inset-0 z-10 lg:z-auto transition-transform duration-300",
          selectedStudent ? "-translate-x-full lg:translate-x-0" : "translate-x-0 flex"
        )}>
          <div className="p-4 border-b border-slate-100">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Danh sách học sinh</h4>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
            {submissions.map(student => (
              <button
                key={student.id}
                onClick={() => {
                  setSelectedStudent(student);
                  // Initial score set from student data, but effect will update it if needed
                  setScore(student.score?.toString() || '');
                }}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group",
                  selectedStudent?.id === student.id
                    ? "bg-indigo-50 border border-indigo-100"
                    : "hover:bg-slate-50 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    student.status === 'not_submitted' ? "bg-slate-100 text-slate-400" :
                      student.score !== undefined ? "bg-emerald-100 text-emerald-600" :
                        "bg-amber-100 text-amber-600"
                  )}>
                    {student.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      "font-bold text-sm truncate",
                      selectedStudent?.id === student.id ? "text-indigo-900" : "text-slate-700"
                    )}>{student.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                      {student.status === 'not_submitted' ? 'Chưa nộp' :
                        student.score !== undefined ? `Điểm: ${student.score}` : 'Cần chấm'}
                    </p>
                  </div>
                </div>
                {student.status !== 'not_submitted' && student.score === undefined && (
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Grading Area */}
        <div className={cn(
          "flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-6 no-scrollbar w-full h-full",
          !selectedStudent ? "hidden lg:block" : "block"
        )}>
          {selectedStudent ? (
            selectedStudent.status === 'not_submitted' ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <User size={48} className="opacity-20" />
                <p className="font-bold">Học sinh chưa nộp bài</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900">{selectedStudent.name}</h2>
                    <p className="text-xs md:text-sm font-bold text-slate-500 mt-1">
                      Nộp lúc: {selectedStudent.submittedAt ? new Date(selectedStudent.submittedAt.toMillis()).toLocaleString('vi-VN') : '--'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Điểm số (Gợi ý)</label>
                      <input
                        type="number"
                        min="0" max="10" step="0.1"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        className="w-20 md:w-24 text-center text-xl md:text-2xl font-black text-indigo-600 bg-indigo-50 border-2 border-indigo-100 rounded-xl py-2 focus:outline-none focus:border-indigo-500"
                        placeholder="--"
                      />
                    </div>
                    <button
                      onClick={handleSaveGrade}
                      className="h-full px-4 md:px-6 py-3 md:py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                      Lưu điểm
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedStudent.answers.map((answer, index) => (
                    <div key={answer.questionId} className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-black text-indigo-500 uppercase tracking-wider">Câu {index + 1}</span>
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1">
                              {getQuestionIcon(answer.type)}
                              {getQuestionTypeLabel(answer.type)}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 text-lg leading-relaxed">{answer.questionText}</p>
                        </div>
                        {answer.isCorrect === true && <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />}
                        {answer.isCorrect === false && <XCircle className="text-rose-500 shrink-0" size={24} />}
                        {answer.isCorrect === null && <AlertCircle className="text-amber-500 shrink-0" size={24} />}
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Bài làm của học sinh:</p>
                        <div className="font-medium text-slate-700 whitespace-pre-wrap text-lg">
                          {answer.type === 'checkbox' && Array.isArray(answer.answer) ? (
                            <div className="space-y-1">
                              {answer.answer.map((idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                  <span>{answer.options?.[idx] || `Tùy chọn ${idx + 1}`}</span>
                                </div>
                              ))}
                              {answer.answer.length === 0 && <span className="text-slate-400">(Không chọn đáp án nào)</span>}
                            </div>
                          ) : answer.type === 'multiple_choice' ? (
                            <span>{answer.options?.[answer.answer] || `Tùy chọn ${Number(answer.answer) + 1}`}</span>
                          ) : (
                            <span>{answer.answer || <small className="text-slate-400 italic">(Chưa nhập câu trả lời)</small>}</span>
                          )}
                        </div>
                      </div>

                      {/* Always show suggested answer for grading context */}
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">Đáp án đúng:</p>
                        <div className="font-medium text-emerald-800 whitespace-pre-wrap">
                          {answer.type === 'multiple_choice' ? (
                            <span>{answer.options?.[answer.correctAnswer] || `Tùy chọn ${Number(answer.correctAnswer) + 1}`}</span>
                          ) : answer.type === 'checkbox' && Array.isArray(answer.correctAnswer) ? (
                            <div className="space-y-1">
                              {answer.correctAnswer.map((idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <CheckSquare size={14} className="text-emerald-500" />
                                  <span>{answer.options?.[idx] || `Tùy chọn ${idx + 1}`}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span>{answer.correctAnswer}</span>
                          )}
                        </div>
                      </div>

                      {/* Grading Controls */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleMarkQuestion(answer.questionId, true)}
                          className={cn(
                            "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                            answer.isCorrect === true
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          )}
                        >
                          <CheckCircle2 size={18} /> Đúng
                        </button>
                        <button
                          onClick={() => handleMarkQuestion(answer.questionId, false)}
                          className={cn(
                            "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                            answer.isCorrect === false
                              ? "bg-rose-500 text-white shadow-lg shadow-rose-200"
                              : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                          )}
                        >
                          <XCircle size={18} /> Sai
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Nhận xét (Tùy chọn)</h4>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Nhập nhận xét cho học sinh..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none min-h-[120px]"
                  />
                </div>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <FileText size={48} className="opacity-20" />
              <p className="font-bold">Chọn một học sinh để bắt đầu chấm bài</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
