import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIR = path.join(__dirname, '../src/data/questions');

function processMathString(str) {
    if (!str || typeof str !== 'string') return str;
    // Already formatted?
    if (str.trim().startsWith('$')) return str;
    
    // Basic heuristic: 
    // Match equations like "A = {1, 2, 3}", "x + y = 3", "2x - 5", or standalone numbers.
    // Also escape { and } for LaTeX display.
    let formatted = str.replace(/([A-Za-z]\s*=\s*\{[^\}]+\})|([A-Za-z]\s*=\s*[A-Za-z0-9]+)|(\d+\s*[\+\-\*\/\=\>\<\:]+\s*\d+[\d\s\+\-\*\/\=\>\<\:]*)|(\b\d+\b)/g, (match) => {
        return `$$$MATH$$$${match}$$$MATH$$$`;
    });
    
    let parts = formatted.split('$$$MATH$$$');
    let finalStr = '';
    
    for (let part of parts) {
        if (!part) continue;
        if (part.match(/^([A-Za-z]\s*=\s*\{[^\}]+\}|[A-Za-z]\s*=\s*[A-Za-z0-9]+|\d+\s*[\+\-\*\/\=\>\<\:]+\s*\d+[\d\s\+\-\*\/\=\>\<\:]*|\b\d+\b)$/)) {
            // It's math - escape \{ and \}
            const escapedMath = part.replace(/\{/g, '\\{').replace(/\}/g, '\\}');
            finalStr += ` ${escapedMath} `;
        } else {
            // It's text
            let trimmedText = part; // keep spaces for continuity if possible, but let's just trim and pad
            if (trimmedText.trim()) {
                finalStr += `\\text{${trimmedText}}`;
            }
        }
    }
    
    // Cleanup double spaces
    finalStr = finalStr.replace(/\s+/g, ' ').trim();
    // Wrap in $...$
    return `$ ${finalStr} $`;
}

async function run() {
    for (let i = 1; i <= 9; i++) {
        const filePath = path.join(DIR, `grade${i}.json`);
        if (!fs.existsSync(filePath)) continue;

        const rawData = fs.readFileSync(filePath, 'utf-8');
        let questions = JSON.parse(rawData);

        const newQuestions = questions.map((q, idx) => {
            let correctAnswerIdx = 0;
            if (q.options && q.answer) {
                correctAnswerIdx = q.options.indexOf(q.answer);
                if (correctAnswerIdx === -1) {
                    // Try case insensitive or trimmed
                    const found = q.options.findIndex(o => o.trim().toLowerCase() === q.answer.trim().toLowerCase());
                    correctAnswerIdx = found !== -1 ? found : 0;
                }
            }

            return {
                id: Date.now() + i * 10000 + idx, // Unique ID
                type: 'multiple_choice',
                text: processMathString(q.question),
                options: q.options ? q.options.map(o => processMathString(o)) : [],
                correctAnswer: correctAnswerIdx,
                points: 10,
                
                // Preserve additional properties for other features
                grade: q.grade,
                topic: q.topic,
                sub_topic: q.sub_topic,
                difficulty: q.difficulty,
                explanation: q.explanation // We can also format explanation if needed, but not required by AssignmentBuilder yet
            };
        });

        fs.writeFileSync(filePath, JSON.stringify(newQuestions, null, 4), 'utf-8');
        console.log(`Updated grade${i}.json with ${newQuestions.length} questions.`);
    }
}

run();
