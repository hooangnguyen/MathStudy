import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { prepareMathContent } from '../src/components/common/MathRenderer';

describe('prepareMathContent', () => {
  it('giữ dấu cách giữa chữ và công thức', () => {
    const out = prepareMathContent('$ \\text{Tam giác có đáy } 17 \\text{ cm và chiều cao } 6 \\text{ cm. Diện tích là:} $');
    expect(out).toBe('Tam giác có đáy $17$ cm và chiều cao $6$ cm. Diện tích là:');
  });

  it('đổi a/b thành phân số và bỏ khoảng trắng thừa trong $...$', () => {
    expect(prepareMathContent('$ 3/6 $')).toBe('$\\frac{3}{6}$');
    expect(prepareMathContent('Tính $ 1 + 2 $ và $ 3 $ nhé')).toBe('Tính $1 + 2$ và $3$ nhé');
  });

  it('văn bản thường không bị đổi', () => {
    expect(prepareMathContent('Xin chào')).toBe('Xin chào');
    expect(prepareMathContent(null)).toBe('');
  });

  it('toàn bộ ngân hàng câu hỏi: không còn chữ dính vào số ở chỗ dữ liệu gốc có dấu cách', () => {
    const dir = 'src/data/questions';
    const bad: string[] = [];
    for (const file of readdirSync(dir)) {
      const bank = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'));
      for (const q of bank) {
        for (const text of [q.text, ...(q.options || [])]) {
          if (typeof text !== 'string' || !text.includes('\\text')) continue;
          const out = prepareMathContent(text);
          // Duyệt từng cặp $...$ theo thứ tự: công thức không được dính liền vào chữ phía sau
          // (vd. "$6$cm", "$17$cm"), trừ khi dữ liệu gốc vốn viết liền.
          for (const m of out.matchAll(/\$[^$]*\$/g)) {
            const next = out[m.index! + m[0].length];
            if (next && /[A-Za-zÀ-ỹ]/.test(next) && !text.includes(`${m[0].slice(1, -1)}\\text{${next}`)) {
              bad.push(`${file}: ${out}`);
            }
          }
        }
      }
    }
    expect(bad.slice(0, 3)).toEqual([]);
  });
});
