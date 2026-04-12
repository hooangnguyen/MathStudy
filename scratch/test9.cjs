
const s = "$ \\text{Tam giác có di?n tích } 56 \\text{ cm² và dáy } 14 \\text{ cm. Chi?u cao là:} $";
const blockMatch = s.match(/^\$+([\s\S]*?)\$+$/);
let inner = s;
if (blockMatch) { inner = blockMatch[1].trim(); }
console.log("inner:", inner);

let result = "";
const regex = /\\text\{([\s\S]*?)\}/g;
let lastIndex = 0;
let match;
while ((match = regex.exec(inner)) !== null) {
    const mathPart = inner.substring(lastIndex, match.index).trim();
    if (mathPart) {
        let cleanMath = mathPart.replace(/(^\$+)|(\$+$)/g, "").trim();
        if (cleanMath) result += ` $${cleanMath}$ `;
    }
    result += match[1];
    lastIndex = regex.lastIndex;
}
console.log("result so far:", result);

