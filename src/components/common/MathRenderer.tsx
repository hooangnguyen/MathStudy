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
                if (cleanMath) result += ` $${cleanMath}$ `;
            }
            result += match[1];
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

        return result.replace(/\s+/g, ' ').trim();
    };

    if (safeContent.includes('\\text')) {
        processedContent = convertLatexToMarkdown(safeContent);
    } else if (isRawLatex(safeContent)) {
        processedContent = `$${safeContent.trim()}$`;
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
