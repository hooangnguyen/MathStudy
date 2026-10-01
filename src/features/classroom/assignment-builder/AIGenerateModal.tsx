import React from 'react';
import { Settings, Target, X, Layout, CheckSquare, Type, Sparkles, BrainCircuit, Wand2, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../utils/utils';
import type { AssignmentBuilderController } from './useAssignmentBuilder';

/** Hộp thoại tạo câu hỏi bằng AI. */
export const AIGenerateModal: React.FC<{ builder: AssignmentBuilderController }> = ({ builder }) => {
  const { showAIModal, setShowAIModal, aiTopic, setAiTopic, aiCount, setAiCount, isGeneratingAI, aiError, aiDifficulty, setAiDifficulty, aiSelectedTypes, setAiSelectedTypes, aiSelectedGrade, setAiSelectedGrade, handleGenerateAI } = builder;

  return (
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
                    <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-tight">Trợ lý AI Math Study</h3>
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
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
