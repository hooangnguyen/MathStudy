import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useFirebase } from '../../context/FirebaseProvider';
import { getUserRank, getTopRankings, getDuelHistory, joinDuelQueue, leaveDuelQueue, UserRank, DuelMatch, RANKS, updateDuelScore, subscribeToDuel, createRealDuel, finishQuickDuel, markDuelPlayerFinished, findOpponentForDuel, createDuelRoom, joinDuelRoom, subscribeToRoom, updateRoomProgress, getDuelRoom, getActiveDuel, DuelRoom } from '../../services/duelService';
import { saveActiveSession, loadActiveSession, clearActiveSession } from '../../utils/activeSession';
import { resumeRoom, resumeQuickDuel } from '../../../shared/resume';
import { getRandomQuestions, DuelQuestion } from '../../utils/duelQuestions';
import { getUserProfile, getUsersByIds } from '../../services/userService';
import { audioService } from '../../utils/audio';
import type { DuelState, MathDuelProps, RoomPlayer } from './types';

/**
 * Toàn bộ state, hiệu ứng và xử lý của màn Đối kháng.
 * Các view trong ./views chỉ hiển thị dựa trên giá trị trả về của hook này.
 */
export const useMathDuel = ({ userRole, initialState = 'lobby', onDuelStateChange, onExitDuel, exitDuelToken = 0, onNavigate }: MathDuelProps) => {
  const { user, userProfile } = useFirebase();
  const [state, setState] = useState<DuelState>(initialState);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [matchOutcome, setMatchOutcome] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [opponentSurrendered, setOpponentSurrendered] = useState(false);
  const [lpDelta, setLpDelta] = useState<number | null>(null);
  const correctCountRef = React.useRef(0);

  // Common Refs to prevent stale closure bugs
  const stateRef = React.useRef({ state, score, currentQuestion });
  useEffect(() => {
    stateRef.current = { state, score, currentQuestion };
  }, [state, score, currentQuestion]);

  // Notify parent of state changes
  useEffect(() => {
    onDuelStateChange?.(state);
  }, [state, onDuelStateChange]);

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

  const [searchProgress, setSearchProgress] = useState(0);

  // Room states (1v1 Firestore)
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [gameMode, setGameMode] = useState<'time' | 'questions'>('time');
  const [timeLimit, setTimeLimit] = useState(300);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [roomResults, setRoomResults] = useState<RoomPlayer[]>([]);
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Refs for stable timer access
  const playerStateRef = React.useRef({ score: 0, currentQuestion: 0 });
  useEffect(() => {
    playerStateRef.current = { score: score.player, currentQuestion };
  }, [score.player, currentQuestion]);

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
      saveActiveSession(user.uid, 'duel-room', room.id);
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
      // Có thể là vào lại phòng mình đang chơi dở (vd. sau khi tải lại trang)
      applyRoom(room);
    } catch (err: any) {
      alert(err?.message || 'Không thể vào phòng. Thử lại.');
    }
  };

  // ---------- Khôi phục khi bị văng khỏi phòng/trận ----------
  // (tải lại trang, app bị tắt ngầm, chuyển sang tab khác rồi quay lại)

  const buildRoomPlayers = (room: DuelRoom): RoomPlayer[] =>
    room.currentPlayers.map((uid) => ({
      id: uid,
      name: room.playerNames[uid] || 'Người chơi',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
      isMe: uid === user?.uid
    }));

  /** Đưa giao diện về đúng trạng thái hiện tại của phòng. */
  const applyRoom = (room: DuelRoom) => {
    if (!user) return;
    const resume = resumeRoom(room, user.uid, Date.now());
    if (resume.kind === 'gone') {
      clearActiveSession(user.uid, 'duel-room');
      return;
    }

    setRoomId(room.id);
    setRoomCode(room.code);
    setIsHost(room.hostId === user.uid);
    setGameMode(room.gameMode);
    setTimeLimit(room.timeLimit);
    setRoomPlayers(buildRoomPlayers(room));
    saveActiveSession(user.uid, 'duel-room', room.id);

    const otherUid = room.currentPlayers.find((uid) => uid !== user.uid);
    if (otherUid) setOpponentInfo({ id: otherUid, name: room.playerNames[otherUid] || 'Đối thủ' });
    const opponentScore = otherUid ? room.participantProgress?.[otherUid]?.score ?? 0 : 0;

    if (resume.kind === 'waiting') {
      setState('waiting_room');
      return;
    }
    setMatchOutcome(null);
    setOpponentSurrendered(false);
    if (resume.kind === 'finished') {
      setScore({ player: resume.score, opponent: opponentScore });
      setState('room_result');
      return;
    }

    let qList: DuelQuestion[] = [];
    try { qList = room.roomQuestions ? JSON.parse(room.roomQuestions) : []; } catch { }
    if (qList.length > 0) setDuelQuestions(qList);
    setCurrentQuestion(Math.min(resume.currentQuestion, Math.max(0, qList.length - 1)));
    setScore({ player: resume.score, opponent: opponentScore });
    setTimeLeft(resume.timeLeft);
    setState('room_playing');
  };

  /** Quay lại trận đấu nhanh đang diễn ra với đúng điểm, câu hỏi và thời gian còn lại. */
  const applyQuickDuel = (duel: any) => {
    if (!user) return;
    const resume = resumeQuickDuel(duel, user.uid, Date.now());
    if (resume.kind === 'gone') {
      clearActiveSession(user.uid, 'quick-duel');
      return;
    }

    let qList: DuelQuestion[] = [];
    try { qList = duel.questions ? JSON.parse(duel.questions) : []; } catch { }
    const opponentName = (resume.isPlayer1 ? duel.player2Name : duel.player1Name) || 'Đối thủ';

    setDuelQuestions(qList);
    setCurrentDuelId(duel.id);
    setIsPlayer1(resume.isPlayer1);
    setOpponentInfo({ id: resume.opponentId, name: opponentName });
    getUserProfile(resume.opponentId).then((p) => {
      if (p?.avatar) setOpponentInfo({ id: resume.opponentId, name: opponentName, avatar: p.avatar });
    }).catch(() => { });
    setScore({ player: resume.score, opponent: resume.opponentScore });
    correctCountRef.current = resume.correct;
    setCurrentQuestion(Math.min(resume.progress, Math.max(0, qList.length - 1)));
    setIsWaitingForOpponent(resume.finishedAll || resume.progress >= qList.length);
    setTimeLeft(resume.timeLeft);
    setMatchOutcome(null);
    setLpDelta(null);
    setOpponentSurrendered(false);
    setState('playing');
  };

  const [resumeChecked, setResumeChecked] = useState(false);
  useEffect(() => {
    if (!user || resumeChecked) return;
    let cancelled = false;
    (async () => {
      try {
        const roomSession = loadActiveSession(user.uid, 'duel-room');
        const duelSession = loadActiveSession(user.uid, 'quick-duel');
        if (roomSession) {
          const room = await getDuelRoom(roomSession.id);
          if (cancelled) return;
          if (room) applyRoom(room);
          else clearActiveSession(user.uid, 'duel-room');
        } else if (duelSession) {
          const duel = await getActiveDuel(duelSession.id);
          if (!cancelled) applyQuickDuel(duel);
        }
      } catch (error) {
        console.error('Error resuming duel:', error);
      } finally {
        if (!cancelled) setResumeChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  // Ghi nhớ / xoá phiên theo trạng thái (chỉ sau khi đã thử khôi phục, để không xoá mất phiên cũ)
  useEffect(() => {
    if (!user || !resumeChecked) return;
    if (state === 'playing' && currentDuelId) {
      saveActiveSession(user.uid, 'quick-duel', currentDuelId);
    } else if (state === 'result') {
      clearActiveSession(user.uid, 'quick-duel');
    } else if (['lobby', 'searching', 'create_room', 'join_room', 'leaderboard'].includes(state)) {
      // Chỉ xoá phiên của màn Đối kháng, không đụng tới phiên phòng Quiz lớp
      clearActiveSession(user.uid, 'duel-room');
      clearActiveSession(user.uid, 'quick-duel');
    }
  }, [state, currentDuelId, user?.uid, resumeChecked]);

  /** Chủ phòng đã đóng phòng (xoá phòng) trong lúc mình đang ở trong đó. */
  const handleRoomClosed = () => {
    if (!isHost) alert('Chủ phòng đã rời đi, phòng đã đóng.');
    setRoomId(null);
    setState('lobby');
  };

  // Theo dõi điểm đối thủ khi đang chơi và ở màn kết quả (đối thủ có thể chưa làm xong)
  useEffect(() => {
    if (!roomId || (state !== 'room_playing' && state !== 'room_result') || !user) return;
    const unsub = subscribeToRoom(roomId, (room) => {
      if (!room) {
        handleRoomClosed();
        return;
      }
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
  }, [roomId, state, user?.uid, isHost]);

  // Subscribe to 1v1 room updates
  useEffect(() => {
    if (!roomId || state !== 'waiting_room') return;
    const unsub = subscribeToRoom(roomId, (room) => {
      if (!room) {
        handleRoomClosed();
        return;
      }
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
        const myProgress = room.participantProgress?.[user?.uid || ''];
        if (myProgress?.finished) return;

        let qList: DuelQuestion[] = [];
        if (room.roomQuestions) {
          try { qList = JSON.parse(room.roomQuestions) as DuelQuestion[]; } catch { }
        }
        if (qList.length > 0) setDuelQuestions(qList);
        setTimeLeft(room.timeLimit);
        setCurrentQuestion(0);
        setScore({ player: 0, opponent: 0 });
        correctCountRef.current = 0;
        setMatchOutcome(null);
        setOpponentSurrendered(false);
        const otherUid = room.currentPlayers.find((uid) => uid !== user?.uid);
        if (otherUid) setOpponentInfo({ id: otherUid, name: room.playerNames[otherUid] || 'Đối thủ' });
        setState('room_playing');
      }
    });
    return () => unsub();
  }, [roomId, state, user?.uid, isHost]);




  // Questions for duel - loaded from data files
  const questions = duelQuestions.length > 0 ? duelQuestions.map(q => ({
    q: q.text || q.question || '',
    options: q.options || [],
    correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : q.options.indexOf(q.answer || '')
  })) : [
    { q: "12 + 15 = ?", correctAnswer: 1, options: ["25", "27", "29", "31"] },
    { q: "45 - 18 = ?", correctAnswer: 2, options: ["23", "25", "27", "29"] },
    { q: "8 x 7 = ?", correctAnswer: 1, options: ["54", "56", "58", "60"] },
    { q: "72 : 9 = ?", correctAnswer: 1, options: ["7", "8", "9", "10"] },
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
      where('player2Id', '==', user.uid)
    );

    unsubscribeDuel = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty && !isMatched) {
        const now = Date.now();
        const waitingDuel = snapshot.docs
          .sort((a, b) => {
            const timeA = a.data().createdAt?.toMillis?.() || 0;
            const timeB = b.data().createdAt?.toMillis?.() || 0;
            return timeB - timeA;
          })
          .find(d => {
            const data = d.data();
            const createdAt = data.createdAt?.toMillis?.() || now;
            return data.status === 'playing' && (now - createdAt < 120000); // Only matches created in the last 2 minutes
          });

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
            } catch { loadedQuestions = await getRandomQuestions(userGrade, 100); }
          } else {
            loadedQuestions = await getRandomQuestions(userGrade, 100);
          }

          getUserProfile(opponentId).then((oppProfile) => {
            setOpponentInfo({ id: opponentId, name: opponentName, avatar: oppProfile?.avatar });
          });
          setDuelQuestions(loadedQuestions);
          setCurrentDuelId(duelData.id);
          setIsPlayer1(false);

          setTimeout(() => {
            setTimeLeft(300);
            setCurrentQuestion(0);
            setScore({ player: 0, opponent: 0 });
        correctCountRef.current = 0;
            setMatchOutcome(null);
            setOpponentSurrendered(false);
            setIsWaitingForOpponent(false);
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
        const loadedQuestions = await getRandomQuestions(userGrade, 100);

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
          setTimeLeft(300);
          setCurrentQuestion(0);
          setScore({ player: 0, opponent: 0 });
        correctCountRef.current = 0;
          setMatchOutcome(null);
          setOpponentSurrendered(false);
          setIsWaitingForOpponent(false);
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

      // End game if both players finished
      if (duelData.player1TimeLeftAtFinish !== null && duelData.player2TimeLeftAtFinish !== null) {
        handleDuelEnd(isPlayer1 ? duelData.player2Score : duelData.player1Score);
      } else if (duelData.surrenderedBy && duelData.surrenderedBy !== user?.uid && state === 'playing') {
        // Opponent surrendered, force win
        handleDuelEnd(isPlayer1 ? duelData.player2Score : duelData.player1Score, true);
      } else if (duelData.status === 'finished' && state === 'playing') {
        // Fallback: if somehow finished
        handleDuelEnd(isPlayer1 ? duelData.player2Score : duelData.player1Score);
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [state, currentDuelId, isPlayer1, user?.uid]);

  // Handle duel end - server tính kết quả và LP chính thức
  const handleDuelEnd = async (finalOpponentScore?: number, forceIsWin?: boolean, surrender = false) => {
    const currentScore = stateRef.current.score;
    const currentState = stateRef.current.state;

    if (currentState === 'result' || currentState === 'lobby') return;

    // Cập nhật ref ngay lập tức: timer và các snapshot có thể cùng gọi hàm này
    // trước khi React render lại.
    stateRef.current = { ...stateRef.current, state: 'result' };
    setState('result');

    if (!user || !opponentInfo) return;

    // Kết quả tạm thời để hiển thị ngay, sẽ được thay bằng kết quả từ server
    const finalOppScore = finalOpponentScore ?? currentScore.opponent;
    const isWin = forceIsWin !== undefined ? forceIsWin : currentScore.player > finalOppScore;
    const isDraw = forceIsWin !== undefined ? false : currentScore.player === finalOppScore;
    setMatchOutcome(isWin ? 'win' : isDraw ? 'draw' : 'lose');
    setLpDelta(null);
    if (forceIsWin === true) setOpponentSurrendered(true);

    if (!currentDuelId) return;
    try {
      const result = await finishQuickDuel(currentDuelId, surrender);
      setMatchOutcome(result.outcome);
      setLpDelta(result.lpChange);
      setScore({ player: result.myScore, opponent: result.opponentScore });
      getUserRank(user.uid).then(setUserRank).catch(() => { });
    } catch (error) {
      console.error('Error saving duel result:', error);
    }
  };

  const handleAnswer = async (ans: string, optIndex: number = -1) => {
    let newScore = score.player;
    const currentQ = questions[currentQuestion];
    // Compare index if array, else compare string just in case
    const isCorrect = (optIndex !== -1 && optIndex === currentQ.correctAnswer) || 
                      (ans && currentQ.options[currentQ.correctAnswer] === ans);
    
    if (isCorrect) {
      correctCountRef.current += 1;
      newScore += 10;
      setScore(prev => ({ ...prev, player: newScore }));
      audioService.playCorrect(userProfile?.preferences);
    } else {
      newScore = Math.max(0, newScore - 5);
      setScore(prev => ({ ...prev, player: newScore }));
      audioService.playWrong(userProfile?.preferences);
    }

    // Sync score to Firestore
    if (currentDuelId && user) {
      // Đếm trực tiếp số câu đúng (không suy ra từ điểm vì câu sai bị trừ 5 điểm)
      updateDuelScore(currentDuelId, user.uid, isPlayer1, newScore, currentQuestion + 1, correctCountRef.current);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Finished all questions - Wait for opponent or time out
      setIsWaitingForOpponent(true);
      if (currentDuelId && user) {
        markDuelPlayerFinished(currentDuelId, isPlayer1, timeLeft).catch(() => { });
      }
    }
  };

  const handleRoomAnswer = async (ans: string, optIndex: number = -1) => {
    const currentQ = questions[currentQuestion];
    const isCorrect = (optIndex !== -1 && optIndex === currentQ.correctAnswer) || 
                      (ans && currentQ.options[currentQ.correctAnswer] === ans);
    
    if (isCorrect) audioService.playCorrect(userProfile?.preferences);
    else audioService.playWrong(userProfile?.preferences);

    const newScore = Math.max(0, score.player + (isCorrect ? 10 : -5));
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
            const { score: currentScore, currentQuestion: progress } = playerStateRef.current;
            updateRoomProgress(roomId, user.uid, currentScore, progress + 1, true).catch(() => { });
          }
          setState('room_result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state, roomId, user?.uid, userRole]);

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

  // Handle explicit surrender/exit from Navigation
  // Handle explicit surrender/exit from Navigation
  useEffect(() => {
    if (exitDuelToken > 0) {
      const { state: currentState, score: currentScore, currentQuestion: progress } = stateRef.current;
      if (currentState === 'playing') {
        // Đầu hàng: luôn tính thua; server ghi nhận surrenderedBy và tính LP
        handleDuelEnd(currentScore.opponent, false, true);
      } else if (currentState === 'room_playing') {
        if (roomId && user) {
          updateRoomProgress(roomId, user.uid, currentScore.player, progress + 1, true).catch(() => { });
        }
        setState('room_result');
      }
    }
  }, [exitDuelToken, roomId, user]);

  return {
    userRole,
    initialState,
    onDuelStateChange,
    onExitDuel,
    exitDuelToken,
    onNavigate,
    user,
    userProfile,
    state,
    setState,
    isWaitingForOpponent,
    setIsWaitingForOpponent,
    timeLeft,
    setTimeLeft,
    score,
    setScore,
    currentQuestion,
    setCurrentQuestion,
    matchOutcome,
    setMatchOutcome,
    opponentSurrendered,
    setOpponentSurrendered,
    lpDelta,
    setLpDelta,
    correctCountRef,
    stateRef,
    userRank,
    setUserRank,
    topRankings,
    setTopRankings,
    duelHistory,
    setDuelHistory,
    userRankPosition,
    setUserRankPosition,
    duelQuestions,
    setDuelQuestions,
    opponentInfo,
    setOpponentInfo,
    availableOpponents,
    setAvailableOpponents,
    currentDuelId,
    setCurrentDuelId,
    isPlayer1,
    setIsPlayer1,
    getUserRankInfo,
    searchProgress,
    setSearchProgress,
    roomId,
    setRoomId,
    roomCode,
    setRoomCode,
    isHost,
    setIsHost,
    gameMode,
    setGameMode,
    timeLimit,
    setTimeLimit,
    roomPlayers,
    setRoomPlayers,
    roomResults,
    setRoomResults,
    avatarMap,
    setAvatarMap,
    isCreatingRoom,
    setIsCreatingRoom,
    playerStateRef,
    handleCreateRoom,
    handleJoinRoom,
    questions,
    handleDuelEnd,
    handleAnswer,
    handleRoomAnswer,
  };
};

export type MathDuelController = ReturnType<typeof useMathDuel>;
