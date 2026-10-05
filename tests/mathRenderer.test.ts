import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { prepareMathContent, legacyTextToEditable } from '../src/components/common/MathRenderer';

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

describe('prepareMathContent: xuống dòng và ký tự đặc biệt', () => {
  it('giữ xuống dòng (ngắt dòng cứng trong Markdown)', () => {
    expect(prepareMathContent('Dòng 1\nDòng 2 có $x^2$')).toBe('Dòng 1  \nDòng 2 có $x^2$');
    expect(prepareMathContent('$\\text{Câu a} $\n$\\text{Câu b}$')).toContain('  \n');
  });

  it('không biến * và _ ngoài công thức thành định dạng', () => {
    expect(prepareMathContent('Tính 2 * 3 * 4')).toBe('Tính 2 \\* 3 \\* 4');
    expect(prepareMathContent('$a_1 * b$ và x_y')).toBe('$a_1 * b$ và x\\_y');
  });
});

describe('legacyTextToEditable', () => {
  it('đổi dạng $\\text{...}$ sang chữ + $công thức$ dễ sửa', () => {
    expect(legacyTextToEditable('$ \\text{Kết quả của phép nhân } 2x(x^2 - 3x + 1) \\text{ là gì?} $'))
      .toBe('Kết quả của phép nhân $2x(x^2 - 3x + 1)$ là gì?');
    expect(legacyTextToEditable('Tính $x$')).toBe('Tính $x$');
  });

  it('toàn bộ ngân hàng câu hỏi: sau khi đổi, học sinh vẫn thấy y hệt', () => {
    const dir = 'src/data/questions';
    const norm = (s: string) => s.replace(/\\([*_])/g, '$1').replace(/\s+/g, ' ').trim();
    const diffs: string[] = [];
    for (const file of readdirSync(dir)) {
      for (const q of JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'))) {
        for (const text of [q.text, ...(q.options || [])]) {
          if (typeof text !== 'string') continue;
          if (norm(prepareMathContent(legacyTextToEditable(text))) !== norm(prepareMathContent(text))) diffs.push(text);
        }
      }
    }
    expect(diffs.slice(0, 3)).toEqual([]);
  });
});

describe('prepareMathContent: nội dung soạn bằng trình soạn mới', () => {
  it('chữ xen công thức có lệnh LaTeX không bị bọc cả câu thành công thức', () => {
    expect(prepareMathContent('Tính $\\frac{1}{2} + \\frac{1}{3}$\nRồi rút gọn')).toBe('Tính $\\frac{1}{2} + \\frac{1}{3}$  \nRồi rút gọn');
  });
  it('LaTeX thô không có $ (bản nháp cũ) vẫn hiển thị là công thức', () => {
    expect(prepareMathContent('\\frac{1}{2}')).toBe('$\\frac{1}{2}$');
  });
});
