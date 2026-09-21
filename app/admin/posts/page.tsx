import { connectToDatabase } from "@/lib/db/mongodb";
import { Post } from "@/models/Post";
import { Category } from "@/models/Category";
import { PostsTable } from "@/components/admin/posts-table";

export const dynamic = "force-dynamic";

export default async function AdminPostsListPage() {
  await connectToDatabase();

  const postsRaw = await Post.find()
    .populate("category", "name color")
    .populate("author", "name")
    .sort({ createdAt: -1 })
    .lean();

  const categoriesRaw = await Category.find().sort({ name: 1 }).lean();

  const posts = postsRaw.map((p: any) => ({
    _id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    coverImage: p.coverImage || "",
    status: p.status,
    isFeatured: p.isFeatured || false,
    views: p.views || 0,
    likes: p.likes || 0,
    createdAt: p.createdAt?.toISOString?.(),
    category: p.category
      ? {
          _id: p.category._id.toString(),
          name: p.category.name,
          color: p.category.color,
        }
      : undefined,
    author: p.author ? { name: p.author.name } : undefined,
  }));

  const categories = categoriesRaw.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Articles & Publications
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage, publish, edit, or archive your technical articles.
        </p>
      </div>

      <PostsTable posts={posts} categories={categories} />
    </div>
  );
}
