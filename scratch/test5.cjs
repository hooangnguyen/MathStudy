
const fs = require("fs");
const grades = ["grade4", "grade5"];
for (let grade of grades) {
    if (!fs.existsSync(`src/data/questions/${grade}.json`)) continue;
    const data = JSON.parse(fs.readFileSync(`src/data/questions/${grade}.json`, "utf8"));
    const matches = data.filter(q => q.text && q.text.includes("Tam giác có di?n tích"));
    matches.forEach(m => console.log(m.text));
}

