import React, { useState, useEffect } from 'react';
import { ChevronLeft, Clock, CheckCircle2, ChevronRight, X, Square, CheckSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../utils/utils';
import { MathEquationEditor } from '../../components/common/MathEquationEditor';
import { AssignmentData, submitAssignment } from '../../services/assignmentService';
import { useFirebase } from '../../context/FirebaseProvider';

interface AssignmentViewerProps {
    assignment: AssignmentData;
    onClose: () => void;
    onSubmitted: () => void;
}

export const AssignmentViewer: React.FC<AssignmentViewerProps> = ({ assignment, onClose, onSubmitted }) => {
    const { user } = useFirebase();
    const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const baseQuestions = assignment.questions || [];
        if (assignment.settings?.shuffleQuestions) {
            // Fisher-Yates shuffle algorithm for better randomness
            const shuffled = [...baseQuestions];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setShuffledQuestions(shuffled);
        } else {
            setShuffledQuestions(baseQuestions);
        }
    }, [assignment]);

    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const questions = shuffledQuestions; // Alias for easier refactor

    const handleAnswerSelect = (questionId: number, answer: any) => {
        if (currentQuestion.type === 'checkbox') {
            const currentAnswers = Array.isArray(answers[questionId]) ? answers[questionId] : [];
            const newAnswers = currentAnswers.includes(answer)
                ? currentAnswers.filter((a: any) => a !== answer)
                : [...currentAnswers, answer];
            setAnswers(prev => ({ ...prev, [questionId]: newAnswers }));
        } else {
            setAnswers(prev => ({ ...prev, [questionId]: answer }));
        }
    };

    const calculateScore = () => {
        let score = 0;
        let totalPoints = 0;

        questions.forEach(q => {
            totalPoints += q.points;
            const studentAnswer = answers[q.id];

            if (q.type === 'multiple_choice' && studentAnswer === q.correctAnswer) {
                score += q.points;
            } else if (q.type === 'checkbox') {
                const correctArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
                const studentArr = Array.isArray(studentAnswer) ? studentAnswer : [];

                // Check if arrays are equal (ignoring order)
                const isCorrect = correctArr.length === studentArr.length &&
                    correctArr.every(val => studentArr.includes(val));
                if (isCorrect) score += q.points;
            } else if (q.type === 'short_answer') {
                // Exact match (case insensitive, trimmed)
                if (studentAnswer?.toString().trim().toLowerCase() === q.correctAnswer?.toString().trim().toLowerCase()) {
                    score += q.points;
                }
            }
            // Essay always needs manual grading
        });

        return totalPoints > 0 ? Number(((score / totalPoints) * 10).toFixed(1)) : 0;
    };

    const handleSubmit = async () => {
        if (!user || isSubmitting) return;

        // Optional: check if all questions answered
        if (Object.keys(answers).length < questions.length) {
            const confirmSubmit = window.confirm("Bạn chưa hoàn thành tất cả câu hỏi. Vẫn muốn nộp bài?");
            if (!confirmSubmit) return;
        }

        setIsSubmitting(true);
        try {
            const score = calculateScore();
            const studentName = user.displayName || 'Học sinh ẩn danh';

            const formattedAnswers = questions.map(q => ({
                questionId: q.id,
                questionText: q.text,
                type: q.type,
                options: q.options,
                correctAnswer: q.correctAnswer,
                answer: answers[q.id] !== undefined ? answers[q.id] : null,
                isCorrect: q.type === 'multiple_choice'
                    ? answers[q.id] === q.correctAnswer
                    : q.type === 'checkbox'
                        ? (Array.isArray(q.correctAnswer) && Array.isArray(answers[q.id]) &&
                            q.correctAnswer.length === answers[q.id].length &&
                            q.correctAnswer.every((val: any) => answers[q.id].includes(val)))
                        : null
            }));

            await submitAssignment(
                assignment.classId,
                assignment.id,
                user.uid,
                studentName,
                formattedAnswers,
                score
            );

            if (assignment.settings?.showScoreImmediate) {
                alert(`Nộp bài thành công! Điểm của bạn: ${score}/10`);
            } else {
                alert('Nộp bài thành công!');
            }

            onSubmitted();
        } catch (error: any) {
            console.error("Error submitting assignment:", error);
            alert(error.message || "Đã xảy ra lỗi khi nộp bài.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentQuestion) return null;

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
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 line-clamp-1">{assignment.title}</h2>
                            <p className="text-xs font-bold text-slate-400">
                                Câu {currentQuestionIndex + 1}/{questions.length}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Submit button moved to footer */}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-slate-100 w-full">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar pb-32">
                <div className="max-w-3xl mx-auto space-y-8">

                    <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border-t-4 border-t-indigo-500 border-x border-b border-slate-200 text-left flex flex-col gap-2 min-h-fit">
                        <p className="text-sm font-black text-indigo-600 uppercase tracking-widest shrink-0">
                            Câu {currentQuestionIndex + 1}
                        </p>
                        <div className="w-full">
                            <MathEquationEditor
                                value={currentQuestion.text}
                                readOnly
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'checkbox') && (
                          <>
                            <p className="text-sm font-bold text-slate-500 mb-2">
                              {currentQuestion.type === 'multiple_choice'
                                ? 'Chọn một đáp án đúng'
                                : 'Chọn một hoặc nhiều đáp án đúng'}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {currentQuestion.options?.map((opt, idx) => {
                                  const isSelected = currentQuestion.type === 'multiple_choice'
                                    ? answers[currentQuestion.id] === idx
                                    : (Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(idx));
    
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleAnswerSelect(currentQuestion.id, idx)}
                                      className={cn(
                                        "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 active:scale-[0.98]",
                                        isSelected
                                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                          : "border-slate-100 bg-white hover:border-indigo-200 text-slate-700 hover:bg-slate-50"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-7 h-7 flex items-center justify-center shrink-0 transition-colors",
                                        currentQuestion.type === 'multiple_choice' ? "rounded-full border-2" : "rounded-lg border-2",
                                        isSelected ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 bg-white"
                                      )}>
                                        {currentQuestion.type === 'multiple_choice' ? (
                                          isSelected ? <CheckCircle2 size={18} /> : null
                                        ) : (
                                          isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-400" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <MathEquationEditor
                                          value={opt}
                                          readOnly
                                          className="w-full"
                                        />
                                      </div>
                                    </button>
                                  );
                                })}
                            </div>
                          </>
                        )}

                        {/* Support for short answer and essay */}
                        {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && (
                            <textarea
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                                className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-base font-bold text-slate-700 transition-all resize-none"
                                placeholder={currentQuestion.type === 'essay' ? "Nhập bài làm của bạn..." : "Nhập câu trả lời ngắn..."}
                                rows={currentQuestion.type === 'essay' ? 8 : 4}
                            />
                        )}
                    </div>

                </div>
            </div>

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-6 py-3 rounded-2xl font-black text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <ChevronLeft size={20} />
                        Câu trước
                    </button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-8 py-3 rounded-2xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-200 flex items-center gap-2"
                        >
                            {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                            <CheckCircle2 size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            className="px-6 py-3 rounded-2xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            Câu tiếp
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            </div>

        </motion.div >
    );
};
