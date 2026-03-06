import React, { useState } from 'react';
import { X, ChevronRight, CheckCircle2, AlertCircle, Volume2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/utils';

interface Question {
  id: number;
  type: 'multiple-choice' | 'input';
  question: string;
  options?: string[];
  answer: string;
  hint: string;
}

interface LessonViewProps {
  lessonTitle: string;
  onClose: () => void;
  onComplete: (score: number) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({ lessonTitle, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      type: 'multiple-choice',
      question: 'Để cộng hai phân số khác mẫu số, bước đầu tiên chúng ta cần làm là gì?',
      options: [
        'Cộng tử số với tử số',
        'Quy đồng mẫu số hai phân số',
        'Cộng mẫu số với mẫu số',
        'Nhân hai phân số với nhau'
      ],
      answer: 'Quy đồng mẫu số hai phân số',
      hint: 'Chúng ta cần đưa chúng về cùng một "mẫu" chung trước khi cộng.'
    },
    {
      id: 2,
      type: 'input',
      question: 'Tính kết quả của phép tính: 1/2 + 1/4 = ? (Viết dưới dạng phân số a/b)',
      answer: '3/4',
      hint: 'Quy đồng 1/2 thành 2/4, sau đó cộng với 1/4.'
    },
    {
      id: 3,
      type: 'multiple-choice',
      question: 'Mẫu số chung nhỏ nhất của 1/3 và 1/5 là bao nhiêu?',
      options: ['8', '10', '15', '30'],
      answer: '15',
      hint: 'Tìm số nhỏ nhất chia hết cho cả 3 và 5.'
    }
  ];

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleCheck = () => {
    const correct = currentQuestion.type === 'multiple-choice' 
      ? selectedOption === currentQuestion.answer
      : inputValue.trim() === currentQuestion.answer;
    
    setIsCorrect(correct);
    setIsChecked(true);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
      setInputValue('');
      setIsChecked(false);
      setShowHint(false);
    } else {
      onComplete(100);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center gap-4 shrink-0">
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={24} />
        </button>
        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-primary rounded-full"
          />
        </div>
        <div className="flex items-center gap-1 text-primary font-black text-sm">
          <Star size={16} fill="currentColor" />
          <span>+10</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400">
            <HelpCircle size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Câu hỏi {currentStep + 1} / {questions.length}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 leading-tight">
            {currentQuestion.question}
          </h2>
        </div>

        {currentQuestion.type === 'multiple-choice' ? (
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options?.map((option, i) => (
              <button
                key={i}
                disabled={isChecked}
                onClick={() => setSelectedOption(option)}
                className={cn(
                  "p-5 rounded-[2rem] border-2 text-left transition-all relative group",
                  selectedOption === option 
                    ? "border-primary bg-primary/5" 
                    : "border-slate-100 hover:border-slate-200 bg-white",
                  isChecked && option === currentQuestion.answer && "border-emerald-500 bg-emerald-50",
                  isChecked && selectedOption === option && option !== currentQuestion.answer && "border-rose-500 bg-rose-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm border-2",
                    selectedOption === option ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-400 border-slate-100"
                  )}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className={cn(
                    "font-bold text-sm",
                    selectedOption === option ? "text-primary" : "text-slate-600"
                  )}>
                    {option}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              disabled={isChecked}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập câu trả lời của bạn..."
              className={cn(
                "w-full p-6 rounded-[2rem] border-2 bg-slate-50 text-lg font-black text-center outline-none transition-all",
                isChecked && isCorrect ? "border-emerald-500 bg-emerald-50" : 
                isChecked && !isCorrect ? "border-rose-500 bg-rose-50" :
                "border-slate-100 focus:border-primary focus:bg-white"
              )}
            />
          </div>
        )}

        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3"
            >
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                <span className="font-black">Gợi ý:</span> {currentQuestion.hint}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Feedback */}
      <div className={cn(
        "p-6 pb-10 border-t transition-all duration-500",
        isChecked ? (isCorrect ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100") : "bg-white border-slate-100"
      )}>
        <div className="max-w-md mx-auto space-y-4">
          {isChecked && (
            <div className="flex items-center gap-4 mb-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              )}>
                {isCorrect ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
              </div>
              <div>
                <h4 className={cn("font-black text-lg", isCorrect ? "text-emerald-900" : "text-rose-900")}>
                  {isCorrect ? 'Tuyệt vời!' : 'Chưa chính xác'}
                </h4>
                <p className={cn("text-xs font-medium", isCorrect ? "text-emerald-700" : "text-rose-700")}>
                  {isCorrect ? 'Bạn đã trả lời đúng câu hỏi này.' : `Đáp án đúng là: ${currentQuestion.answer}`}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!isChecked && (
              <button 
                onClick={() => setShowHint(!showHint)}
                className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center active:scale-90 transition-transform"
              >
                <HelpCircle size={24} />
              </button>
            )}
            <button
              onClick={isChecked ? handleNext : handleCheck}
              disabled={!isChecked && !selectedOption && !inputValue}
              className={cn(
                "flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95",
                !isChecked && !selectedOption && !inputValue ? "bg-slate-200 text-slate-400 shadow-none" :
                isChecked ? (isCorrect ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-rose-500 text-white shadow-rose-200") :
                "bg-primary text-white shadow-primary/30"
              )}
            >
              {isChecked ? 'Tiếp tục' : 'Kiểm tra'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import { Star } from 'lucide-react';
