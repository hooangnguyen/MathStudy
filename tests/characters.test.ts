import { describe, it, expect } from 'vitest';
import { parseCharacter, encodeCharacter, defaultCharacterFor, randomCharacter, SPECIES, COLORS, ACCESSORIES } from '../src/features/rooms/characters';

describe('nhân vật', () => {
  it('mã hoá rồi đọc lại được đúng nhân vật', () => {
    for (let i = 0; i < 50; i++) {
      const c = randomCharacter();
      expect(parseCharacter(encodeCharacter(c))).toEqual(c);
    }
  });
  it('chuỗi hỏng → nhân vật mặc định theo uid, không lỗi', () => {
    const fallback = defaultCharacterFor('uid-123');
    expect(parseCharacter('dragon.rainbow.cape', 'uid-123')).toEqual({ ...fallback, accessory: 'none' });
    expect(parseCharacter(undefined, 'uid-123')).toEqual(fallback);
    expect(parseCharacter('<script>', 'uid-123').species).toBe(fallback.species);
  });
  it('nhân vật mặc định cố định theo uid và luôn hợp lệ', () => {
    expect(defaultCharacterFor('abc')).toEqual(defaultCharacterFor('abc'));
    const c = defaultCharacterFor('xyz');
    expect(SPECIES.map((s) => s.id)).toContain(c.species);
    expect(COLORS.map((s) => s.id)).toContain(c.color);
  });
  it('chuỗi lưu trong phòng không vượt giới hạn 40 ký tự của rules', () => {
    const longest = Math.max(...SPECIES.map((s) => s.id.length)) + Math.max(...COLORS.map((s) => s.id.length))
      + Math.max(...ACCESSORIES.map((s) => s.id.length)) + 2;
    expect(longest).toBeLessThanOrEqual(40);
  });
});
