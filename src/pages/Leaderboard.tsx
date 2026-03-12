import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Crown, Globe, BookOpen, Swords } from 'lucide-react';
import { cn } from '../utils/utils';
import { getTopRankings, getClassRankings, UserRank, RANKS, getRankTier } from '../services/duelService';
import { useFirebase } from '../context/FirebaseProvider';

type Tab = 'world' | 'class';

const RANK_ICONS: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', diamond: '💠', challenger: '👑'
};

export const Leaderboard: React.FC = () => {
  const { user, userProfile } = useFirebase() as any;
  const [tab, setTab] = useState<Tab>('world');
  const [rankings, setRankings] = useState<UserRank[]>([]);
  const [loading, setLoading] = useState(true);

  const myGrade = userProfile?.grade || 1;

  useEffect(() => {
    setLoading(true);
    const fetch = tab === 'world'
      ? getTopRankings(50)
      : getClassRankings(myGrade, 50);

    fetch.then(data => { setRankings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab, myGrade]);

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-indigo-50/20 to-rose-50/10">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-amber-200/20 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl px-5 pt-5 pb-4 shrink-0 border-b border-white/20">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-black tracking-tight">Bảng xếp hạng</h1>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 rounded-2xl shadow-lg shadow-amber-500/20"
          >
            <Trophy size={14} className="text-white" />
            <span className="text-xs font-black text-white uppercase tracking-wider">Mùa 2025</span>
          </motion.div>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl">
          <button
            onClick={() => setTab('world')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              tab === 'world' ? "bg-white text-indigo-600 shadow-md" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Globe size={14} />
            Thế giới
          </button>
          <button
            onClick={() => setTab('class')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              tab === 'class' ? "bg-white text-emerald-600 shadow-md" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <BookOpen size={14} />
            Lớp {myGrade}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full" />
        </div>
      ) : rankings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="w-20 h-20 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
            <Swords size={36} className="text-slate-400" />
          </div>
          <p className="font-black text-slate-700 text-lg">Chưa có dữ liệu</p>
          <p className="text-sm text-slate-400">
            {tab === 'class' ? `Chưa có học sinh lớp ${myGrade} thi đấu.` : 'Hãy tham gia đấu trường để lên bảng xếp hạng!'}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          {/* Podium - Top 3 */}
          {top3.length >= 2 && (
            <div className="bg-gradient-to-b from-white via-white/80 to-slate-50/50 px-6 pt-6 pb-8">
              <div className="flex items-end justify-center gap-2">
                {/* 2nd */}
                {top3[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 p-0.5 shadow-lg">
                        <img
                          src={top3[1].avatar || `https://picsum.photos/seed/${top3[1].uid}/100`}
                          className="w-full h-full rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow">2</div>
                    </div>
                    <div className="h-16 w-20 bg-white/80 backdrop-blur-sm rounded-t-2xl border border-slate-100 flex flex-col items-center justify-center p-1 shadow-md text-center">
                      <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{top3[1].username.split(' ').pop()}</span>
                      <span className="text-xs font-black text-slate-400">{top3[1].lp} LP</span>
                      <span className="text-[9px]">{RANK_ICONS[top3[1].rankTier]}</span>
                    </div>
                  </motion.div>
                )}

                {/* 1st */}
                {top3[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Crown className="text-amber-400 fill-amber-400 -mb-1 drop-shadow-lg" size={24} />
                    </motion.div>
                    <div className="relative">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 p-0.5 shadow-xl shadow-amber-300/30">
                        <img
                          src={top3[0].avatar || `https://picsum.photos/seed/${top3[0].uid}/100`}
                          className="w-full h-full rounded-[22px] object-cover border-2 border-white"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-4 border-white shadow-lg">1</div>
                    </div>
                    <div className="h-24 w-24 bg-white/80 backdrop-blur-sm rounded-t-3xl border border-slate-100 flex flex-col items-center justify-center shadow-lg p-1 text-center">
                      <span className="text-xs font-bold text-slate-700 truncate w-full text-center">{top3[0].username.split(' ').pop()}</span>
                      <span className="text-sm font-black text-indigo-600">{top3[0].lp} LP</span>
                      <span className="text-xs">{RANK_ICONS[top3[0].rankTier]}</span>
                    </div>
                  </motion.div>
                )}

                {/* 3rd */}
                {top3[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-300 to-orange-400 p-0.5 shadow-lg">
                        <img
                          src={top3[2].avatar || `https://picsum.photos/seed/${top3[2].uid}/100`}
                          className="w-full h-full rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow">3</div>
                    </div>
                    <div className="h-12 w-20 bg-white/80 backdrop-blur-sm rounded-t-2xl border border-slate-100 flex flex-col items-center justify-center p-1 shadow-md text-center">
                      <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center">{top3[2].username.split(' ').pop()}</span>
                      <span className="text-xs font-black text-slate-400">{top3[2].lp} LP</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Rest of rank list */}
          <div className="p-4 space-y-2">
            <div className="flex justify-between px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <span>Hạng / Tên</span>
              <span>LP / Huy hiệu</span>
            </div>
            {rest.map((rank, i) => {
              const isMe = rank.uid === user?.uid;
              const pos = i + 4;
              return (
                <motion.div
                  key={rank.uid}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "p-4 rounded-[1.5rem] flex items-center justify-between border transition-all",
                    isMe ? "bg-indigo-50/80 backdrop-blur-sm border-indigo-200 shadow-md" : "bg-white/80 backdrop-blur-sm border-white/50 shadow-md hover:shadow-lg"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("w-7 text-center font-black text-sm", isMe ? "text-indigo-600" : "text-slate-400")}>{pos}</span>
                    <img
                      src={rank.avatar || `https://picsum.photos/seed/${rank.uid}/100`}
                      className="w-10 h-10 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className={cn("font-bold text-sm truncate max-w-[130px]", isMe && "text-indigo-700")}>
                        {rank.username} {isMe && '(bạn)'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {rank.wins}T · {rank.losses}B · {rank.draws}H
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{RANK_ICONS[rank.rankTier]}</span>
                    <div className="text-right">
                      <p className="font-black text-sm text-indigo-600">{rank.lp} LP</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{RANKS[rank.rankTier]?.name}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
