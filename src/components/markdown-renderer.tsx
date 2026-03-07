"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownProps {
  content: string;
  imageBasePath?: string;
}

// Claude/Perplexity-style prose components
const markdownComponents: Components = {
  // Headings — Inter Tight, tighter tracking, no extra top margin
  h1: ({ children }) => (
    <h1 className="font-display text-xl font-700 tracking-tight leading-snug mt-5 mb-2 text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-lg font-600 tracking-tight leading-snug mt-4 mb-1.5 text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display text-base font-600 tracking-tight leading-snug mt-3 mb-1 text-foreground">
      {children}
    </h3>
  ),

  // Paragraphs — generous line-height, slightly muted
  p: ({ children }) => (
    <p className="text-[0.9375rem] leading-[1.72] tracking-[-0.008em] text-foreground/90 my-2 first:mt-0 last:mb-0">
      {children}
    </p>
  ),

  // Strong — slightly tighter letter-spacing for emphasis
  strong: ({ children }) => (
    <strong className="font-semibold tracking-[-0.01em] text-foreground">
      {children}
    </strong>
  ),

  // Lists — comfortable indentation, relaxed line-height
  ul: ({ children }) => (
    <ul className="my-2.5 ml-5 space-y-1 list-disc marker:text-muted-foreground/60">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2.5 ml-5 space-y-1 list-decimal marker:text-muted-foreground/60 marker:font-medium">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[0.9375rem] leading-[1.65] tracking-[-0.008em] text-foreground/90 pl-0.5">
      {children}
    </li>
  ),

  // Blockquote — subtle left-bar accent like Perplexity
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/30 pl-4 py-0.5 my-3 text-muted-foreground italic text-[0.9rem] leading-relaxed">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => <hr className="border-border my-4" />,

  // Pre / code blocks — JetBrains Mono
  pre: ({ children, ...props }) => (
    <pre
      {...props}
      className="bg-muted rounded-lg border border-border px-4 py-3 my-3 overflow-x-auto text-[0.8125rem] leading-relaxed font-mono"
      style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
      }}
    >
      {children}
    </pre>
  ),

  // Inline code
  code: ({ className, children, ...props }) => {
    const hasLang = className?.includes("language-");
    const isBlock =
      hasLang ||
      (typeof children === "string" && children.includes("\n"));
    if (isBlock) {
      return (
        <code className={`${className || ""} font-mono text-[0.8125rem]`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-muted/80 border border-border/60 px-1.5 py-0.5 rounded-md text-[0.8125rem] font-mono tracking-tight"
        {...props}
      >
        {children}
      </code>
    );
  },

  // Images
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || ""}
      loading="lazy"
      className="rounded-xl shadow-sm max-w-full h-auto my-4 border border-border/50"
    />
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 underline underline-offset-2 decoration-blue-400/40 hover:decoration-blue-500 transition-colors break-all"
    >
      {children}
    </a>
  ),

  // Tables
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-border">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left py-2 px-3 font-semibold text-foreground text-[0.8125rem] tracking-tight">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="py-2 px-3 text-foreground/85 text-[0.875rem] border-b border-border/40">
      {children}
    </td>
  ),
};

export function Markdown({ content, imageBasePath }: MarkdownProps) {
  let processed = content;
  if (imageBasePath) {
    processed = processed.replace(
      /!\[image\]\(images\//g,
      `![image](${imageBasePath}/images/`
    );
  }

  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}

