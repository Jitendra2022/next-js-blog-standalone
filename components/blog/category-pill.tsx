import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryPillProps {
  name: string;
  slug: string;
  color?: string;
  isActive?: boolean;
  count?: number;
}

export function CategoryPill({
  name,
  slug,
  color,
  isActive = false,
  count,
}: CategoryPillProps) {
  return (
    <Link
      href={slug === "all" ? "/blog" : `/blog?category=${slug}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 border cursor-pointer select-none",
        isActive
          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 scale-105"
          : "bg-card/70 text-muted-foreground border-border/80 hover:border-primary/40 hover:text-foreground hover:bg-accent"
      )}
    >
      {color && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span>{name}</span>
      {count !== undefined && (
        <span className="opacity-60 text-[10px]">({count})</span>
      )}
    </Link>
  );
}
