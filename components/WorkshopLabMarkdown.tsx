import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  h1: () => null,
  h2: () => null,
  h3: ({ children }) => <h3 className="section-title mt-6 first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="leading-relaxed text-[var(--muted)]">{children}</p>,
  ul: ({ children }) => <ul className="list-disc space-y-1.5 pl-5 text-[var(--muted)]">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-2 pl-5 text-[var(--muted)]">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-[var(--accent)] underline"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-[var(--text)]">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[var(--accent)] bg-[#100d0a] px-4 py-3 text-[var(--text)]">{children}</blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return <code className="block whitespace-pre-wrap font-mono text-xs text-[var(--text)]">{children}</code>;
    }
    return <code className="font-mono text-[0.9em] text-[var(--text)]">{children}</code>;
  },
  pre: ({ children }) => <pre className="mt-3 overflow-auto bg-[#100d0a] p-4 text-xs">{children}</pre>,
  table: ({ children }) => (
    <div className="mt-3 overflow-auto">
      <table className="data-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td>{children}</td>,
};

export function WorkshopLabMarkdown({ source }: { source: string }) {
  if (!source.trim()) return null;

  return (
    <div className="workshop-doc space-y-4 text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
