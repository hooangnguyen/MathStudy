import { describe, it, expect } from 'vitest';

// --- MOCK LOGIC TỪ MathDuel.tsx ---
// Giả lập logic tính toán điểm số và kết quả cuối cùng (win/lose/draw) 
// để kiểm tra xem hệ thống có xử lý đúng trường hợp ĐẦU HÀNG (surrender) hay không.

function calculateMatchOutcome(
  playerScore: number, 
  opponentScore: number, 
  forceIsWin?: boolean
) {
  const finalOppScore = opponentScore;
  const isWin = forceIsWin !== undefined ? forceIsWin : playerScore > finalOppScore;
  const isDraw = forceIsWin !== undefined ? false : playerScore === finalOppScore;

  let matchOutcome: 'win' | 'lose' | 'draw';
  if (isWin) matchOutcome = 'win';
  else if (isDraw) matchOutcome = 'draw';
  else matchOutcome = 'lose';

  let opponentSurrendered = false;
  if (forceIsWin === true) {
    opponentSurrendered = true;
  }

  let lpChange = 0;
  if (isWin) lpChange = 20;
  else if (isDraw) lpChange = 5;
  else lpChange = -15;

  return { matchOutcome, opponentSurrendered, lpChange };
}

describe('Math Duel - Logic xử lý kết quả và Đầu Hàng', () => {
  it('Trường hợp bình thường: Người chơi điểm cao hơn sẽ thắng', () => {
    const result = calculateMatchOutcome(50, 20);
    expect(result.matchOutcome).toBe('win');
    expect(result.lpChange).toBe(20);
    expect(result.opponentSurrendered).toBe(false);
  });

  it('Trường hợp bình thường: Bằng điểm sẽ hòa', () => {
    const result = calculateMatchOutcome(30, 30);
    expect(result.matchOutcome).toBe('draw');
    expect(result.lpChange).toBe(5);
    expect(result.opponentSurrendered).toBe(false);
  });

  it('Trường hợp bình thường: Điểm thấp hơn sẽ thua', () => {
    const result = calculateMatchOutcome(10, 40);
    expect(result.matchOutcome).toBe('lose');
    expect(result.lpChange).toBe(-15);
    expect(result.opponentSurrendered).toBe(false);
  });

  it('Kịch bản 1: Đối thủ đầu hàng dù ĐANG THẮNG ĐIỂM (Opponent Surrenders)', () => {
    // Điểm ta thấp hơn (10) nhưng đối thủ đầu hàng (forceIsWin = true)
    const result = calculateMatchOutcome(10, 40, true);
    
    // Hệ thống phải phán quyết ta thắng
    expect(result.matchOutcome).toBe('win');
    // Ta nhận 20 điểm LP
    expect(result.lpChange).toBe(20);
    // Nhận biết đối thủ đầu hàng để hiển thị thông báo
    expect(result.opponentSurrendered).toBe(true);
  });

  it('Kịch bản 2: Bằng điểm nhưng Đối thủ đầu hàng', () => {
    // Điểm hòa (0-0) nhưng đối thủ đầu hàng (forceIsWin = true)
    const result = calculateMatchOutcome(0, 0, true);
    
    // Ta KHÔNG bị tính hòa, mà sẽ tính thắng
    expect(result.matchOutcome).toBe('win');
    expect(result.lpChange).toBe(20);
    expect(result.opponentSurrendered).toBe(true);
  });

  it('Kịch bản 3: Mình bấm đầu hàng dù điểm đang cao hơn (Self Surrenders)', () => {
    // Mình tự thoát trận (forceIsWin = false), dù đang dẫn trước điểm 50-0
    const result = calculateMatchOutcome(50, 0, false);
    
    // Mình phải BỊ XỬ THUA
    expect(result.matchOutcome).toBe('lose');
    // Trừ 15 LP
    expect(result.lpChange).toBe(-15);
    // Đây là mình tự đầu hàng chứ không phải đối thủ
    expect(result.opponentSurrendered).toBe(false);
  });

  it('Kịch bản 4: Mình bấm đầu hàng khi đang bằng điểm 0-0', () => {
    const result = calculateMatchOutcome(0, 0, false);
    
    // Phải là Thất bại, KHÔNG được tính Hòa
    expect(result.matchOutcome).toBe('lose');
    expect(result.lpChange).toBe(-15);
    expect(result.opponentSurrendered).toBe(false);
  });
});
