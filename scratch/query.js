const fs = require("fs");
const questions = JSON.parse(fs.readFileSync("src/data/questions/grade5.json", "utf8"));
const q = questions.find(q => q.text && q.text.includes("Di?n tích là:"));
console.log(JSON.stringify(q, null, 2));

