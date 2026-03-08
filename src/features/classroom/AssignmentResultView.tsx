import React from 'react';
import { ChevronLeft, CheckCircle2, XCircle, AlertCircle, CheckSquare, Type, FileText, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../utils/utils';
import { SubmissionData } from '../../services/assignmentService';

interface AssignmentResultViewProps {
    submission: SubmissionData;
    assignmentTitle: string;
    onClose: () => void;
}

export const AssignmentResultView: React.FC<AssignmentResultViewProps> = ({ submission, assignmentTitle, onClose }) => {

    const getQuestionIcon = (type: string) => {
        switch (type) {
            case 'multiple_choice': return <CheckCircle2 size={18} />;
            case 'checkbox': return <CheckSquare size={18} />;
            case 'short_answer': return <Type size={18} />;
            case 'essay': return <FileText size={18} />;
            default: return <FileText size={18} />;
        }
    };

    const getQuestionTypeLabel = (type: string) => {
        switch (type) {
            case 'multiple_choice': return 'Trắc nghiệm';
            case 'checkbox': return 'Hộp kiểm';
            case 'short_answer': return 'Điền từ / Số';
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
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shrink-0 shadow-sm">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 line-clamp-1">{assignmentTitle}</h2>
                            <p className="text-xs font-bold text-slate-400">Kết quả bài làm</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-slate-50">
                <div className="max-w-3xl mx-auto space-y-8 pb-10">

                    {/* Summary Card */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border-2 border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <h3 className="text-2xl font-black text-slate-900">Tổng điểm của bạn</h3>
                            <p className="text-slate-500 font-bold mt-1">
                                Hoàn thành lúc: {submission.submittedAt ? new Date(submission.submittedAt.toMillis()).toLocaleString('vi-VN') : '--'}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-indigo-50 border-4 border-indigo-100 rounded-full flex flex-col items-center justify-center shadow-inner">
                                <span className="text-3xl md:text-5xl font-black text-indigo-600">{submission.score}</span>
                                <span className="text-xs md:text-sm font-black text-indigo-400 uppercase">Điểm</span>
                            </div>
                        </div>
                    </div>

                    {/* Feedback if any */}
                    {submission.feedback && (
                        <div className="bg-amber-50 rounded-[2rem] p-6 border-2 border-amber-100 shadow-sm space-y-3">
                            <h4 className="text-amber-800 font-black flex items-center gap-2">
                                <MessageSquare size={20} />
                                Nhận xét từ giáo viên
                            </h4>
                            <p className="text-amber-900 font-medium italic text-lg leading-relaxed">
                                "{submission.feedback}"
                            </p>
                        </div>
                    )}

                    {/* Questions Review */}
                    <div className="space-y-6">
                        {submission.answers.map((answer, index) => (
                            <div key={index} className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border-2 border-slate-200 space-y-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-indigo-500 uppercase tracking-wider">Câu {index + 1}</span>
                                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1">
                                                {getQuestionIcon(answer.type)}
                                                {getQuestionTypeLabel(answer.type)}
                                            </span>
                                        </div>
                                        <p className="text-xl font-bold text-slate-900 leading-relaxed">{answer.questionText}</p>
                                    </div>
                                    <div className="shrink-0">
                                        {answer.isCorrect === true ? (
                                            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl shadow-sm">
                                                <CheckCircle2 size={24} />
                                            </div>
                                        ) : answer.isCorrect === false ? (
                                            <div className="bg-rose-100 text-rose-600 p-2 rounded-xl shadow-sm">
                                                <XCircle size={24} />
                                            </div>
                                        ) : (
                                            <div className="bg-amber-100 text-amber-600 p-2 rounded-xl shadow-sm">
                                                <AlertCircle size={24} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Student Answer Box */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bài làm của bạn</p>
                                    <div className={cn(
                                        "p-5 rounded-2xl border-2 font-bold text-lg",
                                        answer.isCorrect === true ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                                            answer.isCorrect === false ? "bg-rose-50 border-rose-100 text-rose-700" :
                                                "bg-slate-50 border-slate-200 text-slate-700"
                                    )}>
                                        {answer.type === 'checkbox' && Array.isArray(answer.answer) ? (
                                            <div className="space-y-2">
                                                {answer.answer.map((idx: number) => (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <CheckSquare size={20} className="shrink-0" />
                                                        <span>{answer.options?.[idx]}</span>
                                                    </div>
                                                ))}
                                                {answer.answer.length === 0 && <span className="italic text-slate-400">Không có đáp án nào được chọn</span>}
                                            </div>
                                        ) : answer.type === 'multiple_choice' ? (
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 size={20} className="shrink-0" />
                                                <span>{answer.options?.[answer.answer]}</span>
                                            </div>
                                        ) : (
                                            <div className="whitespace-pre-wrap">{answer.answer || <span className="italic text-slate-400">Không có câu trả lời</span>}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Correct Answer Box (only if incorrect or needed) */}
                                {(answer.isCorrect === false || answer.type === 'short_answer') && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">Đáp án đúng</p>
                                        <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-100 text-emerald-800 font-bold text-lg">
                                            {answer.type === 'multiple_choice' ? (
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
                                                    <span>{answer.options?.[answer.correctAnswer]}</span>
                                                </div>
                                            ) : answer.type === 'checkbox' && Array.isArray(answer.correctAnswer) ? (
                                                <div className="space-y-2">
                                                    {answer.correctAnswer.map((idx: number) => (
                                                        <div key={idx} className="flex items-center gap-3">
                                                            <CheckSquare size={20} className="shrink-0 text-emerald-500" />
                                                            <span>{answer.options?.[idx]}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="whitespace-pre-wrap">{answer.correctAnswer}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0 text-center">
                <button
                    onClick={onClose}
                    className="w-full max-w-xs py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
                >
                    Đóng lại
                </button>
            </div>
        </motion.div>
    );
};
