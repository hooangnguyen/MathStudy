import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft, Plus, Settings, FileText,
  Image as ImageIcon, Trash2, Copy, CheckCircle2,
  Clock, Calendar, Users, Target, Sigma, X, Layout, CheckSquare, Type,
  Sparkles, BrainCircuit, Wand2, Loader2, AlertCircle, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/utils';
import { MathSymbolPicker } from '../../components/common/MathSymbolPicker';
import { MathEquationEditor } from '../../components/common/MathEquationEditor';

import { createAssignment, saveDraftAssignment, deleteDraftAssignment, DraftAssignmentData } from '../../services/assignmentService';
import { subscribeToTeacherClasses, ClassData } from '../../services/classService';
import { useFirebase } from '../../context/FirebaseProvider';
import { generateQuestionsWithAI, AIGeneratedQuestion } from '../../services/aiService';

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
  const [showQuestionTypeDropdown, setShowQuestionTypeDropdown] = useState<number | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(classId || '');

  // AI Generation State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<'Cơ bản' | 'Trung bình' | 'Nâng cao'>('Trung bình');
  const [aiSelectedTypes, setAiSelectedTypes] = useState<string[]>(['multiple_choice']);
  const [aiSelectedGrade, setAiSelectedGrade] = useState<number>(5);

  // Refs for click outside detection
  const questionTypeDropdownRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const mathPickerRef = useRef<HTMLDivElement>(null);
  const questionTriggerRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const optionTriggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const questionMathRefs = useRef<Map<number, any>>(new Map());
  const optionMathRefs = useRef<Map<string, any>>(new Map());

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close question type dropdown if click is outside any dropdown
      if (showQuestionTypeDropdown !== null) {
        const dropdownElement = questionTypeDropdownRefs.current.get(showQuestionTypeDropdown);
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setShowQuestionTypeDropdown(null);
        }
      }
      // Close math symbol picker if click is outside
      if (activePicker) {
        if (mathPickerRef.current && !mathPickerRef.current.contains(event.target as Node)) {
          // Check if the trigger button was clicked (shouldn't close)
          let triggerButton: HTMLButtonElement | undefined;
          if (activePicker.type === 'question') {
            triggerButton = questionTriggerRefs.current.get(activePicker.id);
          } else if (activePicker.optIndex !== undefined) {
            triggerButton = optionTriggerRefs.current.get(`${activePicker.id}-${activePicker.optIndex}`);
          }
          
          if (triggerButton && triggerButton.contains(event.target as Node)) {
            return;
          }
          setActivePicker(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showQuestionTypeDropdown, activePicker]);

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
        const mathField = questionMathRefs.current.get(q.id);
        if (mathField && mathField.insert) {
          mathField.insert(symbol);
        } else {
          updateQuestion(activePicker.id, 'text', q.text + symbol);
        }
      }
    } else if (activePicker.type === 'option' && activePicker.optIndex !== undefined) {
      const q = questions.find(q => q.id === activePicker.id);
      if (q) {
        const mathField = optionMathRefs.current.get(`${q.id}-${activePicker.optIndex}`);
        if (mathField && mathField.insert) {
          mathField.insert(symbol);
        } else {
          const newOptions = [...q.options];
          newOptions[activePicker.optIndex] = (newOptions[activePicker.optIndex] || '') + symbol;
          updateQuestion(activePicker.id, 'options', newOptions);
        }
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

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      setAiError('Vui lòng nhập chủ đề bài tập.');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const generated = await generateQuestionsWithAI(
        aiTopic,
        aiSelectedGrade,
        aiCount,
        aiSelectedTypes,
        aiDifficulty
      );

      if (generated && generated.length > 0) {
        const newQuestions = generated.map((q: any) => {
          // Enhanced Sanitization for AI text (Adjusted for Full-LaTeX format)
          let sanitizedText = q.text.trim();
          
          // If the AI outputs triple quotes or other weirdness
          const quoteRegex = /^"([\s\S]*)"$/;
          const quoteMatch = sanitizedText.match(quoteRegex);
          if (quoteMatch) {
            sanitizedText = quoteMatch[1].trim();
          }

          // Important: In Full-LaTeX mode, we WANT the global $ wrappers if they contain \text{}
          // But we still want to remove them if they are redundant and squashing text WITHOUT \text{}
          if (sanitizedText.startsWith('$') && sanitizedText.endsWith('$')) {
            const middle = sanitizedText.substring(1, sanitizedText.length - 1).trim();
            // If it DOESN'T contain \text, it's likely the old "squashed" format, so unwrap it
            if (!middle.toLowerCase().includes('\\text{')) {
              // Only unwrap if there are no other inner $ blocks
              if (!middle.includes('$')) {
                sanitizedText = middle;
              }
            }
            // Otherwise, keep the global $ because it's the requested Full-LaTeX format
          }
          
          // Prevent the AI from outputting weird "Câu 1: " prefixes
          sanitizedText = sanitizedText.replace(/^(Câu\s*\d+\s*:\s*)/i, '').trim();

          return {
            id: Date.now() + Math.random(),
            type: q.type || 'multiple_choice',
            text: sanitizedText,
            options: q.options || ['', '', '', ''],
            correctAnswer: q.correctAnswer ?? 0,
            points: q.points || 10
          };
        });
        
        // If current assignment only has one empty question, replace it
        if (questions.length === 1 && !questions[0].text.trim()) {
          setQuestions(newQuestions as any);
        } else {
          setQuestions([...questions, ...newQuestions] as any);
        }
        
        setActiveTab('questions');
        setShowAIModal(false);
        setAiTopic('');
      } else {
        setAiError('Không thể tạo câu hỏi. Vui lòng thử lại với chủ đề khác.');
      }
    } catch (err: any) {
      console.error(err);
      setAiError('Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại.');
    } finally {
      setIsGeneratingAI(false);
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
                    {/* Question Text with MathLive Input */}
                    <div className="flex-1 relative min-w-0">
                      <MathEquationEditor
                        ref={(el: any) => { if (el) questionMathRefs.current.set(q.id, el); }}
                        value={q.text}
                        onChange={(latex) => updateQuestion(q.id, 'text', latex)}
                        placeholder="Câu hỏi"
                        className="bg-transparent border-none rounded-none w-full"
                        onOpenPicker={() => setActivePicker(activePicker?.id === q.id && activePicker?.type === 'question' ? null : { type: 'question', id: q.id })}
                      />

                      {/* Math Symbol Picker Popup */}
                      {activePicker?.id === q.id && activePicker?.type === 'question' && (
                        <div className="absolute right-0 top-full mt-2 z-[120] w-[22rem] max-w-[calc(100vw-2rem)]">
                          <MathSymbolPicker onSelect={handleSymbolSelect} onClose={() => setActivePicker(null)} />
                        </div>
                      )}
                    </div>

                    {/* Question Type Selector (Google Forms style) */}
                    <div className="relative shrink-0 self-center sm:self-start">
                      <button
                        onClick={() => setShowQuestionTypeDropdown(showQuestionTypeDropdown === q.id ? null : q.id)}
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
                        <svg className={cn("w-4 h-4 text-slate-400 transition-transform", showQuestionTypeDropdown === q.id && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showQuestionTypeDropdown === q.id && (
                        <div ref={(el) => { if (el) questionTypeDropdownRefs.current.set(q.id, el); }} className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                          <div className="p-2">
                            <button
                              onClick={() => {
                                updateQuestion(q.id, 'type', 'multiple_choice');
                                setShowQuestionTypeDropdown(null);
                              }}
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
                              onClick={() => {
                                updateQuestion(q.id, 'type', 'checkbox');
                                setShowQuestionTypeDropdown(null);
                              }}
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
                              onClick={() => {
                                updateQuestion(q.id, 'type', 'short_answer');
                                setShowQuestionTypeDropdown(null);
                              }}
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
                      )}
                    </div>
                  </div>

                  {/* Options for Multiple Choice */}
                  {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                    <div className="space-y-3 pl-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-start gap-3">
                          <button
                            type="button"
                            className={cn(
                              "w-6 h-6 flex items-center justify-center border-2 transition-colors shrink-0 mt-3",
                              q.type === 'multiple_choice' ? "rounded-full" : "rounded-md",
                              (q.type === 'multiple_choice' ? q.correctAnswer === optIndex : (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIndex)))
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-slate-300 hover:border-indigo-500 bg-white"
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
                              ? (q.correctAnswer === optIndex && <CheckCircle2 size={16} strokeWidth={3} />)
                              : (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIndex) && <CheckCircle2 size={16} strokeWidth={3} />)
                            }
                          </button>
                          
                          <div className="flex-1 relative bg-white min-w-0">
                            <MathEquationEditor
                              ref={(el: any) => { if (el) optionMathRefs.current.set(`${q.id}-${optIndex}`, el); }}
                              value={opt}
                              onChange={(latex) => updateOption(q.id, optIndex, latex)}
                              placeholder={`Tùy chọn ${optIndex + 1}`}
                              className="bg-transparent w-full"
                              onOpenPicker={() => setActivePicker(activePicker?.id === q.id && activePicker?.type === 'option' && activePicker?.optIndex === optIndex ? null : { type: 'option', id: q.id, optIndex })}
                            />
                            {/* Math Symbol Picker Popup for Options */}
                            {activePicker?.id === q.id && activePicker?.type === 'option' && activePicker?.optIndex === optIndex && (
                              <div className="absolute right-0 top-full mt-2 z-[120] w-[22rem] max-w-[calc(100vw-2rem)]">
                                <MathSymbolPicker onSelect={handleSymbolSelect} onClose={() => setActivePicker(null)} />
                              </div>
                            )}
                          </div>

                          {q.options.length > 1 && (
                            <button
                              onClick={() => removeOption(q.id, optIndex)}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors shrink-0 mt-2"
                            >
                              <Trash2 size={20} />
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

              {/* Add Question Button & AI Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={addQuestion}
                  className="w-full sm:w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all active:scale-95 group"
                  title="Thêm câu hỏi thủ công"
                >
                  <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="sm:hidden font-black ml-2">Thêm câu hỏi mới</span>
                </button>

                <button
                  onClick={() => setShowAIModal(true)}
                  className="w-full sm:w-auto px-6 h-14 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl flex items-center justify-center gap-3 font-black shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transition-all active:scale-95 border border-white/20 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Sparkles size={20} className="animate-pulse" />
                  <span>Tạo bằng AI ✨</span>
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

      {/* AI Generation Modal */}
      <AnimatePresence>
        {showAIModal && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isGeneratingAI && setShowAIModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/95 backdrop-blur-xl w-full max-w-lg sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-white/20 max-h-[90vh] flex flex-col"
            >
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shrink-0" />
              
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6 sm:mb-8 sticky top-0 bg-white/50 backdrop-blur-sm -mt-2 py-2 z-10">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                      <BrainCircuit size={24} className="sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-tight">Trợ lý AI MathMastery</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400">Sẵn sàng soạn bài cho bạn</p>
                      </div>
                    </div>
                  </div>
                  {!isGeneratingAI && (
                    <button 
                      onClick={() => setShowAIModal(false)}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100/50 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Topic Input */}
                  <div className="p-5 sm:p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Wand2 size={14} className="text-purple-500" />
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Chủ đề bài tập</label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="Ví dụ: Phép tính với số thập phân..."
                        className="w-full pl-0 pr-10 py-2 bg-transparent border-b-2 border-slate-200 text-base sm:text-lg font-bold focus:border-purple-500 outline-none transition-all placeholder:text-slate-300"
                        disabled={isGeneratingAI}
                        autoFocus
                      />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-purple-400/50">
                        <Sparkles size={20} className="animate-pulse" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['Đại số', 'Hình học', 'Giải bài toán', 'Nâng cao'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => setAiTopic(tag)}
                          className="px-3 py-1.5 bg-white border border-slate-100 text-slate-500 rounded-xl text-[10px] font-bold hover:bg-purple-50 hover:text-purple-600 hover:border-purple-100 transition-all shadow-sm"
                          disabled={isGeneratingAI}
                        >
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Consolidated Grade & Count Row - Forced 2 columns on Mobile */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Grade Level Selection - Dropdown */}
                    <div className="p-4 sm:p-6 bg-slate-50/50 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm space-y-2 sm:space-y-3">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5 px-0.5 sm:px-1">
                        <BrainCircuit size={10} className="text-indigo-500 sm:w-3 sm:h-3" /> <span className="truncate">Khối lớp</span>
                      </label>
                      <div className="relative">
                        <select
                          value={aiSelectedGrade}
                          onChange={(e) => setAiSelectedGrade(parseInt(e.target.value))}
                          disabled={isGeneratingAI}
                          className="w-full pl-3 sm:pl-6 pr-8 sm:pr-10 py-3 sm:py-4 bg-white border-2 border-slate-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 appearance-none transition-all cursor-pointer shadow-inner"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                            <option key={g} value={g}>Lớp {g}</option>
                          ))}
                        </select>
                        <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronDown size={14} className="sm:w-[18px] sm:h-[18px]" />
                        </div>
                      </div>
                    </div>

                    {/* Question Count - Numeric Input */}
                    <div className="p-4 sm:p-6 bg-slate-50/50 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm space-y-2 sm:space-y-3">
                       <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5 px-0.5 sm:px-1">
                         <Layout size={10} className="text-emerald-500 sm:w-3 sm:h-3" /> <span className="truncate">Số câu</span>
                       </label>
                       <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={aiCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) setAiCount(Math.min(20, Math.max(1, val)));
                          }}
                          className="w-full pl-3 sm:pl-6 pr-8 sm:pr-10 py-3 sm:py-4 bg-white border-2 border-slate-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black text-emerald-600 outline-none focus:border-emerald-500 transition-all shadow-inner"
                          disabled={isGeneratingAI}
                        />
                        <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase hidden sm:block">Câu</div>
                       </div>
                    </div>
                  </div>

                  {/* Difficulty & Type Selection Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Difficulty */}
                    <div className="p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-3">
                         <Target size={12} className="text-rose-500" /> Độ khó
                       </label>
                       <div className="flex bg-white p-1 rounded-xl shadow-inner border border-slate-100">
                         {['Cơ bản', 'Trung bình', 'Nâng cao'].map((d: any) => (
                           <button
                             key={d}
                             onClick={() => setAiDifficulty(d)}
                             disabled={isGeneratingAI}
                             className={cn(
                               "flex-1 py-2 px-1 rounded-lg text-[10px] font-black transition-all",
                               aiDifficulty === d 
                               ? "bg-rose-50 text-rose-600 shadow-sm" 
                               : "text-slate-400 hover:text-slate-600"
                             )}
                           >
                             {d}
                           </button>
                         ))}
                       </div>
                    </div>

                    {/* Question Types */}
                    <div className="p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-3">
                        <Settings size={12} className="text-amber-500" /> Loại bài
                      </label>
                      <div className="flex gap-2">
                        {[
                          { id: 'multiple_choice', label: 'T.Nghiệm', icon: CheckSquare },
                          { id: 'short_answer', label: 'T.Luận', icon: Type }
                        ].map(type => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.id}
                              onClick={() => {
                                if (aiSelectedTypes.includes(type.id)) {
                                  if (aiSelectedTypes.length > 1) {
                                    setAiSelectedTypes(aiSelectedTypes.filter(t => t !== type.id));
                                  }
                                } else {
                                  setAiSelectedTypes([...aiSelectedTypes, type.id]);
                                }
                              }}
                              disabled={isGeneratingAI}
                              className={cn(
                                "flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 border-2",
                                aiSelectedTypes.includes(type.id)
                                ? "border-amber-400 bg-amber-50 text-amber-700 shadow-sm"
                                : "border-white bg-white text-slate-400 shadow-inner"
                              )}
                            >
                              <Icon size={12} />
                              {type.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {aiError && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                        <AlertCircle size={18} />
                      </div>
                      <p className="text-xs font-bold text-rose-600">{aiError}</p>
                    </motion.div>
                  )}

                  <div className="sticky bottom-0 bg-white/50 backdrop-blur-sm -mx-8 -mb-8 p-8 border-t border-slate-100">
                    <button
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI || !aiTopic.trim()}
                      className={cn(
                        "w-full py-5 rounded-[1.5rem] font-black text-sm shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]",
                        isGeneratingAI 
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                          : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/30 hover:shadow-2xl"
                      )}
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span className="tracking-tight">AI đang soạn bài tập...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} className="text-purple-400" />
                          <span className="tracking-tight">Bắt đầu tạo ngay</span>
                        </>
                      )}
                    </button>
                    
                    <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest pt-5 flex items-center justify-center gap-2">
                       Năng lượng từ <span className="text-purple-500">Gemini AI</span> 🔮
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
