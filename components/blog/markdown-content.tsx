"use client";

import * as React from "react";
import { Check, Copy, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { slugify } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse blocks of markdown
  const renderBlocks = () => {
    if (!content) return null;

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeBuffer: string[] = [];
    let codeBlockCount = 0;
    let listBuffer: string[] = [];
    let isOrderedList = false;

    const flushList = () => {
      if (listBuffer.length > 0) {
        const items = listBuffer.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {renderInline(item)}
          </li>
        ));
        if (isOrderedList) {
          elements.push(
            <ol key={`ol-${elements.length}`} className="my-4 ml-6 list-decimal space-y-1 text-muted-foreground">
              {items}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${elements.length}`} className="my-4 ml-6 list-disc space-y-1 text-muted-foreground">
              {items}
            </ul>
          );
        }
        listBuffer = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.trim().startsWith("```")) {
        if (!inCodeBlock) {
          flushList();
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim();
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          const codeString = codeBuffer.join("\n");
          const currentIndex = codeBlockCount++;
          elements.push(
            <div
              key={`code-${currentIndex}`}
              className="relative my-6 overflow-hidden rounded-xl border border-border/80 bg-zinc-950 text-zinc-100 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-mono text-zinc-400">
                <span>{codeLanguage || "text"}</span>
                <button
                  onClick={() => handleCopyCode(codeString, currentIndex)}
                  className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copiedIndex === currentIndex ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed">
                <code>{codeString}</code>
              </pre>
            </div>
          );
          codeBuffer = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Empty line
      if (!line.trim()) {
        flushList();
        continue;
      }

      // Horizontal Rule
      if (line.trim() === "---" || line.trim() === "***") {
        flushList();
        elements.push(<hr key={`hr-${i}`} className="my-8 border-border/60" />);
        continue;
      }

      // Headings
      if (line.startsWith("# ")) {
        flushList();
        const text = line.slice(2).trim();
        const id = slugify(text);
        elements.push(
          <h1 key={`h1-${i}`} id={id} className="scroll-m-20 text-3xl sm:text-4xl font-extrabold tracking-tight mt-10 mb-4 text-foreground">
            {renderInline(text)}
          </h1>
        );
        continue;
      }
      if (line.startsWith("## ")) {
        flushList();
        const text = line.slice(3).trim();
        const id = slugify(text);
        elements.push(
          <h2 key={`h2-${i}`} id={id} className="scroll-m-20 text-2xl sm:text-3xl font-bold tracking-tight mt-8 mb-3 text-foreground pb-2 border-b border-border/40">
            {renderInline(text)}
          </h2>
        );
        continue;
      }
      if (line.startsWith("### ")) {
        flushList();
        const text = line.slice(4).trim();
        const id = slugify(text);
        elements.push(
          <h3 key={`h3-${i}`} id={id} className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-2 text-foreground">
            {renderInline(text)}
          </h3>
        );
        continue;
      }

      // Blockquotes / Callouts
      if (line.startsWith("> ")) {
        flushList();
        const quoteText = line.slice(2).trim();
        elements.push(
          <blockquote
            key={`quote-${i}`}
            className="my-5 border-l-4 border-primary pl-4 py-1 italic text-muted-foreground bg-accent/20 rounded-r-lg"
          >
            {renderInline(quoteText)}
          </blockquote>
        );
        continue;
      }

      // Lists
      if (line.trim().match(/^[-*]\s+/)) {
        isOrderedList = false;
        listBuffer.push(line.trim().replace(/^[-*]\s+/, ""));
        continue;
      }
      if (line.trim().match(/^\d+\.\s+/)) {
        isOrderedList = true;
        listBuffer.push(line.trim().replace(/^\d+\.\s+/, ""));
        continue;
      }

      // Regular Paragraph
      flushList();
      elements.push(
        <p key={`p-${i}`} className="my-4 text-base sm:text-lg leading-relaxed text-muted-foreground">
          {renderInline(line)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  const renderInline = (text: string): React.ReactNode => {
    // Bold
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="rounded bg-muted px-1.5 py-0.5 text-xs sm:text-sm font-mono font-medium text-primary"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("[") && part.includes("](")) {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          return (
            <a
              key={index}
              href={match[2]}
              target={match[2].startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80 font-medium"
            >
              {match[1]}
            </a>
          );
        }
      }
      return part;
    });
  };

  return <div className="article-content max-w-none">{renderBlocks()}</div>;
}
