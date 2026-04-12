
const fs = require("fs");
const grades = ["grade3", "grade4", "grade5", "grade6", "grade7"];
for (let grade of grades) {
    if (!fs.existsSync(`src/data/questions/${grade}.json`)) continue;
    const data = JSON.parse(fs.readFileSync(`src/data/questions/${grade}.json`, "utf8"));
    const matches = data.filter(q => q.text && q.text.includes("56") && q.text.includes("14"));
    matches.forEach(m => console.log(m.text));
}

