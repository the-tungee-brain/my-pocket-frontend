import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-6 mb-3 text-xl font-semibold tracking-tight text-foreground">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-4 mb-2 text-lg font-semibold tracking-tight text-foreground">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-3 wrap-break-word text-[15px] leading-relaxed tracking-normal whitespace-pre-wrap text-foreground">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="my-3 ml-5 list-disc space-y-1.5 text-[15px] leading-relaxed tracking-normal text-foreground">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="my-3 ml-5 list-decimal space-y-1.5 text-[15px] leading-relaxed tracking-normal text-foreground">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-accent-strong underline decoration-accent/40 underline-offset-2 hover:text-accent"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-l-2 border-border pl-3 text-sm text-muted italic">
            {children}
          </blockquote>
        ),
        code: (props: any) => {
          const { inline, children, ...rest } = props;
          if (inline) {
            return (
              <code
                {...rest}
                className="rounded bg-muted-bg px-1.5 py-0.5 text-[13px] text-accent-strong"
              >
                {children}
              </code>
            );
          }
          return (
            <pre className="my-3 overflow-x-auto rounded-md bg-muted-bg p-3 text-[13px] leading-relaxed">
              <code {...rest} className="font-mono text-foreground">
                {children}
              </code>
            </pre>
          );
        },
        img: ({ src, alt }) => (
          <img
            src={src ?? ""}
            alt={alt ?? ""}
            className="my-4 max-h-100 w-full rounded-md object-contain"
          />
        ),
        hr: () => <hr className="my-6 border-border" />,

        table: ({ children }) => (
          <div className="my-4 overflow-hidden rounded-2xl border border-border bg-secondary">
            <table className="markdown-table w-full table-fixed text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-surface-elevated/60 text-foreground">
            {children}
          </thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-t border-border hover:bg-muted-bg/40">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 text-left text-[13px] font-semibold text-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-[13px] text-muted">{children}</td>
        ),

        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="text-foreground italic">{children}</em>
        ),
        del: ({ children, ...props }) => <span {...props}>{children}</span>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
