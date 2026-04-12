const fs = require("fs");
const questions = JSON.parse(fs.readFileSync("src/data/questions/grade5.json", "utf8"));
const q = questions.find(q => q.text && q.text.includes("Tam giác có dáy"));
console.log(JSON.stringify(q, null, 2));

