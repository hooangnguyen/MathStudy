import React, { useState, useEffect } from 'react';
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
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 shrink-0 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-black tracking-tight">Bảng xếp hạng</h1>
          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
            <Trophy size={14} className="text-amber-500" />
            <span className="text-xs font-black text-amber-600 uppercase tracking-wider">Mùa 2025</span>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setTab('world')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              tab === 'world' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
            )}
          >
            <Globe size={14} />
            Thế giới
          </button>
          <button
            onClick={() => setTab('class')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              tab === 'class' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"
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
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
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
            <div className="bg-gradient-to-b from-white to-slate-50 px-6 pt-4 pb-6">
              <div className="flex items-end justify-center gap-3">
                {/* 2nd */}
                {top3[1] && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-slate-200 p-0.5 shadow">
                        <img
                          src={top3[1].avatar || `https://picsum.photos/seed/${top3[1].uid}/100`}
                          className="w-full h-full rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">2</div>
                    </div>
                    <div className="h-16 w-20 bg-white rounded-t-2xl border-x border-t border-slate-100 flex flex-col items-center justify-center p-1 shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{top3[1].username.split(' ').pop()}</span>
                      <span className="text-xs font-black text-slate-400">{top3[1].lp} LP</span>
                      <span className="text-[9px]">{RANK_ICONS[top3[1].rankTier]}</span>
                    </div>
                  </div>
                )}

                {/* 1st */}
                {top3[0] && (
                  <div className="flex flex-col items-center gap-2">
                    <Crown className="text-amber-400 fill-amber-400 -mb-1" size={22} />
                    <div className="relative">
                      <div className="w-20 h-20 rounded-3xl bg-amber-400 p-0.5 shadow-lg shadow-amber-200">
                        <img
                          src={top3[0].avatar || `https://picsum.photos/seed/${top3[0].uid}/100`}
                          className="w-full h-full rounded-[22px] object-cover border-2 border-white"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-white text-xs font-bold border-4 border-white">1</div>
                    </div>
                    <div className="h-24 w-24 bg-white rounded-t-3xl border-x border-t border-slate-100 flex flex-col items-center justify-center shadow p-1 text-center">
                      <span className="text-xs font-bold text-slate-700 truncate w-full text-center">{top3[0].username.split(' ').pop()}</span>
                      <span className="text-sm font-black text-indigo-600">{top3[0].lp} LP</span>
                      <span className="text-xs">{RANK_ICONS[top3[0].rankTier]}</span>
                    </div>
                  </div>
                )}

                {/* 3rd */}
                {top3[2] && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-orange-100 p-0.5 shadow">
                        <img
                          src={top3[2].avatar || `https://picsum.photos/seed/${top3[2].uid}/100`}
                          className="w-full h-full rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">3</div>
                    </div>
                    <div className="h-12 w-20 bg-white rounded-t-2xl border-x border-t border-slate-100 flex flex-col items-center justify-center p-1 shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center">{top3[2].username.split(' ').pop()}</span>
                      <span className="text-xs font-black text-slate-400">{top3[2].lp} LP</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rest of rank list */}
          <div className="p-4 space-y-2">
            <div className="flex justify-between px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              <span>Hạng / Tên</span>
              <span>LP / Huy hiệu</span>
            </div>
            {rest.map((rank, i) => {
              const isMe = rank.uid === user?.uid;
              const pos = i + 4;
              return (
                <div
                  key={rank.uid}
                  className={cn(
                    "p-4 rounded-3xl flex items-center justify-between border transition-all",
                    isMe ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white border-slate-100"
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
