const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'QuestionData 1 .json');
const outputPath = path.join(__dirname, 'src', 'data', 'curriculumData.json');

console.log('Reading:', inputPath);

try {
    const rawContent = fs.readFileSync(inputPath, 'utf8');

    let braceCount = 0;
    let currentObject = '';
    let inString = false;
    let escape = false;
    const questions = [];

    for (let i = 0; i < rawContent.length; i++) {
        const char = rawContent[i];

        if (inString) {
            currentObject += char;
            if (char === '"' && !escape) {
                inString = false;
            }
            escape = (char === '\\' && !escape);
            continue;
        }

        if (char === '"') {
            inString = true;
            currentObject += char;
            continue;
        }

        if (char === '{') {
            if (braceCount === 0) currentObject = '';
            braceCount++;
            currentObject += char;
        } else if (char === '}') {
            braceCount--;
            currentObject += char;
            if (braceCount === 0) {
                // Found a potential object
                let objStr = currentObject.trim();
                // Clean it of comments just in case
                objStr = objStr.replace(/\/\/.*$/gm, '');
                // Sometimes there's a stray comma or nonsense, let's try to parse
                try {
                    const obj = JSON.parse(objStr);
                    if (obj && obj.question && obj.topic) {
                        questions.push(obj);
                    }
                } catch (e) {
                    // Try removing single quotes or other common issues if needed
                    // For now just skip if truly invalid
                }
            }
        } else if (braceCount > 0) {
            currentObject += char;
        }
    }

    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));
    console.log(`Successfully extracted ${questions.length} questions to ${outputPath}`);

} catch (err) {
    console.error('Error processing file:', err);
    process.exit(1);
}
