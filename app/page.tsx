import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, Layers, Zap, ShieldCheck } from "lucide-react";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post } from "@/models/Post";
import { Category } from "@/models/Category";
import { seedDatabase } from "@/lib/db/seed";
import { getCurrentUser } from "@/lib/auth/session";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/blog/post-card";
import { FeaturedHero } from "@/components/blog/featured-hero";
import { CategoryPill } from "@/components/blog/category-pill";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await connectToDatabase();

  // Auto-seed demo data if database is empty on first run
  const postCount = await Post.countDocuments();
  if (postCount === 0) {
    try {
      await seedDatabase();
    } catch (err) {
      console.warn("Auto-seed error on initial load:", err);
    }
  }

  const currentUser = await getCurrentUser();

  // Fetch featured post
  const featuredPostRaw = await Post.findOne({ status: "published", isFeatured: true })
    .populate("author", "name avatar bio")
    .populate("category", "name slug color")
    .sort({ publishedAt: -1 })
    .lean();

  // Fetch latest published posts
  const recentPostsRaw = await Post.find({
    status: "published",
    ...(featuredPostRaw ? { _id: { $ne: featuredPostRaw._id } } : {}),
  })
    .populate("author", "name avatar")
    .populate("category", "name slug color")
    .sort({ publishedAt: -1 })
    .limit(6)
    .lean();

  // Fetch categories with post count
  const categoriesRaw = await Category.find().lean();
  const categoriesWithCounts = await Promise.all(
    categoriesRaw.map(async (cat) => {
      const count = await Post.countDocuments({
        category: cat._id,
        status: "published",
      });
      return {
        _id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
        count,
      };
    })
  );

  // Serialize Mongoose docs to plain objects
  const serializePost = (post: any) => {
    if (!post) return null;
    return {
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
            name: post.author.name || "Lumina Team",
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
    };
  };

  const featuredPost = serializePost(featuredPostRaw);
  const recentPosts = recentPostsRaw
    .map(serializePost)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar currentUser={currentUser} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        {/* Hero Introduction Banner */}
        <section className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shadow-xs animate-in fade-in slide-in-from-top-3 duration-500">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Production-Grade Architecture & Engineering</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
            Insights for Modern{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Full-Stack Builders
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Deep-dives into React 19, Next.js App Router, AWS cloud systems, and scalable full-stack engineering. Built with passion and production precision.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/blog">
              <Button size="lg" className="gap-2 font-semibold shadow-md shadow-primary/20">
                Explore Articles
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="font-semibold">
                Admin / Author Portal
              </Button>
            </Link>
          </div>
        </section>

        {/* Featured Story Hero */}
        {featuredPost && <FeaturedHero post={featuredPost} />}

        {/* Category Pills Filter Bar */}
        <section className="my-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Browse Topics
            </h2>
            <Link
              href="/blog"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            <CategoryPill name="All Articles" slug="all" isActive={true} />
            {categoriesWithCounts.map((cat) => (
              <CategoryPill
                key={cat._id}
                name={cat.name}
                slug={cat.slug}
                color={cat.color}
                count={cat.count}
              />
            ))}
          </div>
        </section>

        {/* Latest Articles Grid */}
        <section className="my-12 space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Latest Publications
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Handcrafted tutorials, architectural guides, and system designs.
              </p>
            </div>
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                <span>View archive</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-semibold">No published posts found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Log in to the Admin Portal to draft your first publication!
              </p>
              <div className="mt-4">
                <Link href="/login">
                  <Button size="sm">Go to Portal</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {recentPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* Highlight Architecture Cards */}
        <section className="my-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground">Edge & RSC Performance</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Zero-bundle client footprint using React 19 Server Components, streaming Suspense, and instant Server Actions.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground">AWS S3 Cloud Storage</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Production-ready media asset pipeline with presigned uploads, secure IAM authentication, and local fallback storage.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground">Stateless JWT Security</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bcryptjs password hashing, Jose cryptographic token signing, and tamper-proof httpOnly cookie session protection.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
