import { describe, it, expect } from 'vitest';
import { normalizeRoomCode, roomKindOf } from '../src/features/rooms/joinLink';

describe('normalizeRoomCode', () => {
  it('giữ nguyên mã quiz 6 chữ số, viết hoa mã phòng đấu', () => {
    expect(normalizeRoomCode('123456')).toBe('123456');
    expect(normalizeRoomCode(' ab12cd ')).toBe('AB12CD');
  });
  it('tách mã từ link dán vào', () => {
    expect(normalizeRoomCode('https://mathstudy.app/join/654321')).toBe('654321');
    expect(normalizeRoomCode('mathstudy.app/join/x7k2pq/')).toBe('X7K2PQ');
    expect(normalizeRoomCode('https://mathstudy.app/?join=111222')).toBe('111222');
  });
  it('bỏ ký tự thừa và cắt còn 6 ký tự', () => {
    expect(normalizeRoomCode('123 456')).toBe('123456');
    expect(normalizeRoomCode('1234567')).toBe('123456');
  });
});

describe('roomKindOf', () => {
  it('6 chữ số là phòng quiz, có chữ cái là phòng đấu', () => {
    expect(roomKindOf('123456')).toBe('quiz');
    expect(roomKindOf('A23456')).toBe('duel');
  });
});
