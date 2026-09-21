"use client";

import * as React from "react";
import { slugify } from "@/lib/utils";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ content }: { content: string }) {
  const [headings, setHeadings] = React.useState<TocItem[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    const lines = content.split("\n");
    const items: TocItem[] = [];

    for (const line of lines) {
      if (line.startsWith("## ")) {
        const text = line.replace("## ", "").trim();
        items.push({ id: slugify(text), text, level: 2 });
      } else if (line.startsWith("### ")) {
        const text = line.replace("### ", "").trim();
        items.push({ id: slugify(text), text, level: 3 });
      }
    }

    setHeadings(items);
  }, [content]);

  React.useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -60% 0%" }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
        <List className="h-4 w-4 text-primary" />
        Table of Contents
      </div>
      <ul className="space-y-2 text-sm">
        {headings.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? "pl-4 text-xs" : "font-medium"}
          >
            <a
              href={`#${item.id}`}
              className={`block transition-colors hover:text-primary ${
                activeId === item.id
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
