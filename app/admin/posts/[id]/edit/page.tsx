import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post } from "@/models/Post";
import { Category } from "@/models/Category";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  await connectToDatabase();
  const { id } = await params;

  const postRaw = await Post.findById(id).lean();
  if (!postRaw) {
    notFound();
  }

  const categoriesRaw = await Category.find().sort({ name: 1 }).lean();
  const categories = categoriesRaw.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
  }));

  const initialData = {
    _id: postRaw._id.toString(),
    title: postRaw.title,
    slug: postRaw.slug,
    excerpt: postRaw.excerpt,
    content: postRaw.content,
    coverImage: postRaw.coverImage || "",
    categoryId: (postRaw.category as any)?.toString() || "",
    tags: postRaw.tags || [],
    status: postRaw.status,
    isFeatured: postRaw.isFeatured || false,
  };

  return <PostEditor categories={categories} initialData={initialData} />;
}
