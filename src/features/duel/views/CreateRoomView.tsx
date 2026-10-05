import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { MathDuelController } from '../useMathDuel';

export const CreateRoomView: React.FC<{ duel: MathDuelController }> = ({ duel }) => {
  const { userRole, setState, gameMode, setGameMode, timeLimit, setTimeLimit, isCreatingRoom, handleCreateRoom } = duel;

  return (
    <motion.div
      key="create_room"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col p-6 items-center justify-center"
    >
      <div className="w-full max-w-sm bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">
            {userRole === 'teacher' ? 'Tạo phòng Quiz' : 'Tạo phòng'}
          </h2>
          <button onClick={() => setState('lobby')} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {userRole === 'teacher' && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Chọn đề thi</label>
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-primary">
                <option>Kiểm tra 15 phút - Tuần 4</option>
                <option>Bài tập cuối tuần - Hình học</option>
                <option>Ôn tập Phân số</option>
              </select>
            </div>
          )}

          {userRole === 'teacher' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Chế độ chơi</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGameMode('time')}
                    className={cn(
                      "p-4 rounded-2xl font-bold text-sm transition-all border-2",
                      gameMode === 'time'
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                        : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    Theo thời gian
                  </button>
                  <button
                    onClick={() => setGameMode('questions')}
                    className={cn(
                      "p-4 rounded-2xl font-bold text-sm transition-all border-2",
                      gameMode === 'questions'
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                        : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    Hết câu hỏi
                  </button>
                </div>
              </div>

              {gameMode === 'time' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Thời gian</label>
                  <select
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-primary"
                  >
                    <option value={30}>30 giây</option>
                    <option value={60}>60 giây</option>
                    <option value={90}>90 giây</option>
                    <option value={120}>2 phút</option>
                  </select>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Số câu hỏi</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-primary">
                  <option>10 câu</option>
                  <option>20 câu</option>
                  <option>30 câu</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Thời gian (phút)</label>
                <select
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-primary"
                >
                  <option value={60}>1 phút</option>
                  <option value={180}>3 phút</option>
                  <option value={300}>5 phút</option>
                  <option value={600}>10 phút</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleCreateRoom}
          disabled={isCreatingRoom}
          className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {isCreatingRoom ? 'Đang tạo...' : 'TẠO PHÒNG NGAY'}
        </button>
      </div>
    </motion.div>
  );
};
