/**
 * Quiz lớp học - module riêng biệt với Đối kháng (MathDuel)
 * Giáo viên: tạo phòng từ bản nháp, xem tiến độ & bảng xếp hạng realtime
 * Học sinh: vào phòng bằng mã, làm bài, xem kết quả
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, X, Key, Play, Crown, Trophy, Clock, Clipboard, Check,
  GraduationCap, FileText, ChevronLeft, Square, CheckSquare
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseProvider';
import { cn } from '../utils/utils';
import {
  createQuizRoom,
  joinQuizRoom,
  subscribeToQuizRoom,
  startQuiz,
  updateQuizProgress,
  leaveQuizRoom,
  getQuizQuestionsFromRoom,
  type QuizQuestion,
  type QuizRoomData
} from '../services/quizService';
import {
  subscribeToDraftAssignments,
  validateDraftForAutoGrading,
  type DraftAssignmentData
} from '../services/assignmentService';
import { getUsersByIds } from '../services/userService';
import { audioService } from '../utils/audio';

type QuizState =
  | 'lobby'
  | 'create'
  | 'join'
  | 'waiting_room'
  | 'playing'
  | 'result';

interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  isMe: boolean;
  score?: number;
  progress?: number;
}

export const ClassQuiz: React.FC<{ userRole: 'student' | 'teacher' | null }> = ({ userRole }) => {
  const { user, userProfile } = useFirebase();
  const [state, setState] = useState<QuizState>('lobby');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [roomResults, setRoomResults] = useState<RoomPlayer[]>([]);
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timeLimit, setTimeLimit] = useState(60);
  const [isHost, setIsHost] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Teacher create flow
  const [drafts, setDrafts] = useState<DraftAssignmentData[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');
  const [createTimeLimit, setCreateTimeLimit] = useState(60);
  const [isCreating, setIsCreating] = useState(false);
  const [checkboxSelections, setCheckboxSelections] = useState<number[]>([]);

  useEffect(() => {
    if (userRole !== 'teacher' || !user?.uid) return;
    const unsub = subscribeToDraftAssignments(user.uid, (list) => setDrafts(list));
    return () => unsub();
  }, [userRole, user?.uid]);

  // Subscribe to room updates
  useEffect(() => {
    if (!roomId) return;

    const unsub = subscribeToQuizRoom(roomId, (room) => {
      if (!room) {
        setRoomPlayers([]);
        return;
      }

      const r = room as QuizRoomData;
      const qList = getQuizQuestionsFromRoom(r);
      if (qList.length > 0 && questions.length === 0) {
        setQuestions(qList);
      }

      setTimeLimit(r.timeLimit);
      if (r.status === 'playing' && state === 'waiting_room') {
        setTimeLeft(r.timeLimit);
        setCurrentQuestion(0);
        setScore(0);
        setState('playing');
      }

      // Build player list (exclude host/teacher)
      const list: RoomPlayer[] = r.currentPlayers
        .filter((uid) => uid !== r.hostId)
        .map((uid, i) => ({
          id: uid,
          name: r.playerNames[uid] || `Học sinh ${i + 1}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
          isMe: uid === user?.uid,
          score: r.participantProgress?.[uid]?.score ?? 0,
          progress: r.participantProgress?.[uid]?.progress ?? 0
        }));
      setRoomPlayers(list);
      // Fetch avatars for players
      if (list.length > 0) {
        getUsersByIds(list.map((p) => p.id)).then((profiles) => {
          const map: Record<string, string> = {};
          profiles.forEach((p) => {
            if (p.avatar) map[p.uid] = p.avatar;
          });
          setAvatarMap((prev) => ({ ...prev, ...map }));
        });
      }
    });

    return () => unsub();
  }, [roomId, user?.uid, state]);

  // Timer for playing
  useEffect(() => {
    if (state !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up
          if (userRole === 'student' && user) {
            updateQuizProgress(roomId!, user.uid, score, currentQuestion + 1, true).catch(() => { });
          }
          setState('result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state, roomId, user?.uid, userRole, score, currentQuestion]);

  // Generate results when entering result state
  useEffect(() => {
    if (state === 'result') {
      const sorted = [...roomPlayers].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      setRoomResults(sorted);
    }
  }, [state, roomPlayers]);

  const handleCreateRoom = async () => {
    if (!user || userRole !== 'teacher') return;
    const draft = drafts.find((d) => d.id === selectedDraftId);
    if (!draft) {
      alert('Vui lòng chọn một đề thi (bản nháp).');
      return;
    }

    const issues = validateDraftForAutoGrading(draft);
    if (issues.length > 0) {
      alert(
        'Một số câu hỏi chưa có đáp án đúng:\n\n' +
        issues.join('\n') +
        '\n\nVui lòng chỉnh lại bản nháp.'
      );
      return;
    }

    setIsCreating(true);
    try {
      const room = await createQuizRoom(
        user.uid,
        userProfile?.name || user.displayName || 'Giáo viên',
        draft,
        createTimeLimit,
        userProfile?.grade || 5
      );
      setRoomId(room.id);
      setRoomCode(room.code);
      setTimeLimit(room.timeLimit);
      setTimeLeft(room.timeLimit);
      setIsHost(true);
      setState('waiting_room');
      setRoomPlayers([]);
      setQuestions(getQuizQuestionsFromRoom(room as QuizRoomData));
    } catch (err: any) {
      alert(err?.message || 'Không thể tạo phòng quiz.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user || roomCode.trim().length !== 6) return;

    try {
      const room = await joinQuizRoom(
        roomCode.trim(),
        user.uid,
        userProfile?.name || user.displayName || 'Học sinh'
      );
      if (!room) {
        alert('Không tìm thấy phòng với mã này. Hãy kiểm tra lại.');
        return;
      }
      setRoomId(room.id);
      setRoomCode(room.code);
      setIsHost(false);
      setState('waiting_room');
      setAvatarMap(userProfile?.avatar ? { [user.uid]: userProfile.avatar } : {});
      setRoomPlayers([
        {
          id: user.uid,
          name: userProfile?.name || 'Bạn',
          avatar: userProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          isMe: true
        }
      ]);
    } catch (err: any) {
      alert(err?.message || 'Không thể vào phòng.');
    }
  };

  const handleStartQuiz = () => {
    if (!roomId || !isHost) return;
    startQuiz(roomId);
    setState('playing');
  };

  const handleAnswer = (opt: string) => {
    if (state !== 'playing' || !user || !roomId || questions.length === 0) return;

    const q = questions[currentQuestion];
    const isCorrect = opt.trim() === q.answer.trim();
    if (isCorrect) audioService.playCorrect(userProfile?.preferences);
    else audioService.playWrong(userProfile?.preferences);

    const newScore = score + (isCorrect ? 10 : 0);
    const newProgress = currentQuestion + 1;
    const isLast = newProgress >= questions.length;

    setScore(newScore);
    setCurrentQuestion(newProgress);
    setCheckboxSelections([]);

    updateQuizProgress(roomId, user.uid, newScore, newProgress, isLast).catch(() => { });

    if (isLast) {
      setState('result');
    }
  };

  const handleCheckboxToggle = (index: number) => {
    setCheckboxSelections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b)
    );
  };

  const handleCheckboxConfirm = () => {
    if (state !== 'playing' || !user || !roomId || questions.length === 0) return;

    const q = questions[currentQuestion];
    const correct = q.correctIndices ?? [];
    const selected = [...checkboxSelections].sort((a, b) => a - b);
    const isCorrect =
      selected.length === correct.length && selected.every((v, i) => v === correct[i]);

    if (isCorrect) audioService.playCorrect(userProfile?.preferences);
    else audioService.playWrong(userProfile?.preferences);

    const newScore = score + (isCorrect ? 10 : 0);
    const newProgress = currentQuestion + 1;
    const isLast = newProgress >= questions.length;

    setScore(newScore);
    setCurrentQuestion(newProgress);
    setCheckboxSelections([]);

    updateQuizProgress(roomId, user.uid, newScore, newProgress, isLast).catch(() => { });

    if (isLast) {
      setState('result');
    }
  };

  const handleLeaveRoom = async () => {
    if (roomId && user) {
      try {
        await leaveQuizRoom(roomId, user.uid);
      } catch (_) { }
    }
    setState('lobby');
    setRoomId(null);
    setRoomCode('');
    setRoomPlayers([]);
    setRoomResults([]);
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const qList = questions.length > 0 ? questions : [];
  const currentQ = qList[currentQuestion];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-x-hidden overflow-y-auto no-scrollbar pb-20">
      <AnimatePresence mode="wait">
        {state === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-6 items-center justify-center space-y-6"
          >
            <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600">
              <GraduationCap size={48} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Quiz lớp học</h1>
            <p className="text-slate-500 text-center text-sm">
              {userRole === 'teacher'
                ? 'Tạo phòng quiz từ bản nháp và mời học sinh tham gia'
                : 'Nhập mã phòng để tham gia quiz cùng lớp'}
            </p>

            {userRole === 'teacher' ? (
              <button
                onClick={() => setState('create')}
                className="w-full max-w-xs bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3"
              >
                <Users size={24} />
                TẠO PHÒNG QUIZ
              </button>
            ) : (
              <button
                onClick={() => setState('join')}
                className="w-full max-w-xs bg-emerald-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3"
              >
                <Key size={24} />
                VÀO PHÒNG QUIZ
              </button>
            )}
          </motion.div>
        )}

        {state === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setState('lobby')} className="p-2 -ml-2">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-xl font-black">Tạo phòng Quiz</h2>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Chọn đề thi</label>
                <select
                  value={selectedDraftId}
                  onChange={(e) => setSelectedDraftId(e.target.value)}
                  className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-primary"
                >
                  <option value="">-- Chọn bản nháp --</option>
                  {drafts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.questions.filter((q) => q.type === 'multiple_choice' || q.type === 'checkbox').length} câu TN)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Thời gian (giây)</label>
                <select
                  value={createTimeLimit}
                  onChange={(e) => setCreateTimeLimit(Number(e.target.value))}
                  className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-primary"
                >
                  <option value={30}>30 giây</option>
                  <option value={60}>60 giây</option>
                  <option value={90}>90 giây</option>
                  <option value={120}>2 phút</option>
                </select>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={!selectedDraftId || isCreating}
                className="w-full bg-primary text-white py-4 rounded-xl font-black disabled:opacity-50"
              >
                {isCreating ? 'Đang tạo...' : 'TẠO PHÒNG'}
              </button>
            </div>
          </motion.div>
        )}

        {state === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setState('lobby')} className="p-2 -ml-2">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-xl font-black">Vào phòng Quiz</h2>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Mã phòng (6 số)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="VD: 123456"
                  className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl text-2xl font-black text-center tracking-[0.3em] outline-none focus:border-primary"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={roomCode.length !== 6}
                className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black disabled:opacity-50"
              >
                VÀO PHÒNG
              </button>
            </div>
          </motion.div>
        )}

        {state === 'waiting_room' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col p-4 sm:p-6"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-6 text-white text-center mb-4 shadow-xl shadow-indigo-200">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-100">Mã tham gia</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-4xl sm:text-5xl font-black tracking-[0.2em] tabular-nums">{roomCode}</span>
                <button
                  onClick={copyCode}
                  className="p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-colors"
                >
                  {isCopied ? <Check size={24} className="text-emerald-300" /> : <Clipboard size={24} />}
                </button>
              </div>
              <p className="text-sm text-indigo-100 mt-3">Chia sẻ mã này để học sinh vào phòng</p>
            </div>

            <div className="flex-1 bg-white rounded-3xl shadow-lg border border-slate-100 p-5 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <Users size={20} className="text-indigo-500" />
                  Đã tham gia ({roomPlayers.length})
                </h3>
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold">Đang chờ</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pr-1">
                {roomPlayers.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors',
                      p.isMe ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50/80 border-slate-100 hover:border-slate-200'
                    )}
                  >
                    <img src={avatarMap[p.id] || (p.isMe ? userProfile?.avatar : undefined) || p.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover bg-slate-200 shrink-0 ring-2 ring-white shadow" referrerPolicy="no-referrer" />
                    <span className={cn('font-bold text-slate-800', p.isMe && 'text-indigo-700')}>{p.name}</span>
                  </div>
                ))}
                {roomPlayers.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Users size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="font-bold">Chưa có học sinh nào</p>
                    <p className="text-sm mt-1">Chia sẻ mã phòng để mời học sinh</p>
                  </div>
                )}
              </div>

              {isHost ? (
                <button
                  onClick={handleStartQuiz}
                  disabled={roomPlayers.length < 1}
                  className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-indigo-700 transition-all"
                >
                  <Play size={24} fill="white" />
                  BẮT ĐẦU QUIZ
                </button>
              ) : (
                <div className="w-full mt-4 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2">
                  <Clock size={20} />
                  Đang chờ giáo viên bắt đầu...
                </div>
              )}

              <button onClick={handleLeaveRoom} className="w-full mt-3 text-slate-400 font-bold text-sm hover:text-slate-600 py-2">
                Rời phòng
              </button>
            </div>
          </motion.div>
        )}

        {state === 'playing' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
            {userRole === 'teacher' ? (
              <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg mb-4 shrink-0">
                  <span className="font-black text-lg tracking-wider">{roomCode}</span>
                  <span className={cn("font-black text-2xl px-4 py-1 rounded-xl", timeLeft <= 10 && "bg-red-500/30 animate-pulse")}>
                    {timeLeft}s
                  </span>
                  <span className="font-bold flex items-center gap-1">
                    <Users size={18} />
                    {roomPlayers.length} HS
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                  <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Trophy className="text-amber-500" size={20} />
                    Bảng xếp hạng theo thời gian thực
                  </h3>

                  {/* Podium Top 3 */}
                  {qList.length > 0 && (() => {
                    const sorted = [...roomPlayers].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
                    const top3 = sorted.slice(0, 3);
                    if (top3.length === 0) return null;
                    return (
                      <div className="flex items-end justify-center gap-2 sm:gap-4 mb-6">
                        {top3[1] && (
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex flex-col items-center order-1"
                          >
                            <img src={avatarMap[top3[1].id] || top3[1].avatar} alt="" className="w-14 h-14 rounded-2xl object-cover border-4 border-slate-300 shadow-lg mb-2" referrerPolicy="no-referrer" />
                            <div className="w-20 h-16 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-xl flex items-center justify-center border border-slate-300">
                              <span className="font-black text-slate-600">2</span>
                            </div>
                            <span className="font-bold text-slate-700 text-sm mt-1 truncate max-w-[80px] text-center">{top3[1].name}</span>
                            <span className="font-black text-indigo-600 text-sm">{top3[1].score ?? 0}</span>
                          </motion.div>
                        )}
                        {top3[0] && (
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col items-center order-0 -mx-2 z-10"
                          >
                            <Crown className="text-amber-400 -mt-2 mb-1" size={28} />
                            <img src={avatarMap[top3[0].id] || top3[0].avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border-4 border-amber-400 shadow-xl mb-2" referrerPolicy="no-referrer" />
                            <div className="w-24 h-20 bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-xl flex items-center justify-center border-2 border-amber-300">
                              <span className="font-black text-amber-700 text-xl">1</span>
                            </div>
                            <span className="font-black text-slate-800 text-sm mt-1 truncate max-w-[90px] text-center">{top3[0].name}</span>
                            <span className="font-black text-amber-600 text-base">{top3[0].score ?? 0}</span>
                          </motion.div>
                        )}
                        {top3[2] && (
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center order-2"
                          >
                            <img src={avatarMap[top3[2].id] || top3[2].avatar} alt="" className="w-14 h-14 rounded-2xl object-cover border-4 border-amber-600 shadow-lg mb-2" referrerPolicy="no-referrer" />
                            <div className="w-20 h-12 bg-gradient-to-t from-amber-200/70 to-amber-100/70 rounded-t-xl flex items-center justify-center border border-amber-400">
                              <span className="font-black text-amber-700">3</span>
                            </div>
                            <span className="font-bold text-slate-700 text-sm mt-1 truncate max-w-[80px] text-center">{top3[2].name}</span>
                            <span className="font-black text-amber-600 text-sm">{top3[2].score ?? 0}</span>
                          </motion.div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Full list with progress */}
                  <div className="space-y-2">
                    {[...roomPlayers]
                      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                      .map((p, i) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-4 p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-sm"
                        >
                          <span
                            className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0',
                              i === 0 && 'bg-amber-100 text-amber-600',
                              i === 1 && 'bg-slate-200 text-slate-600',
                              i === 2 && 'bg-amber-50 text-amber-700',
                              i > 2 && 'bg-slate-100 text-slate-500'
                            )}
                          >
                            {i + 1}
                          </span>
                          <img src={avatarMap[p.id] || p.avatar} alt="" className="w-11 h-11 rounded-xl object-cover bg-slate-100 shrink-0" referrerPolicy="no-referrer" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-800 truncate">{p.name}</span>
                              <span className="font-black text-indigo-600 shrink-0">{p.score ?? 0}</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-indigo-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${qList.length ? ((p.progress ?? 0) / qList.length) * 100 : 0}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <button
                  onClick={() => setState('result')}
                  className="w-full mt-4 bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl font-black shadow-lg shrink-0"
                >
                  KẾT THÚC QUIZ
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <span className="font-black text-indigo-600">{score} điểm</span>
                  <span
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center font-black',
                      timeLeft <= 5 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100'
                    )}
                  >
                    {timeLeft}
                  </span>
                  <span className="text-slate-500 text-sm">
                    Câu {currentQuestion + 1}/{qList.length}
                  </span>
                </div>

                <div className="flex-1 p-6 flex flex-col items-center justify-center">
                  {currentQ && (
                    <>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {currentQ.type === 'checkbox'
                          ? 'Chọn một hoặc nhiều đáp án đúng'
                          : 'Chọn một đáp án đúng'}
                      </p>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-800 text-center mb-8">
                        {currentQ.question}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                        {currentQ.type === 'checkbox' ? (
                          currentQ.options.map((opt, i) => (
                            <motion.button
                              key={i}
                              type="button"
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleCheckboxToggle(i)}
                              className={cn(
                                'p-4 rounded-2xl border-2 bg-white font-bold text-left flex items-center gap-4',
                                checkboxSelections.includes(i)
                                  ? 'border-primary text-primary bg-indigo-50'
                                  : 'border-slate-100 text-slate-700 hover:border-primary hover:text-primary'
                              )}
                            >
                              {checkboxSelections.includes(i) ? (
                                <CheckSquare className="w-7 h-7 shrink-0 text-primary" />
                              ) : (
                                <Square className="w-7 h-7 shrink-0 text-slate-300" />
                              )}
                              <span>{opt}</span>
                            </motion.button>
                          ))
                        ) : (
                          currentQ.options.map((opt, i) => (
                            <motion.button
                              key={i}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleAnswer(opt)}
                              className="p-4 rounded-2xl border-2 border-slate-100 bg-white font-bold text-slate-700 hover:border-primary hover:text-primary text-left"
                            >
                              {opt}
                            </motion.button>
                          ))
                        )}
                      </div>
                      {currentQ.type === 'checkbox' && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCheckboxConfirm}
                          disabled={checkboxSelections.length === 0}
                          className="mt-6 w-full max-w-xs bg-primary text-white py-4 rounded-2xl font-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          TIẾP THEO
                        </motion.button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {state === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col p-4 sm:p-6"
          >
            <h2 className="text-2xl font-black text-center mb-2">KẾT QUẢ QUIZ</h2>
            <p className="text-slate-500 text-center text-sm mb-6">Phòng {roomCode}</p>

            {/* Podium Top 3 */}
            {roomResults.length > 0 && (
              <div className="flex items-end justify-center gap-2 sm:gap-4 mb-6">
                {roomResults[1] && (
                  <motion.div initial={{ y: 30 }} animate={{ y: 0 }} className="flex flex-col items-center">
                    <img src={avatarMap[roomResults[1].id] || roomResults[1].avatar} alt="" className="w-14 h-14 rounded-2xl object-cover border-4 border-slate-300 shadow mb-2" referrerPolicy="no-referrer" />
                    <div className="w-20 h-16 bg-slate-200 rounded-t-xl flex items-center justify-center border border-slate-300">
                      <span className="font-black text-slate-600">2</span>
                    </div>
                    <span className="font-bold text-sm mt-1 truncate max-w-[70px] text-center">{roomResults[1].name}</span>
                    <span className="font-black text-indigo-600">{roomResults[1].score ?? 0}</span>
                  </motion.div>
                )}
                {roomResults[0] && (
                  <motion.div initial={{ y: 30 }} animate={{ y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center -mx-1 z-10">
                    <Crown className="text-amber-400 -mt-1 mb-0.5" size={26} />
                    <img src={avatarMap[roomResults[0].id] || roomResults[0].avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border-4 border-amber-400 shadow-lg mb-2" referrerPolicy="no-referrer" />
                    <div className="w-24 h-20 bg-amber-100 rounded-t-xl flex items-center justify-center border-2 border-amber-300">
                      <span className="font-black text-amber-700 text-xl">1</span>
                    </div>
                    <span className="font-black text-sm mt-1 truncate max-w-[80px] text-center">{roomResults[0].name}</span>
                    <span className="font-black text-amber-600">{roomResults[0].score ?? 0}</span>
                  </motion.div>
                )}
                {roomResults[2] && (
                  <motion.div initial={{ y: 30 }} animate={{ y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
                    <img src={avatarMap[roomResults[2].id] || roomResults[2].avatar} alt="" className="w-14 h-14 rounded-2xl object-cover border-4 border-amber-600 shadow mb-2" referrerPolicy="no-referrer" />
                    <div className="w-20 h-12 bg-amber-100 rounded-t-xl flex items-center justify-center border border-amber-400">
                      <span className="font-black text-amber-700">3</span>
                    </div>
                    <span className="font-bold text-sm mt-1 truncate max-w-[70px] text-center">{roomResults[2].name}</span>
                    <span className="font-black text-amber-600">{roomResults[2].score ?? 0}</span>
                  </motion.div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2">
              {roomResults.slice(3).map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-2xl border-2',
                    p.isMe ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-500">{i + 4}</span>
                    <img src={avatarMap[p.id] || (p.isMe ? userProfile?.avatar : undefined) || p.avatar} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100" referrerPolicy="no-referrer" />
                    <span className={cn('font-bold', p.isMe && 'text-indigo-700')}>{p.name}</span>
                  </div>
                  <span className="font-black">{p.score ?? 0}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleLeaveRoom}
              className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black"
            >
              QUAY LẠI
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
