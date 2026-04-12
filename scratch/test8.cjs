
const fs = require("fs");
const main = fs.readFileSync("src/main.tsx", "utf8");
console.log(main.includes("katex"));

