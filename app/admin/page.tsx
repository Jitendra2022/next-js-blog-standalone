import Link from "next/link";
import {
  FileText,
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  PenSquare,
  PlusCircle,
  Cloud,
  HardDrive,
  Clock,
} from "lucide-react";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post } from "@/models/Post";
import { Comment } from "@/models/Comment";
import { Category } from "@/models/Category";
import { isS3Configured, AWS_S3_BUCKET_NAME } from "@/lib/s3/client";
import { getCurrentUser } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await connectToDatabase();
  const currentUser = await getCurrentUser();

  // Metrics aggregation
  const totalPosts = await Post.countDocuments();
  const publishedPosts = await Post.countDocuments({ status: "published" });
  const draftPosts = await Post.countDocuments({ status: "draft" });

  const totalCategories = await Category.countDocuments();

  const commentsCount = await Comment.countDocuments();
  const pendingCommentsCount = await Comment.countDocuments({ status: "pending" });

  // Sum total views and likes across all posts
  const metricsAggregation = await Post.aggregate([
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: "$likes" },
      },
    },
  ]);

  const totalViews = metricsAggregation[0]?.totalViews || 0;
  const totalLikes = metricsAggregation[0]?.totalLikes || 0;

  // Recent 5 posts
  const recentPostsRaw = await Post.find()
    .populate("category", "name slug color")
    .populate("author", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentPosts = recentPostsRaw.map((p: any) => ({
    _id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    status: p.status,
    views: p.views || 0,
    likes: p.likes || 0,
    createdAt: p.createdAt?.toISOString?.(),
    category: p.category ? { name: p.category.name, color: p.category.color } : undefined,
    author: p.author ? { name: p.author.name } : undefined,
  }));

  // Recent comments
  const recentCommentsRaw = await Comment.find()
    .populate("post", "title slug")
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();

  const recentComments = recentCommentsRaw.map((c: any) => ({
    _id: c._id.toString(),
    authorName: c.authorName,
    content: c.content,
    status: c.status,
    createdAt: c.createdAt?.toISOString?.(),
    post: c.post ? { title: c.post.title, slug: c.post.slug } : undefined,
  }));

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Welcome back, {currentUser?.name || "Author"}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here is your blog performance overview and editorial activity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/posts/new">
            <Button className="gap-2 shadow-md shadow-primary/20 font-semibold">
              <PenSquare className="h-4 w-4" />
              Write New Story
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Posts */}
        <Card className="p-6 bg-card/60 backdrop-blur-xs border-border/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Articles</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {totalPosts}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-emerald-500 font-semibold">{publishedPosts} Published</span>
            <span>•</span>
            <span>{draftPosts} Drafts</span>
          </div>
        </Card>

        {/* Total Views */}
        <Card className="p-6 bg-card/60 backdrop-blur-xs border-border/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Impressions</span>
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {totalViews.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Across all publications</p>
        </Card>

        {/* Total Reactions */}
        <Card className="p-6 bg-card/60 backdrop-blur-xs border-border/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Reader Engagement</span>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Heart className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {totalLikes.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Likes and claps received</p>
        </Card>

        {/* Total Comments */}
        <Card className="p-6 bg-card/60 backdrop-blur-xs border-border/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Reader Discussions</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {commentsCount}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={pendingCommentsCount > 0 ? "text-amber-500 font-bold" : ""}>
              {pendingCommentsCount} Pending Moderation
            </span>
          </div>
        </Card>
      </div>

      {/* Cloud S3 Storage Info Banner */}
      <div className="p-5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            isS3Configured
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-amber-500/10 text-amber-500"
          }`}>
            {isS3Configured ? <Cloud className="h-5 w-5" /> : <HardDrive className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">
                Media Storage Pipeline: {isS3Configured ? "AWS S3 Active" : "Local Disk Fallback"}
              </h4>
              <Badge variant={isS3Configured ? "success" : "warning"}>
                {isS3Configured ? "Connected" : "Local Mode"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isS3Configured
                ? `Images upload directly to Amazon S3 bucket: ${AWS_S3_BUCKET_NAME}`
                : "No AWS credentials detected. Uploaded images are stored locally in public/uploads/ so your app runs seamlessly."}
            </p>
          </div>
        </div>

        <Link href="/admin/settings">
          <Button variant="outline" size="sm" className="text-xs">
            Storage Settings
          </Button>
        </Link>
      </div>

      {/* Two Column Layout: Recent Posts & Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Posts Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Recent Posts</h3>
            <Link href="/admin/posts" className="text-xs font-semibold text-primary hover:underline">
              View all posts
            </Link>
          </div>

          <Card className="border-border/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Views</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentPosts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                        No articles published yet.
                      </td>
                    </tr>
                  ) : (
                    recentPosts.map((post) => (
                      <tr key={post._id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/posts/${post._id}/edit`}
                            className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1 max-w-xs"
                          >
                            {post.title}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(post.createdAt)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {post.category ? (
                            <span
                              className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
                              style={{ backgroundColor: post.category.color || "#6366f1" }}
                            >
                              {post.category.name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">General</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={post.status === "published" ? "success" : "warning"}>
                            {post.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-xs text-muted-foreground">
                          {post.views}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/admin/posts/${post._id}/edit`}
                            className="text-xs font-semibold text-primary hover:underline mr-3"
                          >
                            Edit
                          </Link>
                          {post.status === "published" && (
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                            >
                              View <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Recent Comments */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Recent Comments</h3>
            <Link href="/admin/comments" className="text-xs font-semibold text-primary hover:underline">
              Moderate
            </Link>
          </div>

          <div className="space-y-3">
            {recentComments.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground text-sm border-border/80">
                No comments submitted yet.
              </Card>
            ) : (
              recentComments.map((comment) => (
                <Card key={comment._id} className="p-4 border-border/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{comment.authorName}</span>
                    <Badge variant={comment.status === "approved" ? "success" : "warning"}>
                      {comment.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                    &quot;{comment.content}&quot;
                  </p>
                  {comment.post && (
                    <p className="text-[11px] text-primary/80 truncate">
                      on: {comment.post.title}
                    </p>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
