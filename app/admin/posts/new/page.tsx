import { connectToDatabase } from "@/lib/db/mongodb";
import { Category } from "@/models/Category";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await connectToDatabase();
  const categoriesRaw = await Category.find().sort({ name: 1 }).lean();

  const categories = categoriesRaw.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
  }));

  return <PostEditor categories={categories} />;
}
