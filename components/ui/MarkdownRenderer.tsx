import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { enrichReactChildren } from "@/lib/enrichInlineText";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  /** Softer typography for long AI chat / analysis (not structured JSON views). */
  variant?: "default" | "conversational";
}

export function MarkdownRenderer({
  content,
  variant = "default",
}: MarkdownRendererProps) {
  const conversational = variant === "conversational";

  return (
    <div
      className={cn(
        "markdown-content",
        conversational && "conversational-markdown",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              className={cn(
                "mb-3 font-semibold tracking-tight text-foreground",
                conversational ? "text-lg" : "mb-4 text-2xl",
              )}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={cn(
                "font-semibold tracking-tight text-foreground",
                conversational
                  ? "mt-5 mb-2 text-base"
                  : "mt-6 mb-3 text-xl",
              )}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={cn(
                "font-semibold tracking-tight text-foreground",
                conversational
                  ? "mt-4 mb-1.5 text-sm"
                  : "mt-4 mb-2 text-lg",
              )}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p
              className={cn(
                "mb-3 wrap-break-word leading-relaxed tracking-normal whitespace-pre-wrap text-foreground",
                conversational ? "text-[15px] leading-[1.65]" : "text-[15px]",
              )}
            >
              {conversational ? enrichReactChildren(children) : children}
            </p>
          ),
          ul: ({ node: _node, children, ...props }) => (
            <ul
              className={cn(
                "leading-relaxed tracking-normal text-foreground",
                conversational
                  ? "my-2 space-y-1.5 text-[15px] leading-[1.6]"
                  : "text-[15px]",
              )}
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ node: _node, children, ...props }) => (
            <ol
              className={cn(
                "leading-relaxed tracking-normal text-foreground",
                conversational
                  ? "my-2 space-y-1.5 text-[15px] leading-[1.6]"
                  : "text-[15px]",
              )}
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ node: _node, children, ...props }) => (
            <li className="pl-0.5" {...props}>
              {conversational ? enrichReactChildren(children) : children}
            </li>
          ),
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
            <blockquote
              className={cn(
                "my-3 border-l-2 border-accent/30 pl-3 text-[15px] leading-relaxed text-foreground/90",
                !conversational && "text-sm text-muted italic",
              )}
            >
              {children}
            </blockquote>
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: (props: any) => {
            const { inline, children, ...rest } = props;
            if (inline) {
              return (
                <code
                  {...rest}
                  className="bg-muted-bg px-1.5 py-0.5 text-[13px] text-accent-strong"
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="my-3 overflow-x-auto bg-muted-bg p-3 text-[13px] leading-relaxed">
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
              className="my-4 max-h-100 w-full object-contain"
            />
          ),
          hr: () => <hr className="my-5 border-border/70" />,

          table: ({ children }) => (
            <div className="my-4 overflow-x-auto border border-border bg-secondary">
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
            <strong className="font-semibold text-foreground">
              {conversational ? enrichReactChildren(children) : children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="text-foreground italic">{children}</em>
          ),
          del: ({ children, ...props }) => <span {...props}>{children}</span>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
