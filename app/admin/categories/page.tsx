import { connectToDatabase } from "@/lib/db/mongodb";
import { Category } from "@/models/Category";
import { Post } from "@/models/Post";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await connectToDatabase();

  const categoriesRaw = await Category.find().sort({ name: 1 }).lean();

  const categoriesWithCount = await Promise.all(
    categoriesRaw.map(async (cat: any) => {
      const postCount = await Post.countDocuments({ category: cat._id });
      return {
        _id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        color: cat.color || "#6366f1",
        postCount,
      };
    })
  );

  return <CategoriesManager initialCategories={categoriesWithCount} />;
}
