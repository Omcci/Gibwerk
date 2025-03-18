import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    return (
        <div className={`prose prose-sm dark:prose-invert max-w-none overflow-hidden ${className}`}>
            <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm]}
                components={{
                    // Custom components for styling
                    h2: ({ node, ...props }) => (
                        <h2 className="text-xl font-bold mb-2 pb-1 border-b text-primary" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-lg font-semibold mb-2 text-primary" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                        <ul className="my-2 pl-6 list-disc" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                        <li className="mb-1" {...props} />
                    ),
                    code: ({ node, ...props }) => (
                        <code className="px-1 py-0.5 rounded bg-muted text-muted-foreground" {...props} />
                    ),
                    // Add styling for emojis
                    p: ({ node, children, ...props }) => {
                        return <p className="mb-4" {...props}>{children}</p>;
                    },
                    // Ensure links open in new tab
                    a: ({ node, href, ...props }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            {...props}
                        />
                    ),
                    // Style spans that have colors
                    span: ({ node, style, ...props }) => (
                        <span style={style} {...props} />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
} 