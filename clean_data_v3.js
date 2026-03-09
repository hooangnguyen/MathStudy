const fs = require('fs');
const path = require('path');

const inputPath = 'C:\\Users\\acer\\Desktop\\Mathstudy\\QuestionData 1 .json';
const outputPath = 'C:\\Users\\acer\\Desktop\\Mathstudy\\src\\data\\curriculumData.json';

try {
    let content = fs.readFileSync(inputPath, 'utf8');

    // 1. Remove comments
    content = content.replace(/\/\/.*/g, '');

    // 2. Fix structure
    content = content.trim();
    if (content.endsWith('.')) content = content.slice(0, -1);

    // 3. Merge arrays and fix missing commas
    // This handles any number of arrays or objects separated by whitespace
    let merged = '[' + content
        .replace(/\]\s*\[/g, ',') // Merge arrays
        .replace(/}\s*{/g, '},{') // Add commas between objects
        .replace(/^\s*\[/, '')    // Remove leading [
        .replace(/\]\s*$/, '')    // Remove trailing ]
        + ']';

    // 4. Validate and Parse
    try {
        const data = JSON.parse(merged);
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`Success! Extracted ${data.length} questions.`);
    } catch (parseErr) {
        console.error('JSON Parse Error:', parseErr.message);
        // Fallback: If parse fails, it might be due to trailing commas or other small issues
        // We'll trust the caller to see the error message
        process.exit(1);
    }
} catch (err) {
    console.error('File Error:', err);
    process.exit(1);
}
