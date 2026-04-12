
const fs = require("fs");
const questions = JSON.parse(fs.readFileSync("src/data/questions/grade4.json", "utf8"));
const q = questions.find(q => q.text && q.text.includes("Tam giác có di?n tích 56"));
console.log(q ? q.text : "Not found");

