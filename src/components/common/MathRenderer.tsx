import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathRendererProps {
    content?: string | null;
    className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className }) => {
    const isRawLatex = (str: string) => {
        const trimmed = (str || '').trim();
        if (!trimmed) return false;
        // Check if already wrapped
        if (trimmed.startsWith('$') || trimmed.startsWith('\\(') || trimmed.startsWith('\\[')) return false;
        // If it contains a backslash, it's likely LaTeX from MathLive
        return /\\/.test(trimmed);
    };

    // Normalize content to avoid runtime errors
    const safeContent = typeof content === 'string'
        ? content
        : content == null
            ? ''
            : String(content);

    // Wrap raw LaTeX in single $ for inline rendering by KaTeX
    const processedContent = isRawLatex(safeContent) ? `$${safeContent.trim()}$` : safeContent;

    return (
        <div className={`math-renderer inline-block align-middle ${className || ''}`}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};
