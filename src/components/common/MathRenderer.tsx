import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathRendererProps {
    content?: string | null;
    className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className }) => {
    // Normalize content to avoid runtime errors
    const safeContent = typeof content === 'string'
        ? content
        : content == null
            ? ''
            : String(content);

    let processedContent = safeContent;

    const isRawLatex = (str: string) => {
        const trimmed = (str || '').trim();
        if (!trimmed) return false;
        if (trimmed.startsWith('$') || trimmed.startsWith('\\(') || trimmed.startsWith('\\[')) return false;
        return /\\/.test(trimmed);
    };

    const formatMathFractions = (mathStr: string) => {
        return mathStr.replace(/(\d+)\s*\/\s*(\d+)/g, '\\frac{$1}{$2}');
    };

    const convertLatexToMarkdown = (latexStr: string) => {
        let s = latexStr.trim();
        const blockMatch = s.match(/^\$+([\s\S]*?)\$+$/);
        if (blockMatch) {
            s = blockMatch[1].trim();
        }

        let result = '';
        const regex = /\\text\s*\{([\s\S]*?)\}/g;
        let lastIndex = 0;
        let match;
        let hasMatched = false;

        while ((match = regex.exec(s)) !== null) {
            hasMatched = true;
            const mathPart = s.substring(lastIndex, match.index).trim();
            if (mathPart) {
                let cleanMath = mathPart.replace(/(^\$+)|(\$+$)/g, '').trim();
                cleanMath = formatMathFractions(cleanMath);
                if (cleanMath) result += ` $${cleanMath}$ `;
            }
            result += match[1];
            lastIndex = regex.lastIndex;
        }

        if (!hasMatched) {
            // No \text found, just format the whole thing if it's math
            return formatMathFractions(latexStr);
        }

        const remainingMath = s.substring(lastIndex).trim();
        if (remainingMath) {
            let cleanMath = remainingMath.replace(/(^\$+)|(\$+$)/g, '').trim();
            cleanMath = formatMathFractions(cleanMath);
            if (cleanMath) result += ` $${cleanMath}$ `;
        }

        return result.replace(/\s+/g, ' ').trim();
    };

    if (safeContent.includes('\\text')) {
        processedContent = convertLatexToMarkdown(safeContent);
    } else if (isRawLatex(safeContent)) {
        let cleanMath = safeContent.trim().replace(/(^\$+)|(\$+$)/g, '').trim();
        cleanMath = formatMathFractions(cleanMath);
        processedContent = `$${cleanMath}$`;
    } else {
        // Find and replace all inline fractions outside of $...$ into $\frac{...}{...}$
        // A simple approach is to find (\d+)/(\d+) not inside $...$
        // To be safe, if the string has NO '$' characters, we can safely replace all
        if (!processedContent.includes('$')) {
            processedContent = processedContent.replace(/(\d+)\s*\/\s*(\d+)/g, '$\\frac{$1}{$2}$');
        } else {
            // Only replace inside existing $...$ blocks
            processedContent = processedContent.replace(/\$([\s\S]*?)\$/g, (match, p1) => {
                return `$${formatMathFractions(p1)}$`;
            });
        }
    }

    processedContent = processedContent.replace(/\$\s+([\s\S]*?)\s+\$/g, '$$$1$$');

    return (
        <div className={`math-renderer block w-full max-w-full break-words ${className || ''}`}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};
