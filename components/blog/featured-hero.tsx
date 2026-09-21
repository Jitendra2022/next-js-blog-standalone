import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Clock, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export interface FeaturedHeroProps {
  post: {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage?: string;
    readingTime: number;
    views: number;
    publishedAt?: string | Date;
    author?: {
      name: string;
      avatar?: string;
    };
    category?: {
      name: string;
      slug: string;
      color?: string;
    };
    tags?: string[];
  };
}

export function FeaturedHero({ post }: FeaturedHeroProps) {
  const fallbackImage =
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card to-card/50 shadow-2xl p-6 sm:p-8 lg:p-10 mb-12">
      {/* Subtle Background Glow */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Text Column */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              Featured Story
            </span>
            {post.category && (
              <span
                className="px-3 py-1 rounded-full text-xs font-medium text-white shadow-xs"
                style={{ backgroundColor: post.category.color || "#6366f1" }}
              >
                {post.category.name}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15] hover:text-primary transition-colors">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>

          {/* Author & Meta */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2.5">
              {post.author?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="h-8 w-8 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                  {post.author?.name?.charAt(0) || "A"}
                </div>
              )}
              <span className="font-semibold text-foreground">
                {post.author?.name || "Lumina Team"}
              </span>
            </div>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(post.publishedAt)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readingTime} min read
            </span>
          </div>

          {/* CTA Action */}
          <div className="pt-2">
            <Link href={`/blog/${post.slug}`}>
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 font-semibold">
                Read Article
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Image Column */}
        <div className="lg:col-span-5">
          <Link
            href={`/blog/${post.slug}`}
            className="block relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-2xl border border-border/70 group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage || fallbackImage}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          </Link>
        </div>
      </div>
    </div>
  );
}
