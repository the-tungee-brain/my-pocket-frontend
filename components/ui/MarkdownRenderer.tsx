// components/ui/MarkdownRenderer.tsx
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
          <h1 className="mb-4 text-2xl font-semibold tracking-tight">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-6 mb-3 text-xl font-semibold tracking-tight">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-4 mb-2 text-lg font-semibold tracking-tight text-neutral-200">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed tracking-normal text-neutral-100">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="my-3 ml-5 list-disc space-y-1.5 text-[15px] leading-relaxed tracking-normal">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="my-3 ml-5 list-decimal space-y-1.5 text-[15px] leading-relaxed tracking-normal">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 underline decoration-sky-500/60 underline-offset-2 hover:text-sky-300"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-l-2 border-neutral-700 pl-3 text-sm text-neutral-300 italic">
            {children}
          </blockquote>
        ),
        code: (props: any) => {
          const { inline, children, ...rest } = props;
          if (inline) {
            return (
              <code
                {...rest}
                className="rounded bg-neutral-900/60 px-1.5 py-0.5 text-[13px] text-sky-300"
              >
                {children}
              </code>
            );
          }
          return (
            <pre className="my-3 overflow-x-auto rounded-md bg-neutral-900/80 p-3 text-[13px] leading-relaxed">
              <code {...rest} className="font-mono text-neutral-100">
                {children}
              </code>
            </pre>
          );
        },
        img: ({ src, alt }) => (
          <img
            src={src ?? ""}
            alt={alt ?? ""}
            className="my-4 max-h-[400px] w-full rounded-md object-contain"
          />
        ),
        hr: () => <hr className="my-6 border-neutral-800" />,
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-neutral-900/70 text-neutral-100">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-neutral-800/80">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-neutral-900/40">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 align-top text-neutral-200">{children}</td>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-neutral-50">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-neutral-200">{children}</em>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
