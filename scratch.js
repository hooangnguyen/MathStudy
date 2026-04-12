const isRawLatex = (str) => {
    const trimmed = (str || '').trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('$') || trimmed.startsWith('\\(') || trimmed.startsWith('\\[')) return false;
    return /\\/.test(trimmed);
};

const convertLatexToMarkdown = (latexStr) => {
    let s = latexStr.trim();
    // Remove enclosing $ or $$ signs to safely process the inside
    const blockMatch = s.match(/^\$+([\s\S]*?)\$+$/);
    if (blockMatch) {
        s = blockMatch[1].trim();
    }

    let result = '';
    // regex to match \text{...} using non-greedy match
    const regex = /\\text\{([\s\S]*?)\}/g;
    let lastIndex = 0;
    let match;
    let hasMatched = false;

    while ((match = regex.exec(s)) !== null) {
        hasMatched = true;
        const mathPart = s.substring(lastIndex, match.index).trim();
        if (mathPart) {
            // Ensure math doesn't contain stray $
            let cleanMath = mathPart.replace(/(^\$+)|(\$+$)/g, '').trim();
            if (cleanMath) result += ` $${cleanMath}$ `;
        }
        result += match[1]; // The text inside \text{}
        lastIndex = regex.lastIndex;
    }

    if (!hasMatched) {
        return latexStr;
    }

    const remainingMath = s.substring(lastIndex).trim();
    if (remainingMath) {
        let cleanMath = remainingMath.replace(/(^\$+)|(\$+$)/g, '').trim();
        if (cleanMath) result += ` $${cleanMath}$ `;
    }

    // Clean up any double spaces that might have been introduced
    return result.replace(/\s+/g, ' ').trim();
};

const content = "$ \\text{Nếu chiều cao giảm một nửa, đáy giữ nguyên thì diện tích:} $";
let processedContent = content;

if (content.includes('\\text{')) {
    processedContent = convertLatexToMarkdown(content);
} else if (isRawLatex(content)) {
    processedContent = `$${content.trim()}$`;
}

processedContent = processedContent.replace(/\$\s+([\s\S]*?)\s+\$/g, '$$$1$$');

console.log("Original:", content);
console.log("Processed:", processedContent);
