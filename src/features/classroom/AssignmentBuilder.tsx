import React, { useState } from 'react';
import {
  ChevronLeft, Plus, Settings, FileText,
  Image as ImageIcon, Trash2, Copy, CheckCircle2,
  Clock, Calendar, Users, Target, Sigma, X, Keyboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/utils';
import { MathSymbolPicker } from '../../components/common/MathSymbolPicker';
import { MathEquationEditor } from '../../components/common/MathEquationEditor';

import { createAssignment, saveDraftAssignment, deleteDraftAssignment, DraftAssignmentData } from '../../services/assignmentService';
import { subscribeToTeacherClasses, ClassData } from '../../services/classService';
import { useFirebase } from '../../context/FirebaseProvider';

interface AssignmentBuilderProps {
  classId?: string;
  totalStudents?: number;
  initialDraft?: DraftAssignmentData;
  onClose: () => void;
  onAssigned?: () => void;
  onDraftSaved?: () => void;
}

export const AssignmentBuilder: React.FC<AssignmentBuilderProps> = ({ classId, totalStudents, initialDraft, onClose, onAssigned, onDraftSaved }) => {
  const { user } = useFirebase();
  const [activeTab, setActiveTab] = useState<'questions' | 'settings'>('questions');
  const [title, setTitle] = useState(initialDraft?.title || 'Bài tập chưa có tiêu đề');
  const [description, setDescription] = useState(initialDraft?.description || '');
  const [dueDate, setDueDate] = useState<string>('');
  const [shuffleQuestions, setShuffleQuestions] = useState(initialDraft?.settings?.shuffleQuestions ?? false);
  const [showScoreImmediate, setShowScoreImmediate] = useState(initialDraft?.settings?.showScoreImmediate ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [activePicker, setActivePicker] = useState<{ type: 'question' | 'option', id: number, optIndex?: number } | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(classId || '');

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTeacherClasses(user.uid, (classes) => {
      setTeacherClasses(classes);
    });
    return () => unsubscribe();
  }, [user]);

  const [questions, setQuestions] = useState(initialDraft?.questions || [
    { id: 1, type: 'multiple_choice', text: '', options: ['Tùy chọn 1'], correctAnswer: 0, points: 10 }
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now(), type: 'multiple_choice', text: '', options: ['Tùy chọn 1'], correctAnswer: 0, points: 10 }
    ]);
  };

  const updateQuestion = (id: number, field: string, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const addOption = (questionId: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, options: [...q.options, `Tùy chọn ${q.options.length + 1}`] };
      }
      return q;
    }));
  };

  const updateOption = (questionId: number, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeOption = (questionId: number, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = q.options.filter((_, i) => i !== optionIndex);
        // Adjust correct answer if needed
        let newCorrect = q.correctAnswer;
        if (newCorrect === optionIndex) newCorrect = 0;
        else if (newCorrect > optionIndex) newCorrect--;
        return { ...q, options: newOptions, correctAnswer: newCorrect };
      }
      return q;
    }));
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const duplicateQuestion = (id: number) => {
    const qToCopy = questions.find(q => q.id === id);
    if (qToCopy) {
      setQuestions([...questions, { ...qToCopy, id: Date.now() }]);
    }
  };

  const handleSymbolSelect = (symbol: string) => {
    if (!activePicker) return;

    if (activePicker.type === 'question') {
      const q = questions.find(q => q.id === activePicker.id);
      if (q) {
        updateQuestion(activePicker.id, 'text', q.text + symbol);
      }
    } else if (activePicker.type === 'option' && activePicker.optIndex !== undefined) {
      const q = questions.find(q => q.id === activePicker.id);
      if (q) {
        const newOptions = [...q.options];
        newOptions[activePicker.optIndex] = (newOptions[activePicker.optIndex] || '') + symbol;
        updateQuestion(activePicker.id, 'options', newOptions);
      }
    }
  };

  const handleAssign = async () => {
    // 1. Validate Title
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài tập.');
      setActiveTab('questions');
      return;
    }

    // 2. Validate Class Selection
    const targetClassId = classId || selectedClassId;
    if (!targetClassId) {
      alert('Vui lòng chọn lớp học để giao bài.');
      setActiveTab('settings');
      return;
    }

    // 3. Validate Due Date
    if (!dueDate) {
      alert('Vui lòng chọn hạn chót nộp bài.');
      setActiveTab('settings');
      return;
    }
    const dueTime = new Date(dueDate).getTime();
    if (isNaN(dueTime)) {
      alert('Hạn chót không hợp lệ.');
      setActiveTab('settings');
      return;
    }
    if (dueTime < Date.now()) {
      alert('Hạn chót không được ở trong quá khứ.');
      setActiveTab('settings');
      return;
    }

    // 4. Validate Questions
    if (questions.length === 0) {
      alert('Vui lòng thêm ít nhất một câu hỏi.');
      setActiveTab('questions');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Câu hỏi ${i + 1} đang để trống nội dung.`);
        setActiveTab('questions');
        return;
      }
      if ((q.type === 'multiple_choice' || q.type === 'checkbox')) {
        if (q.options.length < 2) {
          alert(`Câu hỏi ${i + 1} cần ít nhất 2 phương án trả lời.`);
          setActiveTab('questions');
          return;
        }
        if (q.options.some((opt: string) => !opt.trim())) {
          alert(`Câu hỏi ${i + 1} có phương án trả lời đang để trống.`);
          setActiveTab('questions');
          return;
        }
      }
    }

    // Find student count for the target class
    let targetStudentCount = totalStudents;
    if (targetStudentCount === undefined) {
      const cls = teacherClasses.find(c => c.id === targetClassId);
      targetStudentCount = cls?.studentCount || 0;
    }

    setIsSubmitting(true);
    try {
      await createAssignment(
        targetClassId,
        title,
        description,
        new Date(dueDate),
        targetStudentCount,
        questions,
        { shuffleQuestions, showScoreImmediate }
      );
      if (onAssigned) onAssigned();
      onClose();
    } catch (error) {
      console.error('Error assigning work:', error);
      alert('Đã xảy ra lỗi khi giao bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim() || isSavingDraft || !user) return;
    setIsSavingDraft(true);
    try {
      await saveDraftAssignment(
        user.uid,
        title,
        description,
        questions,
        { shuffleQuestions, showScoreImmediate },
        initialDraft?.id // If it's an existing draft, update it
      );
      if (onDraftSaved) onDraftSaved();
      onClose();
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Đã xảy ra lỗi khi lưu bản nháp.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDeleteExistingDraft = async () => {
    if (!initialDraft?.id) return;
    if (window.confirm('Bạn có chắc muốn xóa bản nháp này không? Thao tác này không thể hoàn tác.')) {
      try {
        await deleteDraftAssignment(initialDraft.id);
        if (onDraftSaved) onDraftSaved();
        onClose();
      } catch (error) {
        console.error('Error deleting draft:', error);
        alert('Đã xảy ra lỗi khi xóa bản nháp.');
      }
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
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={onClose} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg sm:text-xl font-black text-slate-900 bg-transparent border-none outline-none focus:ring-0 w-full placeholder:text-slate-300 px-0 truncate"
              placeholder="Tiêu đề bài tập"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end sm:justify-start">
            {initialDraft?.id && (
              <button
                onClick={handleDeleteExistingDraft}
                className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-[1rem] sm:rounded-2xl font-black shadow-sm active:scale-95 transition-all hover:bg-red-100 shrink-0"
                title="Xóa bản nháp"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={handleSaveDraft}
              disabled={isSavingDraft || !title.trim()}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-100 text-slate-600 rounded-[1rem] sm:rounded-2xl font-black shadow-sm disabled:opacity-50 active:scale-95 transition-all text-xs sm:text-sm hover:bg-slate-200 flex-1 sm:flex-none text-center"
            >
              {isSavingDraft ? 'Đang lưu...' : 'Lưu nháp'}
            </button>
            <button
              onClick={handleAssign}
              disabled={isSubmitting}
              className={cn(
                "px-4 sm:px-6 py-2 sm:py-2.5 flex-1 sm:flex-none rounded-[1rem] sm:rounded-2xl font-black transition-all text-xs sm:text-sm text-center",
                isSubmitting
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-[0_4px_0_#cbd5e1]"
                  : (!title.trim() || !(classId || selectedClassId) || !dueDate || questions.length === 0)
                    ? "bg-slate-200 text-slate-400 shadow-[0_4px_0_#cbd5e1] translate-y-0"
                    : "bg-[#1cb0f6] text-white shadow-[0_4px_0_#1899d6] active:shadow-[0_0_0_#1899d6] active:translate-y-1 hover:bg-[#23beff]"
              )}
            >
              {isSubmitting ? 'Đợi...' : 'Giao bài'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-8 px-6">
          <button
            onClick={() => setActiveTab('questions')}
            className={cn(
              "pb-4 text-sm font-black transition-colors relative",
              activeTab === 'questions' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Câu hỏi
            {activeTab === 'questions' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "pb-4 text-sm font-black transition-colors relative",
              activeTab === 'settings' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Cài đặt
            {activeTab === 'settings' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
        <div className="max-w-3xl mx-auto">
          {activeTab === 'questions' ? (
            <div className="space-y-6 pb-24">
              {/* Title Card */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border-t-8 border-t-indigo-500 border-x border-b border-slate-200">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-3xl font-black text-slate-900 bg-transparent border-none outline-none mb-4 placeholder:text-slate-300"
                  placeholder="Tiêu đề bài tập"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm font-bold text-slate-500 bg-transparent border-none outline-none resize-none placeholder:text-slate-300"
                  placeholder="Mô tả bài tập (không bắt buộc)"
                  rows={2}
                />
              </div>

              {/* Questions List */}
              {questions.map((q, index) => (
                <div key={q.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 space-y-6 relative group transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4">
                    {/* Question Text with Grouped Actions (Google Forms style) */}
                    <div className="flex-1 relative">
                      <MathEquationEditor
                        value={q.text}
                        onChange={(latex) => updateQuestion(q.id, 'text', latex)}
                        placeholder="Câu hỏi"
                        className="bg-transparent border-none rounded-none border-b-2 border-slate-100 focus-within:border-indigo-500 focus-within:bg-slate-50/50 transition-all px-0 py-4 text-xl"
                      />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pr-2">
                        <button
                          type="button"
                          onClick={() => {
                            const kb = (window as any).mathVirtualKeyboard;
                            if (kb) {
                              if (kb.visible) kb.hide();
                              else kb.show();
                            }
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all bg-white shadow-sm border border-slate-100"
                          title="Bật/Tắt bàn phím ảo"
                        >
                          <Keyboard size={18} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePicker(activePicker?.id === q.id && activePicker?.type === 'question' ? null : { type: 'question', id: q.id })}
                          className={cn(
                            "p-2 rounded-xl transition-all shadow-sm border border-slate-100",
                            activePicker?.id === q.id && activePicker?.type === 'question' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                          )}
                          title="Chèn kí hiệu toán"
                        >
                          <Sigma size={18} strokeWidth={2.5} />
                        </button>
                      </div>

                      {activePicker?.id === q.id && activePicker?.type === 'question' && (
                        <div
                          className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-2 z-[120] 
                                     w-full sm:w-[22rem] max-w-[calc(100vw-2rem)]"
                        >
                          <MathSymbolPicker onSelect={handleSymbolSelect} onClose={() => setActivePicker(null)} />
                        </div>
                      )}
                    </div>

                    {/* Question Type Selector (Dropdown style like Google Forms) */}
                    <div className="relative group shrink-0 self-center sm:self-start">
                      <button
                        className={cn(
                          "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all min-w-[180px] justify-between border-2 border-slate-100 hover:border-slate-200 bg-white shadow-sm",
                          q.type === 'multiple_choice' ? "text-indigo-600" : q.type === 'checkbox' ? "text-emerald-600" : "text-amber-600"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {q.type === 'multiple_choice' ? (
                            <div className="w-4 h-4 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                            </div>
                          ) : q.type === 'checkbox' ? (
                            <div className="w-4 h-4 rounded border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center">
                              <CheckCircle2 size={10} className="text-white" />
                            </div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                          )}
                          {q.type === 'multiple_choice' ? 'Trắc nghiệm' : q.type === 'checkbox' ? 'Hộp kiểm' : 'Trả lời ngắn'}
                        </span>
                        <svg className="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right translate-y-2 group-hover:translate-y-0">
                        <div className="p-2">
                          <button
                            onClick={() => updateQuestion(q.id, 'type', 'multiple_choice')}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                              q.type === 'multiple_choice' ? "bg-indigo-50" : "hover:bg-slate-50"
                            )}
                          >
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                              <div className="w-4 h-4 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-700">Trắc nghiệm</p>
                              <p className="text-[10px] font-medium text-slate-400">Chọn một đáp án đúng</p>
                            </div>
                          </button>

                          <button
                            onClick={() => updateQuestion(q.id, 'type', 'checkbox')}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                              q.type === 'checkbox' ? "bg-emerald-50" : "hover:bg-slate-50"
                            )}
                          >
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-700">Hộp kiểm</p>
                              <p className="text-[10px] font-medium text-slate-400">Chọn nhiều đáp án đúng</p>
                            </div>
                          </button>

                          <button
                            onClick={() => updateQuestion(q.id, 'type', 'short_answer')}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                              q.type === 'short_answer' ? "bg-amber-50" : "hover:bg-slate-50"
                            )}
                          >
                            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h7" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-700">Trả lời ngắn</p>
                              <p className="text-[10px] font-medium text-slate-400">Học sinh tự nhập đáp án</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Options for Multiple Choice */}
                  {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                    <div className="space-y-3 pl-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <div className={cn(
                            "w-5 h-5 flex items-center justify-center border-2 cursor-pointer transition-colors",
                            q.type === 'multiple_choice' ? "rounded-full" : "rounded-md",
                            (q.type === 'multiple_choice' ? q.correctAnswer === optIndex : (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIndex)))
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 hover:border-indigo-500"
                          )}
                            onClick={() => {
                              if (q.type === 'multiple_choice') {
                                updateQuestion(q.id, 'correctAnswer', optIndex);
                              } else {
                                const current = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                                const exists = current.includes(optIndex);
                                const next = exists ? current.filter(i => i !== optIndex) : [...current, optIndex];
                                updateQuestion(q.id, 'correctAnswer', next);
                              }
                            }}
                          >
                            {q.type === 'multiple_choice'
                              ? (q.correctAnswer === optIndex && <CheckCircle2 size={14} />)
                              : (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIndex) && <CheckCircle2 size={14} />)
                            }
                          </div>
                          <div className="flex-1 relative">
                            <MathEquationEditor
                              value={opt}
                              onChange={(latex) => updateOption(q.id, optIndex, latex)}
                              placeholder={`Tùy chọn ${optIndex + 1}`}
                              className="pr-8 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500"
                            />
                            <button
                              onClick={() => setActivePicker(activePicker?.id === q.id && activePicker?.type === 'option' && activePicker?.optIndex === optIndex ? null : { type: 'option', id: q.id, optIndex })}
                              className={cn(
                                "absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all",
                                activePicker?.id === q.id && activePicker?.type === 'option' && activePicker?.optIndex === optIndex ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-indigo-50 hover:text-indigo-600"
                              )}
                              title="Chèn kí hiệu toán"
                            >
                              <Sigma size={16} />
                            </button>

                            {activePicker?.id === q.id && activePicker?.type === 'option' && activePicker?.optIndex === optIndex && (
                              <div
                                className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-2 z-[120] 
                                           w-full sm:w-[22rem] max-w-[calc(100vw-2rem)]"
                              >
                                <MathSymbolPicker onSelect={handleSymbolSelect} onClose={() => setActivePicker(null)} />
                              </div>
                            )}
                          </div>
                          {q.options.length > 1 && (
                            <button
                              onClick={() => removeOption(q.id, optIndex)}
                              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                      <div className="flex items-center gap-3 pt-2">
                        <div className={cn(
                          "w-5 h-5 border-2 border-slate-200",
                          q.type === 'multiple_choice' ? "rounded-full" : "rounded-md"
                        )} />
                        <button
                          onClick={() => addOption(q.id)}
                          className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          Thêm tùy chọn
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Short Answer */}
                  {q.type === 'short_answer' && (
                    <div className="pl-2">
                      <div className="w-1/2 border-b-2 border-slate-200 pb-2">
                        <p className="text-sm font-bold text-slate-400">Văn bản câu trả lời ngắn</p>
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm:</span>
                        <input
                          type="number"
                          value={q.points}
                          onChange={(e) => updateQuestion(q.id, 'points', parseInt(e.target.value) || 0)}
                          className="w-10 bg-transparent text-sm font-black text-slate-900 border-none outline-none focus:ring-0 p-0 text-center"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100/50">
                      <button
                        onClick={() => duplicateQuestion(q.id)}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-white hover:shadow-sm transition-all active:scale-95"
                        title="Nhân bản"
                      >
                        <Copy size={18} />
                      </button>
                      <div className="w-px h-6 bg-slate-200 mx-1" />
                      <button
                        onClick={() => removeQuestion(q.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-white hover:shadow-sm transition-all active:scale-95"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                </div>
              ))}

              {/* Add Question Button */}
              <div className="flex justify-center">
                <button
                  onClick={addQuestion}
                  className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all active:scale-95"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 space-y-8">
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Target className="text-indigo-500" /> Đối tượng giao bài
                  </h3>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Chọn lớp</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {teacherClasses.map(c => (
                        <label key={c.id} className={cn(
                          "flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors",
                          (classId === c.id || selectedClassId === c.id)
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-100 hover:border-indigo-500"
                        )}>
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            checked={classId === c.id || selectedClassId === c.id}
                            onChange={() => !classId && setSelectedClassId(c.id)}
                            disabled={!!classId}
                          />
                          <span className="text-sm font-black text-slate-700">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Calendar className="text-indigo-500" /> Thời gian
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Hạn chót nộp bài</label>
                      <input
                        type="datetime-local"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Settings className="text-indigo-500" /> Tùy chọn khác
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-slate-200 transition-colors">
                      <div>
                        <p className="text-sm font-black text-slate-700">Trộn câu hỏi</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">Thứ tự câu hỏi sẽ thay đổi với mỗi học sinh</p>
                      </div>
                      <div className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", shuffleQuestions ? "bg-indigo-600" : "bg-slate-200")}>
                        <input
                          type="checkbox"
                          checked={shuffleQuestions}
                          onChange={(e) => setShuffleQuestions(e.target.checked)}
                          className="peer sr-only"
                        />
                        <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", shuffleQuestions ? "translate-x-6" : "translate-x-1")} />
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-slate-200 transition-colors">
                      <div>
                        <p className="text-sm font-black text-slate-700">Hiển thị điểm ngay</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">Học sinh thấy điểm ngay sau khi nộp bài</p>
                      </div>
                      <div className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", showScoreImmediate ? "bg-indigo-600" : "bg-slate-200")}>
                        <input
                          type="checkbox"
                          checked={showScoreImmediate}
                          onChange={(e) => setShowScoreImmediate(e.target.checked)}
                          className="peer sr-only"
                        />
                        <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", showScoreImmediate ? "translate-x-6" : "translate-x-1")} />
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
