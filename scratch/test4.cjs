
const fs = require("fs");
const grades = ["grade1", "grade2", "grade3", "grade4", "grade5"];
for (let grade of grades) {
    if (!fs.existsSync(`src/data/questions/${grade}.json`)) continue;
    const data = JSON.parse(fs.readFileSync(`src/data/questions/${grade}.json`, "utf8"));
    const match = data.find(q => q.text && q.text.includes("56"));
    if (match) console.log(grade, match.text);
}

