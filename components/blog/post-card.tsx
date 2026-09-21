import * as React from "react";
import Link from "next/link";
import { Clock, Eye, Heart, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export interface PostCardProps {
  post: {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage?: string;
    readingTime: number;
    views: number;
    likes: number;
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

export function PostCard({ post }: PostCardProps) {
  const fallbackImage =
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80";

  return (
    <Card className="group flex flex-col overflow-hidden border border-border/70 hover:border-primary/40 bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-2xl">
      {/* Cover Image Container */}
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/9] w-full overflow-hidden bg-muted"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.coverImage || fallbackImage}
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {post.category && (
          <div className="absolute top-3.5 left-3.5">
            <span
              className="inline-block px-3 py-1 text-xs font-semibold rounded-full shadow-md backdrop-blur-md text-white border border-white/20"
              style={{
                backgroundColor: post.category.color || "#6366f1",
              }}
            >
              {post.category.name}
            </span>
          </div>
        )}
      </Link>

      {/* Content Container */}
      <div className="flex flex-1 flex-col p-5 sm:p-6 justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.publishedAt)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} min read
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        {/* Footer: Author & Engagement */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {post.author?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="h-7 w-7 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {post.author?.name?.charAt(0) || "A"}
              </div>
            )}
            <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
              {post.author?.name || "Lumina Writer"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" title="Views">
              <Eye className="h-3.5 w-3.5" />
              {post.views || 0}
            </span>
            <span className="flex items-center gap-1" title="Likes">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
              {post.likes || 0}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
