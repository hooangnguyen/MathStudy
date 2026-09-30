import React from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import type { MathDuelController } from '../useMathDuel';

export const SearchingView: React.FC<{ duel: MathDuelController }> = ({ duel }) => {
  const { user, userProfile, setState, availableOpponents, searchProgress } = duel;

  return (
    <motion.div
      key="searching"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-6 space-y-12"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-48 h-48 rounded-full border-4 border-dashed border-indigo-200"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-4xl font-black text-indigo-600">{userProfile?.name?.charAt(0) || user?.email?.charAt(0) || '?'}</span>
            )}
            <div className="absolute inset-0 bg-indigo-600/20" />
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-4 -right-4 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg"
        >
          <Search size={24} />
        </motion.div>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-black">Đang tìm đối thủ...</h2>
        {availableOpponents.length > 0 ? (
          <p className="text-green-500 font-bold">Tìm thấy {availableOpponents.length} đối thủ!</p>
        ) : (
          <div className="w-64 h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${searchProgress}%` }}
            />
          </div>
        )}
        <p className="text-slate-400 font-bold text-sm">Đang chờ người chơi khác...</p>
      </div>

      <button
        onClick={() => setState('lobby')}
        className="text-slate-400 font-black text-sm uppercase tracking-widest hover:text-red-500 transition-colors"
      >
        Hủy tìm kiếm
      </button>
    </motion.div>
  );
};
