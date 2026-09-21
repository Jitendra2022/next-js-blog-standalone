import Link from "next/link";
import { Search, Filter, BookOpen, X } from "lucide-react";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post } from "@/models/Post";
import { Category } from "@/models/Category";
import { getCurrentUser } from "@/lib/auth/session";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/blog/post-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface BlogPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tag?: string;
    sort?: string;
  }>;
}

export default async function BlogArchivePage({ searchParams }: BlogPageProps) {
  await connectToDatabase();
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  const query = params.q || "";
  const selectedCategorySlug = params.category || "";
  const selectedTag = params.tag || "";
  const sortBy = params.sort || "newest";

  // Build Mongo query filter
  const filter: any = { status: "published" };

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { excerpt: { $regex: query, $options: "i" } },
      { tags: { $regex: query, $options: "i" } },
    ];
  }

  if (selectedCategorySlug && selectedCategorySlug !== "all") {
    const categoryDoc = await Category.findOne({ slug: selectedCategorySlug });
    if (categoryDoc) {
      filter.category = categoryDoc._id;
    }
  }

  if (selectedTag) {
    filter.tags = selectedTag;
  }

  // Sort order
  let sortOption: any = { publishedAt: -1 };
  if (sortBy === "popular") {
    sortOption = { views: -1, publishedAt: -1 };
  } else if (sortBy === "likes") {
    sortOption = { likes: -1, publishedAt: -1 };
  }

  // Fetch posts & categories
  const postsRaw = await Post.find(filter)
    .populate("author", "name avatar")
    .populate("category", "name slug color")
    .sort(sortOption)
    .lean();

  const categories = await Category.find().lean();

  // Serialization
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
    category: post.category
      ? {
          name: post.category.name,
          slug: post.category.slug,
          color: post.category.color,
        }
      : undefined,
    tags: post.tags || [],
  }));

  const hasActiveFilters = Boolean(query || (selectedCategorySlug && selectedCategorySlug !== "all") || selectedTag);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar currentUser={currentUser} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            All Publications
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Browse our complete collection of technical guides, engineering architectures, and tutorials.
          </p>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 mb-8 shadow-sm space-y-4">
          <form method="GET" action="/blog" className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search articles by title, keywords, or topics..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Category Select */}
            <div className="md:col-span-3">
              <select
                name="category"
                defaultValue={selectedCategorySlug || "all"}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat._id.toString()} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="md:col-span-2">
              <select
                name="sort"
                defaultValue={sortBy}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Viewed</option>
                <option value="likes">Most Liked</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-1">
              <Button type="submit" size="default" className="w-full">
                Filter
              </Button>
            </div>
          </form>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
              <span className="text-muted-foreground font-medium">Active filters:</span>
              {query && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground">
                  Keyword: &quot;{query}&quot;
                </span>
              )}
              {selectedCategorySlug && selectedCategorySlug !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/15 text-primary">
                  Category: {selectedCategorySlug}
                </span>
              )}
              {selectedTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground">
                  Tag: #{selectedTag}
                </span>
              )}
              <Link
                href="/blog"
                className="inline-flex items-center gap-1 px-2 py-1 text-rose-500 hover:underline"
              >
                <X className="h-3 w-3" /> Clear all
              </Link>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{posts.length}</strong> {posts.length === 1 ? "article" : "articles"}
          </span>
        </div>

        {/* Post Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-border bg-card/50">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-bold">No articles match your criteria</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Try adjusting your search query or selecting a different category filter.
            </p>
            <div className="mt-5">
              <Link href="/blog">
                <Button variant="outline" size="sm">
                  Clear Filters
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
