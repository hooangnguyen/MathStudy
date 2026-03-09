const fs = require('fs');
const raw = fs.readFileSync('./QuestionData 1 .json', 'utf8');
const cleaned = '[' + raw
    .replace(/\/\/.*/g, '')
    .trim()
    .replace(/\.+$/, '')
    .replace(/\]\s*\[/g, ',')
    .replace(/}\s*{/g, '},{')
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '') + ']';

try {
    const data = JSON.parse(cleaned);
    fs.writeFileSync('./src/data/curriculumData.json', JSON.stringify(data, null, 2));
    console.log('Extracted ' + data.length);
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
