import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, ShieldCheck, Zap, Star, ChevronLeft, Search, Crown, Users, TrendingUp, Medal } from 'lucide-react';
import { cn } from '../../utils/utils';
import { useFirebase } from '../../context/FirebaseProvider';
import { getUserRank, getTopRankings, getClassRankings, UserRank, RANKS } from '../../services/duelService';

interface MultiplayerLeaderboardProps {
  onBack?: () => void;
}

export const MultiplayerLeaderboard: React.FC<MultiplayerLeaderboardProps> = ({ onBack }) => {
  const { user, userProfile } = useFirebase();
  const [filter, setFilter] = useState<'global' | 'class'>('global');
  const [rankings, setRankings] = useState<UserRank[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [userPosition, setUserPosition] = useState<number>(0);

  useEffect(() => {
    const fetchRankings = async () => {
      const grade = (userProfile as any)?.grade || 1;
      const data = filter === 'class'
        ? await getClassRankings(grade, 50)
        : await getTopRankings(50);
      setRankings(data);

      if (user) {
        const myRank = await getUserRank(user.uid);
        setUserRank(myRank);
        const position = data.findIndex(r => r.uid === user.uid);
        setUserPosition(position >= 0 ? position + 1 : 0);
      }
    };
    fetchRankings();
  }, [user, filter, userProfile]);

  const getRankInfo = (tier: string) => {
    return RANKS[tier as keyof typeof RANKS] || RANKS.bronze;
  };

  const calculateWinRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws;
    if (total === 0) return '0%';
    return Math.round((wins / total) * 100) + '%';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white p-6 pb-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h1 className="text-2xl font-black tracking-tight text-slate-900">BXH Đối Kháng</h1>
          </div>
          <div className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} />
            Mùa 5
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-4">
          {(['global', 'class'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                filter === t
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {t === 'global' ? '🌍 Thế giới' : `📚 Lớp ${(userProfile as any)?.grade || ''}`}
            </button>
          ))}
        </div>

        {/* Top 3 Podium (Mini) - Only show if rankings exist */}
        {rankings.length >= 3 && (
          <div className="flex items-end justify-center gap-4 py-4">
            {/* 2nd */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500">
                  {rankings[1]?.username?.charAt(0) || '?'}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">2</div>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase">{getRankInfo(rankings[1]?.rankTier || 'bronze').name}</span>
            </div>

            {/* 1st */}
            <div className="flex flex-col items-center">
              <Crown className="text-yellow-400 fill-yellow-400 mb-1" size={20} />
              <div className="relative mb-2">
                <div className="w-18 h-18 rounded-3xl bg-yellow-100 flex items-center justify-center text-3xl font-bold text-yellow-600">
                  {rankings[0]?.username?.charAt(0) || '?'}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white text-xs font-bold border-4 border-white">1</div>
              </div>
              <span className="text-[10px] font-black text-yellow-600 uppercase">{getRankInfo(rankings[0]?.rankTier || 'bronze').name}</span>
            </div>

            {/* 3rd */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl font-bold text-amber-600">
                  {rankings[2]?.username?.charAt(0) || '?'}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">3</div>
              </div>
              <span className="text-[10px] font-black text-amber-700 uppercase">{getRankInfo(rankings[2]?.rankTier || 'bronze').name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Rankings List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 no-scrollbar">
        <div className="flex justify-between px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          <span>Hạng / Người chơi</span>
          <div className="flex gap-10">
            <span>Tỉ lệ thắng</span>
            <span>LP</span>
          </div>
        </div>

        {rankings.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Trophy size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-bold">Chưa có dữ liệu xếp hạng</p>
            <p className="text-sm">Hãy tham gia đấu để xuất hiện trên bảng xếp hạng!</p>
          </div>
        ) : (
          rankings.map((player, i) => {
            const isMe = user?.uid === player.uid;
            const rankInfo = getRankInfo(player.rankTier);
            return (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={player.uid}
                className={cn(
                  "p-4 rounded-[2rem] border-2 flex items-center justify-between transition-all",
                  isMe ? "bg-indigo-50 border-indigo-200 shadow-md shadow-indigo-100" : "bg-white border-slate-100"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-6 font-black text-sm text-center",
                    i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-slate-300"
                  )}>
                    {i + 1}
                  </div>
                  <div className="relative">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold", rankInfo.bg, rankInfo.color)}>
                      {player.username?.charAt(0) || '?'}
                    </div>
                    <div className={cn("absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm")}>
                      <ShieldCheck size={14} className={rankInfo.color} />
                    </div>
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-black",
                      isMe ? "text-indigo-900" : "text-slate-900"
                    )}>
                      {player.username} {isMe && '(Bạn)'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn("text-[10px] font-black uppercase tracking-tighter", rankInfo.color)}>
                        {rankInfo.name}
                      </span>
                      {player.streak > 0 && (
                        <span className="text-[10px] font-bold text-orange-500 flex items-center gap-0.5">
                          <Zap size={10} fill="currentColor" />
                          {player.streak} chuỗi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-700">{calculateWinRate(player.wins, player.losses, player.draws)}</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase">Thắng</div>
                  </div>
                  <div className="text-right min-w-[40px]">
                    <div className={cn("text-sm font-black", rankInfo.color)}>{player.lp}</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase">Điểm</div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* My Rank Sticky Footer */}
      {userRank && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center font-bold">
              {userProfile?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase">Hạng của bạn</div>
              <div className="text-sm font-black">#{userPosition || '-'} • {getRankInfo(userRank.rankTier).name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-indigo-400">{userRank.lp} LP</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {userRank.streak > 0 ? `${userRank.streak} chuỗi thắng!` : 'Cố lên!'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
