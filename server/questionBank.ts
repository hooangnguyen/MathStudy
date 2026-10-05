import fs from "fs";
import path from "path";
import type { BankQuestion } from "../shared/lesson";

const cache = new Map<number, BankQuestion[]>();

/** Ngân hàng câu hỏi của một lớp (đọc từ src/data/questions, cache trong bộ nhớ). */
export function getQuestionBank(grade: number): BankQuestion[] {
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) return [];
  let bank = cache.get(grade);
  if (!bank) {
    const file = path.resolve(process.cwd(), "src/data/questions", `grade${grade}.json`);
    bank = JSON.parse(fs.readFileSync(file, "utf-8")) as BankQuestion[];
    cache.set(grade, bank);
  }
  return bank;
}
