import { describe, it, expect } from 'vitest';
import { rankPlayers } from '../src/features/quiz/ranking';

const p = (id: string, score: number) => ({ id, name: id, score, isMe: false });

describe('rankPlayers', () => {
  it('xếp theo điểm giảm dần', () => {
    expect(rankPlayers([p('a', 10), p('b', 30), p('c', 20)]).map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });
  it('bằng điểm thì cùng hạng, hạng sau bị bỏ qua (1, 1, 3)', () => {
    expect(rankPlayers([p('An', 30), p('Bình', 30), p('Chi', 20), p('Dũng', 0)]).map((x) => x.rank)).toEqual([1, 1, 3, 4]);
  });
  it('chịu được 200 học sinh và người chưa có điểm', () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ id: `s${i}`, name: `HS ${i}`, isMe: false, score: i % 7 === 0 ? undefined : i }));
    const ranked = rankPlayers(many);
    expect(ranked).toHaveLength(200);
    expect(ranked[0].score).toBe(199);
    expect(ranked.every((r, i) => i === 0 || r.rank >= ranked[i - 1].rank)).toBe(true);
  });
});
