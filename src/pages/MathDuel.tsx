import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, User, Trophy, X, Timer, Star, Swords, Search, ShieldCheck, Crown, Users, Plus, Key, Play, TrendingUp } from 'lucide-react';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { cn } from '../utils/utils';
import { MultiplayerLeaderboard } from '../features/duel/MultiplayerLeaderboard';
import { useFirebase } from '../context/FirebaseProvider';
import {
  getUserRank,
  getTopRankings,
  getDuelHistory,
  joinDuelQueue,
  leaveDuelQueue,
  subscribeToDuelQueue,
  saveDuelMatch,
  updateUserRank,
  UserRank,
  DuelMatch,
  RANKS,
  updateDuelScore,
  subscribeToDuel,
  createRealDuel,
  completeRealDuel,
  findOpponentForDuel,
  createDuelRoom,
  joinDuelRoom,
  subscribeToRoom,
  startDuel,
  leaveRoom,
  updateRoomProgress
} from '../services/duelService';
import { getRandomQuestions, DuelQuestion } from '../utils/duelQuestions';
import { getUserProfile, getUsersByIds } from '../services/userService';
import { audioService } from '../utils/audio';

type DuelState = 'lobby' | 'searching' | 'playing' | 'result' | 'leaderboard' | 'create_room' | 'join_room' | 'waiting_room' | 'room_playing' | 'room_result';

interface MathDuelProps {
  userRole?: 'student' | 'teacher' | null;
  initialState?: DuelState;
  onDuelStateChange?: (state: DuelState) => void;
  onExitDuel?: () => void;
  exitDuelToken?: number;
}

interface RoomPlayer {
  id: number | string;
  name: string;
  avatar: string;
  isMe: boolean;
  score?: number;
  progress?: number;
}

export const MathDuel: React.FC<MathDuelProps> = ({ userRole, initialState = 'lobby' }) => {
  const { user, userProfile } = useFirebase();
  const [state, setState] = useState<DuelState>(initialState);

  // User rank data from database
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [topRankings, setTopRankings] = useState<UserRank[]>([]);
  const [duelHistory, setDuelHistory] = useState<DuelMatch[]>([]);
  const [userRankPosition, setUserRankPosition] = useState<number>(0);

  // Duel game state
  const [duelQuestions, setDuelQuestions] = useState<DuelQuestion[]>([]);
  const [opponentInfo, setOpponentInfo] = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [availableOpponents, setAvailableOpponents] = useState<{ userId: string; grade?: number }[]>([]);
  const [currentDuelId, setCurrentDuelId] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState(true);

  // Fetch user rank
  useEffect(() => {
    const fetchUserRank = async () => {
      if (!user) return;
      const rank = await getUserRank(user.uid);
      setUserRank(rank);
    };
    fetchUserRank();
  }, [user]);

  // Fetch top rankings
  useEffect(() => {
    const fetchTopRankings = async () => {
      const rankings = await getTopRankings(20);
      setTopRankings(rankings);

      // Find user position
      if (user && rankings.length > 0) {
        const position = rankings.findIndex(r => r.uid === user.uid);
        if (position >= 0) {
          setUserRankPosition(position + 1);
        }
      }
    };
    fetchTopRankings();
  }, [user]);

  // Fetch duel history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      const history = await getDuelHistory(user.uid, 10);
      setDuelHistory(history);
    };
    fetchHistory();
  }, [user]);

  const getUserRankInfo = () => {
    if (!userRank) return RANKS.bronze;
    return RANKS[userRank.rankTier] || RANKS.bronze;
  };

  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [searchProgress, setSearchProgress] = useState(0);

  // Room states (1v1 Firestore)
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [gameMode, setGameMode] = useState<'time' | 'questions'>('time');
  const [timeLimit, setTimeLimit] = useState(60);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [roomResults, setRoomResults] = useState<RoomPlayer[]>([]);
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const handleCreateRoom = async () => {
    if (!user) return;
    setIsCreatingRoom(true);
    try {
      const room = await createDuelRoom(
        user.uid,
        userProfile?.name || user.displayName || 'Người chơi',
        gameMode,
        timeLimit,
        2
      );
      setRoomId(room.id);
      setRoomCode(room.code);
      setIsHost(true);
      setState('waiting_room');
      setRoomPlayers([
        {
          id: user.uid,
          name: userProfile?.name || 'Bạn',
          avatar: userProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          isMe: true
        }
      ]);
      if (userProfile?.avatar) setAvatarMap({ [user.uid]: userProfile.avatar });
    } catch (err) {
      console.error(err);
      alert('Không thể tạo phòng. Thử lại.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user || roomCode.trim().length !== 6) return;
    try {
      const room = await joinDuelRoom(
        roomCode.trim(),
        user.uid,
        userProfile?.name || user.displayName || 'Người chơi'
      );
      if (!room) {
        alert('Không tìm thấy phòng với mã này.');
        return;
      }
      setRoomId(room.id);
      setRoomCode(room.code);
      setIsHost(false);
      setState('waiting_room');
      const list: RoomPlayer[] = room.currentPlayers.map((uid, i) => ({
        id: uid,
        name: room.playerNames[uid] || (uid === user.uid ? 'Bạn' : 'Chủ phòng'),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
        isMe: uid === user.uid
      }));
      setRoomPlayers(list);
    } catch (err) {
      alert('Không thể vào phòng. Thử lại.');
    }
  };

  // Subscribe to room for opponent score during room_playing
  useEffect(() => {
    if (!roomId || state !== 'room_playing' || !user) return;
    const unsub = subscribeToRoom(roomId, (room) => {
      if (!room) return;
      if (room.participantProgress) {
        const other = room.currentPlayers.find((uid) => uid !== user.uid);
        if (other && room.participantProgress![other]) {
          setScore((prev) => ({ ...prev, opponent: room.participantProgress![other].score }));
        }
      }
      getUsersByIds(room.currentPlayers).then((profiles) => {
        const map: Record<string, string> = {};
        profiles.forEach((p) => { if (p.avatar) map[p.uid] = p.avatar; });
        setAvatarMap((prev) => ({ ...prev, ...map }));
      });
    });
    return () => unsub();
  }, [roomId, state, user?.uid]);

  // Subscribe to 1v1 room updates
  useEffect(() => {
    if (!roomId || state !== 'waiting_room') return;
    const unsub = subscribeToRoom(roomId, (room) => {
      if (!room) return;
      const list: RoomPlayer[] = room.currentPlayers.map((uid) => ({
        id: uid,
        name: room.playerNames[uid] || 'Người chơi',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
        isMe: uid === user?.uid
      }));
      setRoomPlayers(list);
      getUsersByIds(room.currentPlayers).then((profiles) => {
        const map: Record<string, string> = {};
        profiles.forEach((p) => { if (p.avatar) map[p.uid] = p.avatar; });
        setAvatarMap((prev) => ({ ...prev, ...map }));
      });
      if (room.status === 'playing') {
        let qList: DuelQuestion[] = [];
        if (room.roomQuestions) {
          try { qList = JSON.parse(room.roomQuestions) as DuelQuestion[]; } catch { }
        }
        if (qList.length > 0) setDuelQuestions(qList);
        setTimeLeft(room.timeLimit);
        setCurrentQuestion(0);
        setScore({ player: 0, opponent: 0 });
        const otherUid = room.currentPlayers.find((uid) => uid !== user?.uid);
        if (otherUid) setOpponentInfo({ id: otherUid, name: room.playerNames[otherUid] || 'Đối thủ' });
        setState('room_playing');
      }
    });
    return () => unsub();
  }, [roomId, state, user?.uid]);




  // Simulate student progress for teacher view
  useEffect(() => {
    if (state === 'room_playing' && userRole === 'teacher') {
      const interval = setInterval(() => {
        setRoomPlayers(prev => prev.map(p => {
          // Randomly increase score/progress
          if (Math.random() > 0.6 && (p.progress || 0) < questions.length) {
            return { ...p, score: (p.score || 0) + 10, progress: (p.progress || 0) + 1 };
          }
          return p;
        }).sort((a, b) => (b.score || 0) - (a.score || 0)));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [state, userRole]);

  // Questions for duel - loaded from data files
  const questions = duelQuestions.length > 0 ? duelQuestions.map(q => ({
    q: q.question,
    a: q.answer,
    options: q.options
  })) : [
    { q: "12 + 15 = ?", a: "27", options: ["25", "27", "29", "31"] },
    { q: "45 - 18 = ?", a: "27", options: ["23", "25", "27", "29"] },
    { q: "8 x 7 = ?", a: "56", options: ["54", "56", "58", "60"] },
    { q: "72 : 9 = ?", a: "8", options: ["7", "8", "9", "10"] },
  ];

  // Real-time Matchmaking Logic
  useEffect(() => {
    if (state !== 'searching' || !user) return;

    let unsubscribeDuel: (() => void) | null = null;
    let unsubscribeQueue: (() => void) | null = null;
    let isMatched = false;

    // 1. Join the queue
    const userGrade = userProfile?.grade || 5;
    joinDuelQueue(user.uid, userGrade);

    // 2. Listen for matches where I am player 2 (someone found me)
    const q = query(
      collection(db, 'activeDuels'),
      where('player2Id', '==', user.uid),
      limit(10) // Small limit, check status locally
    );

    unsubscribeDuel = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty && !isMatched) {
        const waitingDuel = snapshot.docs.find(d => d.data().status === 'playing');
        if (waitingDuel) {
          isMatched = true;
          const duelData = waitingDuel.data();
          const opponentId = duelData.player1Id;
          const opponentName = duelData.player1Name;

          // Player 2: Load questions from the duel document (set by Player 1)
          let loadedQuestions: DuelQuestion[] = [];
          if (duelData.questions) {
            try {
              loadedQuestions = JSON.parse(duelData.questions) as DuelQuestion[];
            } catch { loadedQuestions = await getRandomQuestions(userGrade, 10); }
          } else {
            loadedQuestions = await getRandomQuestions(userGrade, 10);
          }

          getUserProfile(opponentId).then((oppProfile) => {
            setOpponentInfo({ id: opponentId, name: opponentName, avatar: oppProfile?.avatar });
          });
          setDuelQuestions(loadedQuestions);
          setCurrentDuelId(duelData.id);
          setIsPlayer1(false);

          setTimeout(() => {
            setTimeLeft(60);
            setCurrentQuestion(0);
            setScore({ player: 0, opponent: 0 });
            setState('playing');
          }, 500);
        }
      }
    });

    // 3. Periodically look for others in the queue to initiate a match
    const findOpponent = async () => {
      if (isMatched) return;

      const opponent = await findOpponentForDuel(user.uid, userGrade);
      if (opponent && !isMatched) {
        isMatched = true;
        const opponentProfile = await getUserProfile(opponent.opponentId);
        const opponentName = opponentProfile?.name || opponent.opponentName;

        // Player 1: generate questions and store them in Firestore
        const loadedQuestions = await getRandomQuestions(userGrade, 10);

        const duelId = await createRealDuel(
          user.uid,
          userProfile?.name || user.displayName || 'Người chơi',
          opponent.opponentId,
          opponentName,
          'quick',
          loadedQuestions // ← pass questions to save in Firestore
        );

        setOpponentInfo({ id: opponent.opponentId, name: opponentName, avatar: opponentProfile?.avatar });
        setDuelQuestions(loadedQuestions);
        setCurrentDuelId(duelId);
        setIsPlayer1(true);

        setTimeout(() => {
          setTimeLeft(60);
          setCurrentQuestion(0);
          setScore({ player: 0, opponent: 0 });
          setState('playing');
        }, 500);
      }
    };

    const intervalId = setInterval(findOpponent, 3000);

    return () => {
      clearInterval(intervalId);
      leaveDuelQueue(user.uid);
      if (unsubscribeDuel) unsubscribeDuel();
      if (unsubscribeQueue) unsubscribeQueue();
    };
  }, [state, user, userProfile]);

  // Real duel timer and sync
  useEffect(() => {
    if (state !== 'playing' || !currentDuelId) return;

    // 1. Timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleDuelEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. Subscribe to opponent updates
    const unsubscribe = subscribeToDuel(currentDuelId, (duelData) => {
      // Sync opponent score in real-time
      if (isPlayer1) {
        setScore(prev => ({ ...prev, opponent: duelData.player2Score ?? 0 }));
      } else {
        setScore(prev => ({ ...prev, opponent: duelData.player1Score ?? 0 }));
      }

      // Handle if opponent finished first
      if (duelData.status === 'finished' && state === 'playing') {
        handleDuelEnd();
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [state, currentDuelId, isPlayer1]);

  // Handle duel end - save results to database
  const handleDuelEnd = async () => {
    if (state === 'result' || state === 'lobby') return;

    // Immediately set state to result to prevent re-triggering
    setState('result');

    if (!user || !opponentInfo) {
      setState('result');
      return;
    }

    const isWin = score.player > score.opponent;
    const isDraw = score.player === score.opponent;
    const currentLP = userRank?.lp || 0;
    const userName = userProfile?.name || user.displayName || 'Người chơi';

    // Calculate LP change
    let lpChange = 0;
    if (isWin) {
      lpChange = 20;
    } else if (isDraw) {
      lpChange = 5;
    } else {
      lpChange = -15;
    }

    // Save match result
    try {
      if (currentDuelId) {
        await completeRealDuel(currentDuelId);
      }

      await saveDuelMatch(
        currentDuelId || `duel_${Date.now()}`,
        user.uid,
        userName,
        opponentInfo.id,
        opponentInfo.name,
        score.player,
        score.opponent,
        isWin ? user.uid : (isDraw ? undefined : opponentInfo.id),
        isDraw,
        'quick',
        lpChange
      );

      // Update user rank (save grade so class leaderboard works)
      await updateUserRank(user.uid, userName, isWin, isDraw, currentLP, userProfile?.grade, userProfile?.avatar);
    } catch (error) {
      console.error('Error saving duel result:', error);
    }

    setState('result');
  };

  const handleAnswer = async (ans: string) => {
    let newScore = score.player;
    if (ans === questions[currentQuestion].a) {
      newScore += 10;
      setScore(prev => ({ ...prev, player: newScore }));
      audioService.playCorrect(userProfile?.preferences);
    } else {
      audioService.playWrong(userProfile?.preferences);
    }

    // Sync score to Firestore
    if (currentDuelId && user) {
      const correctCount = Math.floor(newScore / 10);
      updateDuelScore(currentDuelId, user.uid, isPlayer1, newScore, currentQuestion + 1, correctCount);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Game finished - save result to database
      handleDuelEnd();
    }
  };

  const handleRoomAnswer = async (ans: string) => {
    const isCorrect = ans === questions[currentQuestion].a;
    if (isCorrect) audioService.playCorrect(userProfile?.preferences);
    else audioService.playWrong(userProfile?.preferences);

    const newScore = score.player + (isCorrect ? 10 : 0);
    const newProgress = currentQuestion + 1;
    const isLast = newProgress >= questions.length;
    setScore((prev) => ({ ...prev, player: newScore }));
    if (roomId && user) {
      updateRoomProgress(roomId, user.uid, newScore, newProgress, isLast).catch(() => { });
    }
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setState('room_result');
    }
  };

  // Room 1v1 timer - countdown and end when time's up
  useEffect(() => {
    if (state !== 'room_playing' || userRole === 'teacher') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (roomId && user) {
            updateRoomProgress(roomId, user.uid, score.player, currentQuestion + 1, true).catch(() => { });
          }
          setState('room_result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state, roomId, user?.uid, userRole, score.player, currentQuestion]);

  // Generate room results
  useEffect(() => {
    if (state === 'room_result') {
      const results = roomPlayers.map((p) => ({
        ...p,
        score: p.isMe ? score.player : (p.score ?? score.opponent ?? 0)
      })).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      setRoomResults(results);
    }
  }, [state, roomPlayers, score.player, score.opponent]);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-x-hidden overflow-y-auto no-scrollbar pb-20">
      <AnimatePresence mode="wait">
        {state === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col p-6 items-center justify-center space-y-8"
          >
            <div className="w-32 h-32 bg-indigo-100 rounded-[3rem] flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100">
              <Swords size={64} strokeWidth={2.5} />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black tracking-tight">Đấu trường Toán học</h1>
              <p className="text-slate-500 font-medium">Thách đấu với các bạn cùng lớp ngay!</p>
            </div>

            {userRole === 'teacher' ? (
              <div className="w-full max-w-sm space-y-4">
                <button
                  onClick={() => setState('create_room')}
                  className="w-full bg-primary text-white p-6 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/30 active:scale-95 transition-transform flex flex-col items-center justify-center gap-2"
                >
                  <Users size={32} />
                  TẠO PHÒNG QUIZ
                </button>
              </div>
            ) : (
              <>
                {/* Rank Display */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={28} className={getUserRankInfo().color} />
                    <span className={cn("text-2xl font-black uppercase tracking-wider", getUserRankInfo().color)}>
                      {getUserRankInfo().name}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-400">{userRank?.lp || 0} Điểm Xếp Hạng (LP)</div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <div className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center space-y-1">
                    <Trophy className="text-yellow-500" size={24} />
                    <span className="text-xs font-black text-slate-400 uppercase">Thắng</span>
                    <span className="text-xl font-black">{userRank?.wins || 0}</span>
                  </div>
                  <button
                    onClick={() => setState('leaderboard')}
                    className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center space-y-1 hover:border-indigo-200 hover:bg-indigo-50 transition-colors active:scale-95"
                  >
                    <Crown className="text-indigo-500" size={24} />
                    <span className="text-xs font-black text-slate-400 uppercase">BXH Hệ thống</span>
                    <span className="text-xl font-black text-indigo-600">Hạng {userRankPosition || '-'}</span>
                  </button>
                </div>

                <div className="w-full max-w-sm space-y-3">
                  <button
                    onClick={() => setState('searching')}
                    className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/30 active:scale-95 transition-transform flex items-center justify-center gap-3"
                  >
                    <Zap fill="white" size={24} />
                    TÌM ĐỐI THỦ NGẪU NHIÊN
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setState('create_room')}
                      className="bg-indigo-100 text-indigo-700 py-4 rounded-[1.5rem] font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      Tạo phòng
                    </button>
                    <button
                      onClick={() => setState('join_room')}
                      className="bg-emerald-100 text-emerald-700 py-4 rounded-[1.5rem] font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                      <Key size={20} />
                      Vào phòng
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {state === 'searching' && (
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
        )}

        {state === 'create_room' && (
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
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Số câu hỏi</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-primary">
                      <option>10 câu</option>
                      <option>20 câu</option>
                      <option>30 câu</option>
                    </select>
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
        )}

        {state === 'join_room' && (
          <motion.div
            key="join_room"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col p-6 items-center justify-center"
          >
            <div className="w-full max-w-sm bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">Vào phòng</h2>
                <button onClick={() => setState('lobby')} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 text-center">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nhập mã phòng</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="VD: A1B2C3"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-center text-slate-800 outline-none focus:border-primary uppercase tracking-widest"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={roomCode.length !== 6}
                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
              >
                VÀO PHÒNG
              </button>
            </div>
          </motion.div>
        )}

        {state === 'waiting_room' && (
          <motion.div
            key="waiting_room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-6 items-center space-y-6"
          >
            <div className="w-full max-w-md bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center space-y-2">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Mã phòng của bạn</h2>
              <div className="text-5xl font-black tracking-widest text-indigo-600 bg-indigo-50 py-4 rounded-2xl border-2 border-dashed border-indigo-200">
                {roomCode}
              </div>
              <p className="text-xs font-bold text-slate-500 mt-2">Chia sẻ mã này cho các bạn để cùng tham gia nhé!</p>
            </div>

            <div className="w-full max-w-md flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="font-black text-slate-800">Người chơi ({roomPlayers.length})</h3>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Đang chờ...
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                {roomPlayers.map((player) => (
                  <div key={String(player.id)} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <img src={avatarMap[String(player.id)] || (player.isMe ? userProfile?.avatar : undefined) || player.avatar} alt={player.name} className="w-10 h-10 rounded-xl object-cover bg-slate-200" referrerPolicy="no-referrer" />
                    <span className={cn("font-bold", player.isMe ? "text-indigo-600" : "text-slate-700")}>
                      {player.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 shrink-0 space-y-3">
                {isHost ? (
                  <button
                    onClick={async () => {
                      if (!roomId || roomPlayers.length < 2) return;
                      const grade = userProfile?.grade || 5;
                      const qList = await getRandomQuestions(grade, 10);
                      await startDuel(roomId, qList);
                    }}
                    disabled={roomPlayers.length < 2}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Play fill="white" size={20} />
                    BẮT ĐẦU NGAY
                  </button>
                ) : (
                  <div className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-sm text-center">
                    Đang chờ chủ phòng bắt đầu...
                  </div>
                )}
                <button
                  onClick={async () => {
                    if (roomId && user) {
                      try { await leaveRoom(roomId, user.uid); } catch (_) { }
                    }
                    setRoomId(null);
                    setState('lobby');
                  }}
                  className="w-full text-slate-400 font-bold text-sm hover:text-slate-600"
                >
                  Rời phòng
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {state === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            {/* Duel Header */}
            <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 overflow-hidden border-2 border-indigo-500 flex items-center justify-center">
                  {userProfile?.avatar ? (
                    <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xl font-black text-indigo-600">{userProfile?.name?.charAt(0) || user?.email?.charAt(0) || 'B'}</span>
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase">Bạn ({getUserRankInfo().name})</div>
                  <div className="text-lg font-black text-indigo-600">{score.player}</div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center border-4 font-black text-xl",
                  timeLeft <= 5 ? "border-red-500 text-red-500 animate-pulse" : "border-slate-100 text-slate-700"
                )}>
                  {timeLeft}
                </div>
                <div className="text-[10px] font-black text-slate-400 mt-1">GIÂY</div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase">{opponentInfo?.name || 'Đối thủ'}</div>
                  <div className="text-lg font-black text-red-600">{score.opponent}</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center border-2 border-red-500 overflow-hidden">
                  {(opponentInfo?.avatar || (opponentInfo?.id && avatarMap[opponentInfo.id])) ? (
                    <img src={opponentInfo?.avatar || avatarMap[opponentInfo!.id]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xl font-bold text-red-600">{opponentInfo?.name?.charAt(0) || 'Đ'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Question Area */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-12">
              <div className="text-center space-y-4">
                <span className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Câu hỏi {currentQuestion + 1} / {questions.length}
                </span>
                <h3 className="text-5xl font-black tracking-tight text-slate-800">
                  {questions[currentQuestion].q}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {questions[currentQuestion].options.map((opt, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(opt)}
                    className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] text-2xl font-black text-slate-700 hover:border-primary hover:text-primary transition-all shadow-sm"
                  >
                    {opt}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {state === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-6 space-y-8"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className={cn(
                  "w-40 h-40 rounded-[3.5rem] flex items-center justify-center shadow-2xl",
                  score.player >= score.opponent ? "bg-yellow-400 text-white" : "bg-slate-200 text-slate-400"
                )}
              >
                {score.player >= score.opponent ? <Trophy size={80} /> : <X size={80} />}
              </motion.div>
              {score.player >= score.opponent && (
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-lg border border-yellow-100"
                >
                  <Crown className="text-yellow-400" size={24} />
                </motion.div>
              )}
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black tracking-tight">
                {score.player > score.opponent ? "CHIẾN THẮNG!" : score.player === score.opponent ? "HÒA NHAU!" : "THẤT BẠI!"}
              </h2>
              <p className="text-slate-500 font-bold">
                {score.player > score.opponent ? "+20 Điểm Xếp Hạng (LP)" : score.player === score.opponent ? "+5 Điểm Xếp Hạng (LP)" : "-15 Điểm Xếp Hạng (LP)"}
              </p>
            </div>

            <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-6 border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {userProfile?.name?.charAt(0) || user?.email?.charAt(0) || 'B'}
                  </div>
                  <span className="font-bold">{userProfile?.name || 'Bạn'}</span>
                </div>
                <span className="text-2xl font-black text-indigo-600">{score.player}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold">
                    {opponentInfo?.name?.charAt(0) || 'Đ'}
                  </div>
                  <span className="font-bold">{opponentInfo?.name || 'Đối thủ'}</span>
                </div>
                <span className="text-2xl font-black text-red-600">{score.opponent}</span>
              </div>
            </div>

            <button
              onClick={() => setState('lobby')}
              className="w-full max-w-sm bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-transform"
            >
              QUAY LẠI
            </button>
          </motion.div>
        )}
        {state === 'room_playing' && (
          <motion.div
            key="room_playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            {userRole === 'teacher' ? (
              <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
                {/* Teacher Header */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between shrink-0">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã phòng</div>
                    <div className="text-2xl font-black text-indigo-600 tracking-widest">{roomCode}</div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center border-4 font-black text-2xl",
                      (gameMode === 'time' && timeLeft <= 5) ? "border-red-500 text-red-500 animate-pulse" : "border-slate-100 text-slate-700"
                    )}>
                      {timeLeft}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 mt-1">
                      {gameMode === 'time' ? 'CÒN LẠI' : 'ĐÃ QUA'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sĩ số</div>
                    <div className="text-2xl font-black text-emerald-600">{roomPlayers.length} HS</div>
                  </div>
                </div>

                {/* Live Leaderboard */}
                <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col overflow-hidden">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 shrink-0">Bảng xếp hạng trực tiếp</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-2">
                    {roomPlayers.sort((a, b) => (b.score || 0) - (a.score || 0)).map((player, index) => (
                      <motion.div
                        layout
                        key={player.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm",
                          index === 0 ? "bg-yellow-100 text-yellow-600" :
                            index === 1 ? "bg-slate-200 text-slate-600" :
                              index === 2 ? "bg-amber-100 text-amber-700" : "bg-white text-slate-400 border border-slate-200"
                        )}>
                          {index + 1}
                        </div>
                        <img src={player.avatar} className="w-10 h-10 rounded-xl object-cover" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 text-sm">{player.name}</span>
                            <span className="font-black text-indigo-600 text-sm">{player.score || 0} điểm</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-indigo-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${((player.progress || 0) / questions.length) * 100}%` }}
                              transition={{ type: "spring", stiffness: 50 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Finish Button */}
                <button
                  onClick={() => setState('room_result')}
                  className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-rose-200 active:scale-95 transition-transform shrink-0"
                >
                  KẾT THÚC
                </button>
              </div>
            ) : (
              <>
                {/* Room Duel Header */}
                <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 overflow-hidden border-2 border-indigo-500">
                      {userProfile?.avatar ? (
                        <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-xl font-black text-indigo-600">{userProfile?.name?.charAt(0) || 'B'}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase">Điểm của bạn</div>
                      <div className="text-lg font-black text-indigo-600">{score.player}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center border-4 font-black text-xl",
                      (gameMode === 'time' && timeLeft <= 5) ? "border-red-500 text-red-500 animate-pulse" : "border-slate-100 text-slate-700"
                    )}>
                      {timeLeft}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 mt-1">
                      {gameMode === 'time' ? 'CÒN LẠI' : 'ĐÃ QUA'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase">Xếp hạng</div>
                      <div className="text-lg font-black text-emerald-600">#1 / {roomPlayers.length}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center border-2 border-emerald-500 text-emerald-600">
                      <Trophy size={24} />
                    </div>
                  </div>
                </div>

                {/* Question Area */}
                <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-12">
                  <div className="text-center space-y-4">
                    <span className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Câu hỏi {currentQuestion + 1} / {questions.length}
                    </span>
                    <h3 className="text-5xl font-black tracking-tight text-slate-800">
                      {questions[currentQuestion].q}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    {questions[currentQuestion].options.map((opt, i) => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRoomAnswer(opt)}
                        className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] text-2xl font-black text-slate-700 hover:border-primary hover:text-primary transition-all shadow-sm"
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {state === 'room_result' && (
          <motion.div
            key="room_result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center p-6 space-y-8 overflow-y-auto no-scrollbar"
          >
            <div className="text-center space-y-2 mt-4">
              <h2 className="text-3xl font-black tracking-tight text-slate-800">
                KẾT QUẢ TRẬN ĐẤU
              </h2>
              <p className="text-slate-500 font-bold">
                Phòng: {roomCode}
              </p>
            </div>

            {/* Podium for Top 3 */}
            <div className="flex items-end justify-center gap-2 sm:gap-4 h-48 mt-8 mb-4">
              {/* Top 2 */}
              {roomResults[1] && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-2">
                    <img src={avatarMap[String(roomResults[1].id)] || (roomResults[1].isMe ? userProfile?.avatar : undefined) || roomResults[1].avatar} alt="" className="w-14 h-14 rounded-full border-4 border-slate-300 object-cover bg-slate-200" referrerPolicy="no-referrer" />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-white">2</div>
                  </div>
                  <div className="w-20 h-24 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-2xl flex flex-col items-center justify-start pt-4 border-x border-t border-slate-300/50 shadow-inner">
                    <span className="font-black text-slate-500">{roomResults[1].score}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 mt-2 truncate w-20 text-center">{roomResults[1].name}</span>
                </motion.div>
              )}

              {/* Top 1 */}
              {roomResults[0] && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center z-10"
                >
                  <div className="relative mb-2">
                    <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500" size={28} />
                    <img src={avatarMap[String(roomResults[0].id)] || (roomResults[0].isMe ? userProfile?.avatar : undefined) || roomResults[0].avatar} alt="" className="w-16 h-16 rounded-full border-4 border-yellow-400 object-cover bg-slate-200" referrerPolicy="no-referrer" />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-white">1</div>
                  </div>
                  <div className="w-24 h-32 bg-gradient-to-t from-yellow-200 to-yellow-100 rounded-t-2xl flex flex-col items-center justify-start pt-4 border-x border-t border-yellow-300/50 shadow-inner">
                    <span className="font-black text-yellow-700">{roomResults[0].score}</span>
                  </div>
                  <span className="text-xs font-black text-yellow-600 mt-2 truncate w-24 text-center">{roomResults[0].name}</span>
                </motion.div>
              )}

              {/* Top 3 */}
              {roomResults[2] && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-2">
                    <img src={avatarMap[String(roomResults[2].id)] || (roomResults[2].isMe ? userProfile?.avatar : undefined) || roomResults[2].avatar} alt="" className="w-14 h-14 rounded-full border-4 border-amber-600 object-cover bg-slate-200" referrerPolicy="no-referrer" />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-white">3</div>
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-t from-amber-200/50 to-amber-100/50 rounded-t-2xl flex flex-col items-center justify-start pt-4 border-x border-t border-amber-300/50 shadow-inner">
                    <span className="font-black text-amber-700">{roomResults[2].score}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 mt-2 truncate w-20 text-center">{roomResults[2].name}</span>
                </motion.div>
              )}
            </div>

            {/* Other players list */}
            <div className="w-full max-w-md space-y-2">
              {roomResults.slice(3).map((player, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  key={player.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border",
                    player.isMe ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-400 w-4 text-center">{index + 4}</span>
                    <img src={avatarMap[String(player.id)] || (player.isMe ? userProfile?.avatar : undefined) || player.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-200" referrerPolicy="no-referrer" />
                    <span className={cn("font-bold", player.isMe ? "text-indigo-700" : "text-slate-700")}>
                      {player.name}
                    </span>
                  </div>
                  <span className={cn("font-black", player.isMe ? "text-indigo-600" : "text-slate-500")}>
                    {player.score}
                  </span>
                </motion.div>
              ))}
            </div>

            <button
              onClick={async () => {
                if (roomId && user) {
                  try { await leaveRoom(roomId, user.uid); } catch (_) { }
                }
                setRoomId(null);
                setState('lobby');
              }}
              className="w-full max-w-md bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-transform mt-4"
            >
              QUAY LẠI SẢNH
            </button>
          </motion.div>
        )}
        {state === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col h-full"
          >
            <MultiplayerLeaderboard onBack={() => setState('lobby')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

