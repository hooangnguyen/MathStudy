import { describe, it, expect } from 'vitest';
import { findMathSpans, findMathSpanAt, insertMath, replaceMathSpan, insertFormula } from '../src/content/mathText';

describe('mathText', () => {
  const text = 'Tính $\\frac{1}{2}$ và $x^2$';

  it('tìm các cặp $...$', () => {
    expect(findMathSpans(text).map((s) => s.latex)).toEqual(['\\frac{1}{2}', 'x^2']);
    expect(findMathSpans('Giá \\$5 và $a$').map((s) => s.latex)).toEqual(['a']);
  });

  it('biết con trỏ đang ở trong hay ngoài công thức', () => {
    expect(findMathSpanAt(text, 2)).toBeNull();
    expect(findMathSpanAt(text, text.indexOf('frac'))?.latex).toBe('\\frac{1}{2}');
    expect(findMathSpanAt(text, text.indexOf(' và'))).toBeNull();
  });

  it('chèn ngoài công thức → bọc $...$ và đặt con trỏ vào tử số', () => {
    const r = insertMath('Tính ', 5, 5, '\\frac{#}{}');
    expect(r.text).toBe('Tính $\\frac{}{}$');
    expect(r.text.slice(0, r.cursor)).toBe('Tính $\\frac{');
  });

  it('chèn trong công thức → chèn thẳng LaTeX', () => {
    const t = 'A = $1+$';
    const r = insertMath(t, t.length - 1, t.length - 1, '\\pi');
    expect(r.text).toBe('A = $1+\\pi$');
    expect(r.cursor).toBe(t.length - 1 + 3);
  });

  it('thay vùng đang chọn và giữ nguyên xuống dòng', () => {
    const t = 'Dòng 1\nX dòng 2';
    const r = insertMath(t, 7, 8, '\\times');
    expect(r.text).toBe('Dòng 1\n$\\times$ dòng 2');
  });

  it('sửa / chèn công thức từ trình soạn trực quan', () => {
    const span = findMathSpanAt(text, text.indexOf('x^2'))!;
    expect(replaceMathSpan(text, span, 'x^3').text).toBe('Tính $\\frac{1}{2}$ và $x^3$');
    expect(insertFormula('a ', 2, 2, '\\sqrt{2}').text).toBe('a $\\sqrt{2}$');
  });
});

import { normalizeLatex } from '../src/content/FormulaDialog';

describe('normalizeLatex (kết quả từ MathLive)', () => {
  it('đổi dạng viết gọn sang dạng có ngoặc', () => {
    expect(normalizeLatex('\\frac13')).toBe('\\frac{1}{3}');
    expect(normalizeLatex('\\frac1{23}+\\frac{12}3')).toBe('\\frac{1}{23}+\\frac{12}{3}');
    expect(normalizeLatex('\\sqrt2+\\frac{\\placeholder{}}{4}')).toBe('\\sqrt{2}+\\frac{}{4}');
    expect(normalizeLatex('\\frac{x}{y}')).toBe('\\frac{x}{y}');
  });
});
