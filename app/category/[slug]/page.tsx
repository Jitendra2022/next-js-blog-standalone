import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, BookOpen } from "lucide-react";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Category } from "@/models/Category";
import { Post } from "@/models/Post";
import { getCurrentUser } from "@/lib/auth/session";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/blog/post-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryArchivePage({ params }: CategoryPageProps) {
  await connectToDatabase();
  const { slug } = await params;
  const currentUser = await getCurrentUser();

  const category = await Category.findOne({ slug }).lean();
  if (!category) {
    notFound();
  }

  const postsRaw = await Post.find({
    category: category._id,
    status: "published",
  })
    .populate("author", "name avatar")
    .sort({ publishedAt: -1 })
    .lean();

  const posts = postsRaw.map((post: any) => ({
    _id: post._id.toString(),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    readingTime: post.readingTime || 1,
    views: post.views || 0,
    likes: post.likes || 0,
    publishedAt: post.publishedAt?.toISOString?.() || post.createdAt?.toISOString?.(),
    author: post.author
      ? {
          name: post.author.name || "Lumina Writer",
          avatar: post.author.avatar || "",
        }
      : undefined,
    category: {
      name: category.name,
      slug: category.slug,
      color: category.color,
    },
    tags: post.tags || [],
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar currentUser={currentUser} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/blog" className="hover:text-foreground">
            Articles
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{category.name}</span>
        </nav>

        {/* Category Header Banner */}
        <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card to-card/50 p-8 sm:p-10 mb-10 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <span
              className="h-4 w-4 rounded-full shadow-sm"
              style={{ backgroundColor: category.color || "#6366f1" }}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Category Hub
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            {category.name}
          </h1>

          <p className="text-muted-foreground text-base max-w-2xl leading-relaxed">
            {category.description ||
              `Articles, deep-dives, and tutorials focused on ${category.name}.`}
          </p>

          <p className="text-xs text-muted-foreground pt-1">
            <strong>{posts.length}</strong> {posts.length === 1 ? "article" : "articles"} published in this category
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-border bg-card/50">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-bold">No articles published in this category yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Check back soon for new publications!
            </p>
            <div className="mt-5">
              <Link href="/blog">
                <Button size="sm" variant="outline">
                  Browse Other Topics
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
