/**
 * Soạn nội dung câu hỏi dạng "chữ + công thức": chữ viết bình thường (Enter để xuống dòng),
 * công thức nằm trong cặp $...$ (LaTeX), ví dụ: "Tính $\frac{1}{2} + \frac{1}{3}$".
 */

/** Đánh dấu vị trí con trỏ trong mẫu công thức, vd. "\\frac{#}{}" → con trỏ nằm trong tử số. */
export const CURSOR = '#';

export interface MathSpan {
  /** Vị trí dấu $ mở */
  start: number;
  /** Vị trí ngay sau dấu $ đóng */
  end: number;
  latex: string;
}

/** Các cặp $...$ trong văn bản (ghép lần lượt từ trái sang phải, bỏ qua \$). */
export const findMathSpans = (text: string): MathSpan[] => {
  const spans: MathSpan[] = [];
  let open = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '$' || text[i - 1] === '\\') continue;
    if (open === -1) {
      open = i;
    } else {
      spans.push({ start: open, end: i + 1, latex: text.slice(open + 1, i) });
      open = -1;
    }
  }
  return spans;
};

/** Công thức chứa vị trí `pos` (con trỏ nằm giữa hai dấu $), nếu có. */
export const findMathSpanAt = (text: string, pos: number): MathSpan | null =>
  findMathSpans(text).find((s) => pos > s.start && pos < s.end) ?? null;

/**
 * Chèn một mẫu công thức tại vùng chọn [selStart, selEnd).
 * - Con trỏ đang ở trong công thức → chèn LaTeX trực tiếp.
 * - Ở ngoài → bọc thành "$...$" để hiển thị đúng là công thức.
 * Trả về văn bản mới và vị trí con trỏ (tại dấu CURSOR trong mẫu, hoặc cuối phần vừa chèn).
 */
export const insertMath = (text: string, selStart: number, selEnd: number, template: string) => {
  const inside = findMathSpanAt(text, selStart) !== null;
  const cursorIndex = template.indexOf(CURSOR);
  const latex = template.replace(CURSOR, '');
  const piece = inside ? latex : `$${latex}$`;
  const pieceCursor = cursorIndex === -1 ? piece.length : cursorIndex + (inside ? 0 : 1);
  return {
    text: text.slice(0, selStart) + piece + text.slice(selEnd),
    cursor: selStart + pieceCursor,
  };
};

/** Thay một công thức có sẵn (khi sửa bằng trình soạn công thức). */
export const replaceMathSpan = (text: string, span: MathSpan, latex: string) => {
  const piece = `$${latex}$`;
  return { text: text.slice(0, span.start) + piece + text.slice(span.end), cursor: span.start + piece.length };
};

/** Chèn công thức hoàn chỉnh (từ trình soạn trực quan) tại vùng chọn. */
export const insertFormula = (text: string, selStart: number, selEnd: number, latex: string) => {
  const piece = `$${latex}$`;
  return { text: text.slice(0, selStart) + piece + text.slice(selEnd), cursor: selStart + piece.length };
};
