'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from '../styles/github-markdown.module.css';

interface GitHubMarkdownProps {
  content: string;
  className?: string;
}

export const GitHubMarkdown: React.FC<GitHubMarkdownProps> = ({ content, className = '' }) => {
  return (
    <div className={`${styles.markdown} ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({children}) => <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-border">{children}</h1>,
          h2: ({children}) => <h2 className="text-xl font-semibold mt-6 mb-4 pb-2 border-b border-border">{children}</h2>,
          h3: ({children}) => <h3 className="text-lg font-semibold mt-4 mb-3">{children}</h3>,
          h4: ({children}) => <h4 className="text-base font-semibold mt-4 mb-2">{children}</h4>,
          h5: ({children}) => <h5 className="text-sm font-semibold mt-3 mb-2">{children}</h5>,
          h6: ({children}) => <h6 className="text-sm font-semibold mt-3 mb-2 text-muted-foreground">{children}</h6>,
          ul: ({children}) => <ul className="list-disc pl-8 my-4 space-y-2">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal pl-8 my-4 space-y-2">{children}</ol>,
          li: ({children}) => <li className="leading-relaxed">{children}</li>,
          p: ({children}) => <p className="my-4 leading-relaxed">{children}</p>,
          blockquote: ({children}) => <blockquote className="border-l-4 border-accent/30 pl-4 my-4 text-muted-foreground italic">{children}</blockquote>,
          code: ({inline, children}) => 
            inline ? (
              <code className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-mono text-sm">{children}</code>
            ) : (
              <code className="block p-4 rounded-lg bg-card-bg border border-border font-mono text-sm overflow-x-auto">{children}</code>
            ),
          pre: ({children}) => <pre className="my-4">{children}</pre>,
          a: ({href, children}) => (
            <a href={href} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({children}) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({children}) => <thead className="bg-card-bg">{children}</thead>,
          th: ({children}) => <th className="border border-border px-4 py-2 text-left font-semibold">{children}</th>,
          td: ({children}) => <td className="border border-border px-4 py-2">{children}</td>,
          tr: ({children}) => <tr className="even:bg-card-bg/50">{children}</tr>,
          hr: () => <hr className="my-6 border-t border-border" />,
          strong: ({children}) => <strong className="font-semibold">{children}</strong>,
          em: ({children}) => <em className="italic">{children}</em>,
          del: ({children}) => <del className="line-through opacity-60">{children}</del>,
          input: (props) => {
            if (props.type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={props.checked}
                  disabled
                  className="mr-2 h-4 w-4 rounded border-gray-300"
                  readOnly
                  aria-label={props.checked ? 'Completed task' : 'Incomplete task'}
                />
              );
            }
            return <input {...props} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};