const s = "$ \\text{Tam giác có dáy } 14 \\text{ m và chi?u cao } 12 \\text{ m. Di?n tích là:} $";
function convertLatexToMarkdown(latexStr) {
    let s = latexStr.trim();
    if (s.startsWith("$") && s.endsWith("$")) {
        s = s.substring(1, s.length - 1).trim();
    } else {
        return latexStr;
    }

    let result = "";
    const regex = /\\text\{([\s\S]*?)\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(s)) !== null) {
        const mathPart = s.substring(lastIndex, match.index).trim();
        if (mathPart) {
            result += " $" + mathPart + "$ ";
        }
        result += match[1];
        lastIndex = regex.lastIndex;
    }

    const remainingMath = s.substring(lastIndex).trim();
    if (remainingMath) {
        result += " $" + remainingMath + "$ ";
    }

    return result.replace(/\s+/g, " ").trim();
}
console.log("Original: " + s);
console.log("Processed: " + convertLatexToMarkdown(s));

