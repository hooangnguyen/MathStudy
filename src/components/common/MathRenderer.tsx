import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathRendererProps {
    content?: string | null;
    className?: string;
}

/**
 * Chuẩn hoá nội dung câu hỏi (LaTeX với \\text{...}, phân số a/b) thành Markdown + $...$ cho KaTeX.
 * Tách riêng để unit test.
 */
export const prepareMathContent = (content?: string | null): string => {
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

    // Bỏ khoảng trắng thừa bên trong từng cặp $...$ (remark-math không nhận "$ x $").
    // Lưu ý: cách cũ /\$\s+(...)\s+\$/ khớp nhầm cả đoạn chữ NẰM GIỮA hai công thức
    // ("$17$ cm và chiều cao $6$") và xoá mất dấu cách → "17cm và chiều cao6".
    processedContent = processedContent.replace(/\$([^$]*)\$/g, (_match, inner: string) => `$${inner.trim()}$`);

    return processedContent;
};

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className }) => {
    const processedContent = prepareMathContent(content);

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
