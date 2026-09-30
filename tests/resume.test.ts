import { describe, it, expect } from 'vitest';
import { resumeRoom, resumeQuickDuel } from '../shared/resume';

const ts = (ms: number) => ({ toMillis: () => ms });
const NOW = 1_000_000;

describe('resumeRoom', () => {
  const base = {
    hostId: 'host',
    status: 'playing' as const,
    timeLimit: 300,
    currentPlayers: ['host', 'me'],
    startedAt: ts(NOW - 100_000), // đã chơi 100 giây
  };

  it('không còn trong phòng hoặc phòng đã bị xoá → gone', () => {
    expect(resumeRoom(null, 'me', NOW).kind).toBe('gone');
    expect(resumeRoom({ ...base, currentPlayers: ['host'] }, 'me', NOW).kind).toBe('gone');
  });

  it('phòng đang chờ → về phòng chờ', () => {
    expect(resumeRoom({ ...base, status: 'waiting' }, 'me', NOW)).toEqual({ kind: 'waiting' });
  });

  it('đang chơi dở → tiếp tục đúng câu, đúng điểm, đúng thời gian còn lại', () => {
    const room = { ...base, participantProgress: { me: { score: 40, progress: 5, finished: false } } };
    expect(resumeRoom(room, 'me', NOW)).toEqual({ kind: 'playing', currentQuestion: 5, score: 40, timeLeft: 200 });
  });

  it('chưa trả lời câu nào → bắt đầu từ câu đầu', () => {
    expect(resumeRoom(base, 'me', NOW)).toEqual({ kind: 'playing', currentQuestion: 0, score: 0, timeLeft: 200 });
  });

  it('đã làm xong hoặc đã hết giờ → màn kết quả', () => {
    const done = { ...base, participantProgress: { me: { score: 70, progress: 10, finished: true } } };
    expect(resumeRoom(done, 'me', NOW)).toEqual({ kind: 'finished', score: 70 });
    const late = { ...base, startedAt: ts(NOW - 400_000), participantProgress: { me: { score: 30, progress: 3, finished: false } } };
    expect(resumeRoom(late, 'me', NOW)).toEqual({ kind: 'finished', score: 30 });
  });
});

describe('resumeQuickDuel', () => {
  const duel = {
    player1Id: 'p1', player2Id: 'p2', status: 'playing', startedAt: ts(NOW - 60_000),
    player1Score: 50, player2Score: 20, player1Progress: 6, player2Progress: 3,
    player1Correct: 5, player2Correct: 2, player1TimeLeftAtFinish: null, player2TimeLeftAtFinish: null,
  };

  it('trả về đúng góc nhìn của từng người chơi', () => {
    const p2 = resumeQuickDuel(duel, 'p2', NOW);
    expect(p2).toMatchObject({ kind: 'playing', isPlayer1: false, opponentId: 'p1', score: 20, opponentScore: 50, progress: 3, correct: 2, timeLeft: 240 });
  });

  it('trận đã có kết quả hoặc không phải trận của mình → gone', () => {
    expect(resumeQuickDuel({ ...duel, result: {} }, 'p1', NOW).kind).toBe('gone');
    expect(resumeQuickDuel({ ...duel, status: 'finished' }, 'p1', NOW).kind).toBe('gone');
    expect(resumeQuickDuel(duel, 'x', NOW).kind).toBe('gone');
  });

  it('đã hết giờ → vẫn vào lại để server chốt kết quả ngay (timeLeft = 1)', () => {
    const r = resumeQuickDuel({ ...duel, startedAt: ts(NOW - 999_000) }, 'p1', NOW);
    expect(r).toMatchObject({ kind: 'playing', timeLeft: 1 });
  });

  it('đã làm hết câu → đang chờ đối thủ', () => {
    expect(resumeQuickDuel({ ...duel, player1TimeLeftAtFinish: 12 }, 'p1', NOW)).toMatchObject({ finishedAll: true });
  });
});
