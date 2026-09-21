import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Calendar, Clock, Eye, Sparkles } from "lucide-react";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post } from "@/models/Post";
import { Comment } from "@/models/Comment";
import { getCurrentUser } from "@/lib/auth/session";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { PostActions } from "@/components/blog/post-actions";
import { CommentSection } from "@/components/blog/comment-section";
import { AuthorCard } from "@/components/blog/author-card";
import { PostCard } from "@/components/blog/post-card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  await connectToDatabase();
  const { slug } = await params;
  const post = await Post.findOne({ slug }).lean();

  if (!post) {
    return {
      title: "Article Not Found | Lumina Blog",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
      type: "article",
      publishedTime: post.publishedAt?.toISOString?.(),
    },
  };
}

export default async function SinglePostPage({ params }: PostPageProps) {
  await connectToDatabase();
  const { slug } = await params;
  const currentUser = await getCurrentUser();

  // Find post and increment view count atomically
  const postRaw = await Post.findOneAndUpdate(
    { slug },
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("author", "name email avatar bio socialLinks")
    .populate("category", "name slug color")
    .lean();

  if (!postRaw) {
    notFound();
  }

  // Fetch approved comments
  const commentsRaw = await Comment.find({
    post: postRaw._id,
    status: "approved",
  })
    .sort({ createdAt: -1 })
    .lean();

  // Fetch 3 related posts from same category
  const relatedPostsRaw = await Post.find({
    category: (postRaw.category as any)?._id,
    _id: { $ne: postRaw._id },
    status: "published",
  })
    .populate("author", "name avatar")
    .populate("category", "name slug color")
    .limit(3)
    .lean();

  // Plain object serialization
  const post = {
    _id: postRaw._id.toString(),
    title: postRaw.title,
    slug: postRaw.slug,
    excerpt: postRaw.excerpt,
    content: postRaw.content,
    coverImage: postRaw.coverImage,
    readingTime: postRaw.readingTime || 1,
    views: postRaw.views || 0,
    likes: postRaw.likes || 0,
    publishedAt: postRaw.publishedAt?.toISOString?.() || postRaw.createdAt?.toISOString?.(),
    tags: postRaw.tags || [],
    author: postRaw.author
      ? {
          _id: (postRaw.author as any)._id?.toString?.(),
          name: (postRaw.author as any).name || "Lumina Author",
          avatar: (postRaw.author as any).avatar || "",
          bio: (postRaw.author as any).bio || "",
          socialLinks: (postRaw.author as any).socialLinks,
        }
      : {
          name: "Lumina Author",
          avatar: "",
          bio: "",
        },
    category: postRaw.category
      ? {
          _id: (postRaw.category as any)._id?.toString?.(),
          name: (postRaw.category as any).name,
          slug: (postRaw.category as any).slug,
          color: (postRaw.category as any).color,
        }
      : undefined,
  };

  const comments = commentsRaw.map((c: any) => ({
    _id: c._id.toString(),
    authorName: c.authorName,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    likes: c.likes || 0,
  }));

  const relatedPosts = relatedPostsRaw.map((rp: any) => ({
    _id: rp._id.toString(),
    title: rp.title,
    slug: rp.slug,
    excerpt: rp.excerpt,
    coverImage: rp.coverImage,
    readingTime: rp.readingTime || 1,
    views: rp.views || 0,
    likes: rp.likes || 0,
    publishedAt: rp.publishedAt?.toISOString?.() || rp.createdAt?.toISOString?.(),
    author: rp.author ? { name: rp.author.name, avatar: rp.author.avatar } : undefined,
    category: rp.category ? { name: rp.category.name, slug: rp.category.slug, color: rp.category.color } : undefined,
    tags: rp.tags || [],
  }));

  const fallbackImage =
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80";

  return (
    <div className="flex flex-col min-h-screen">
      <ReadingProgress />
      <Navbar currentUser={currentUser} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-xs text-muted-foreground mb-8 overflow-x-auto">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/blog" className="hover:text-foreground">
            Articles
          </Link>
          {post.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link
                href={`/blog?category=${post.category.slug}`}
                className="hover:text-foreground"
              >
                {post.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">
            {post.title}
          </span>
        </nav>

        {/* Post Header */}
        <article className="space-y-6 max-w-4xl mx-auto mb-10">
          <div className="space-y-4">
            {post.category && (
              <Link
                href={`/blog?category=${post.category.slug}`}
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white shadow-xs"
                style={{ backgroundColor: post.category.color || "#6366f1" }}
              >
                {post.category.name}
              </Link>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              {post.title}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-normal">
              {post.excerpt}
            </p>
          </div>

          {/* Author & Meta Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border/60 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              {post.author.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="h-10 w-10 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                  {post.author.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground">{post.author.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(post.publishedAt)}</span>
                  <span>•</span>
                  <span>{post.readingTime} min read</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5" title="Views">
                <Eye className="h-4 w-4" />
                {post.views} views
              </span>
            </div>
          </div>
        </article>

        {/* Hero Cover Image */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="relative aspect-[16/9] w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-border/80 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage || fallbackImage}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
          {/* Main Article Body */}
          <div className="lg:col-span-8 space-y-8">
            <MarkdownContent content={post.content} />

            {/* Tag Pills */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-6">
                <span className="text-xs font-semibold text-muted-foreground">Tags:</span>
                {post.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground hover:bg-accent border border-border/60 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Like and Share Actions */}
            <PostActions
              postId={post._id}
              initialLikes={post.likes}
              title={post.title}
              slug={post.slug}
            />

            {/* Author Profile Card */}
            <AuthorCard author={post.author} />

            {/* Comments Thread */}
            <CommentSection postId={post._id} initialComments={comments} />
          </div>

          {/* Sticky Sidebar: TOC */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <TableOfContents content={post.content} />

              {/* Newsletter Callout in Sidebar */}
              <div className="p-6 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs space-y-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" /> Stay Informed
                </span>
                <h4 className="text-base font-bold text-foreground">
                  Enjoying this article?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Subscribe to receive our latest engineering breakthroughs directly.
                </p>
                <Link href="#footer" className="block pt-1">
                  <span className="text-xs font-semibold text-primary hover:underline">
                    Join readers at the footer ↓
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-border/70 max-w-5xl mx-auto space-y-6">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              Related Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rp) => (
                <PostCard key={rp._id} post={rp} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
