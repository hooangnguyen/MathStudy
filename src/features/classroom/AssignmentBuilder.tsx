import React, { useState } from 'react';
import { 
  ChevronLeft, Plus, Settings, FileText, 
  Image as ImageIcon, Trash2, Copy, CheckCircle2,
  Clock, Calendar, Users, Target, Sigma, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/utils';
import { MathSymbolPicker } from '../../components/common/MathSymbolPicker';

interface AssignmentBuilderProps {
  onClose: () => void;
}

export const AssignmentBuilder: React.FC<AssignmentBuilderProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'settings'>('questions');
  const [title, setTitle] = useState('Bài tập chưa có tiêu đề');
  const [description, setDescription] = useState('');
  const [activePicker, setActivePicker] = useState<{ type: 'question' | 'option', id: number, optIndex?: number } | null>(null);
  
  const [questions, setQuestions] = useState([
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
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-black text-slate-900 bg-transparent border-none outline-none focus:ring-0 w-full max-w-md placeholder:text-slate-300"
              placeholder="Tiêu đề bài tập"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 active:scale-95 transition-transform">
              Giao bài
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
                  <div className="flex items-start gap-4">
                    <div className="flex-1 relative">
                      <input 
                        type="text"
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                        className="w-full p-4 pr-12 bg-slate-50 rounded-2xl text-base font-bold border-none outline-none focus:bg-slate-100 transition-colors placeholder:text-slate-400"
                        placeholder="Nhập câu hỏi..."
                      />
                      <button 
                        onClick={() => setActivePicker(activePicker?.id === q.id && activePicker?.type === 'question' ? null : { type: 'question', id: q.id })}
                        className={cn(
                          "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors",
                          activePicker?.id === q.id && activePicker?.type === 'question' ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-200"
                        )}
                        title="Chèn kí tự toán học"
                      >
                        <Sigma size={18} />
                      </button>

                      {activePicker?.id === q.id && activePicker?.type === 'question' && (
                        <MathSymbolPicker onSelect={handleSymbolSelect} onClose={() => setActivePicker(null)} />
                      )}
                    </div>
                    <select 
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                      className="p-4 bg-slate-50 rounded-2xl text-sm font-black text-slate-700 border-none outline-none cursor-pointer"
                    >
                      <option value="multiple_choice">Trắc nghiệm</option>
                      <option value="checkbox">Hộp kiểm</option>
                      <option value="short_answer">Trả lời ngắn</option>
                    </select>
                  </div>

                  {/* Options for Multiple Choice */}
                  {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                    <div className="space-y-3 pl-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <div className={cn(
                            "w-5 h-5 flex items-center justify-center border-2 cursor-pointer transition-colors",
                            q.type === 'multiple_choice' ? "rounded-full" : "rounded-md",
                            q.correctAnswer === optIndex 
                              ? "border-emerald-500 bg-emerald-500 text-white" 
                              : "border-slate-300 hover:border-indigo-500"
                          )}
                          onClick={() => updateQuestion(q.id, 'correctAnswer', optIndex)}
                          >
                            {q.correctAnswer === optIndex && <CheckCircle2 size={14} />}
                          </div>
                          <div className="flex-1 relative">
                            <input 
                              type="text"
                              value={opt}
                              onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none py-2 pr-8 text-sm font-bold text-slate-700 transition-colors"
                              placeholder={`Tùy chọn ${optIndex + 1}`}
                            />
                            <button 
                              onClick={() => setActivePicker(activePicker?.id === q.id && activePicker?.type === 'option' && activePicker?.optIndex === optIndex ? null : { type: 'option', id: q.id, optIndex })}
                              className={cn(
                                "absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors",
                                activePicker?.id === q.id && activePicker?.type === 'option' && activePicker?.optIndex === optIndex ? "bg-indigo-600 text-white" : "text-slate-300 hover:text-indigo-600"
                              )}
                              title="Chèn kí tự toán học"
                            >
                              <Sigma size={14} />
                            </button>

                            {activePicker?.id === q.id && activePicker?.type === 'option' && activePicker?.optIndex === optIndex && (
                              <MathSymbolPicker onSelect={handleSymbolSelect} onClose={() => setActivePicker(null)} />
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Điểm:</span>
                      <input 
                        type="number" 
                        value={q.points}
                        onChange={(e) => updateQuestion(q.id, 'points', parseInt(e.target.value) || 0)}
                        className="w-16 p-2 bg-slate-50 rounded-xl text-sm font-black text-center border-none outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => duplicateQuestion(q.id)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors" title="Nhân bản">
                        <Copy size={20} />
                      </button>
                      <button onClick={() => removeQuestion(q.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors" title="Xóa">
                        <Trash2 size={20} />
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
                      {['Toán 5A', 'Toán 5B', 'Toán 5C'].map(c => (
                        <label key={c} className="flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-indigo-500 transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                          <input type="checkbox" className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                          <span className="text-sm font-black text-slate-700">{c}</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ngày bắt đầu</label>
                      <input type="datetime-local" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Hạn chót</label>
                      <input type="datetime-local" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500" />
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
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200">
                        <input type="checkbox" className="peer sr-only" />
                        <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white transition peer-checked:translate-x-6 peer-checked:bg-indigo-600" />
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-slate-200 transition-colors">
                      <div>
                        <p className="text-sm font-black text-slate-700">Hiển thị điểm ngay</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">Học sinh thấy điểm ngay sau khi nộp bài</p>
                      </div>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600">
                        <input type="checkbox" className="peer sr-only" defaultChecked />
                        <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition peer-checked:translate-x-6 peer-checked:bg-indigo-600" />
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
