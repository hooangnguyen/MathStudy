import React, { useState, useRef, useEffect } from 'react';
import { createAssignment, saveDraftAssignment, deleteDraftAssignment } from '../../../services/assignmentService';
import { subscribeToTeacherClasses, ClassData } from '../../../services/classService';
import { useFirebase } from '../../../context/FirebaseProvider';
import { generateQuestionsWithAI } from '../../../services/aiService';
import type { AssignmentBuilderProps } from './types';

/** State và xử lý của trình soạn bài tập; các phần giao diện nằm cùng thư mục. */
export const useAssignmentBuilder = ({ classId, totalStudents, initialDraft, onClose, onAssigned, onDraftSaved }: AssignmentBuilderProps) => {
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

  return {
    classId,
    totalStudents,
    initialDraft,
    onClose,
    onAssigned,
    onDraftSaved,
    user,
    activeTab,
    setActiveTab,
    title,
    setTitle,
    description,
    setDescription,
    dueDate,
    setDueDate,
    shuffleQuestions,
    setShuffleQuestions,
    showScoreImmediate,
    setShowScoreImmediate,
    isSubmitting,
    setIsSubmitting,
    isSavingDraft,
    setIsSavingDraft,
    activePicker,
    setActivePicker,
    showQuestionTypeDropdown,
    setShowQuestionTypeDropdown,
    teacherClasses,
    setTeacherClasses,
    selectedClassId,
    setSelectedClassId,
    showAIModal,
    setShowAIModal,
    aiTopic,
    setAiTopic,
    aiCount,
    setAiCount,
    isGeneratingAI,
    setIsGeneratingAI,
    aiError,
    setAiError,
    aiDifficulty,
    setAiDifficulty,
    aiSelectedTypes,
    setAiSelectedTypes,
    aiSelectedGrade,
    setAiSelectedGrade,
    questionTypeDropdownRefs,
    mathPickerRef,
    questionTriggerRefs,
    optionTriggerRefs,
    questionMathRefs,
    optionMathRefs,
    questions,
    setQuestions,
    addQuestion,
    updateQuestion,
    addOption,
    updateOption,
    removeOption,
    removeQuestion,
    duplicateQuestion,
    handleSymbolSelect,
    handleAssign,
    handleSaveDraft,
    handleDeleteExistingDraft,
    handleGenerateAI,
  };
};

export type AssignmentBuilderController = ReturnType<typeof useAssignmentBuilder>;
