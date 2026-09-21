"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Category } from "@/models/Category";
import { Post } from "@/models/Post";
import { getCurrentUser } from "@/lib/auth/session";
import { categorySchema, CategoryInput } from "@/lib/validations/category";

export interface ActionResult<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function createCategoryAction(input: CategoryInput): Promise<ActionResult<{ id: string; name: string; slug: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "author")) {
      return { success: false, error: "Unauthorized. Admin or Author role required." };
    }

    const validated = categorySchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectToDatabase();

    const existing = await Category.findOne({ slug: validated.data.slug });
    if (existing) {
      return { success: false, error: "A category with this slug already exists." };
    }

    const category: any = await Category.create({
      name: validated.data.name,
      slug: validated.data.slug,
      description: validated.data.description,
      color: validated.data.color || "#6366f1",
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/posts/new");
    revalidatePath("/blog");

    return {
      success: true,
      data: {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
      },
    };
  } catch (error: unknown) {
    console.error("Create category error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create category.";
    return { success: false, error: msg };
  }
}

export async function updateCategoryAction(
  id: string,
  input: CategoryInput
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "author")) {
      return { success: false, error: "Unauthorized." };
    }

    const validated = categorySchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectToDatabase();

    const existing = await Category.findOne({ slug: validated.data.slug, _id: { $ne: id } });
    if (existing) {
      return { success: false, error: "A category with this slug already exists." };
    }

    await Category.findByIdAndUpdate(id, {
      name: validated.data.name,
      slug: validated.data.slug,
      description: validated.data.description,
      color: validated.data.color,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/blog");

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update category.";
    return { success: false, error: msg };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Only administrators can delete categories." };
    }

    await connectToDatabase();

    // Check if posts are attached
    const attachedPosts = await Post.countDocuments({ category: id });
    if (attachedPosts > 0) {
      return {
        success: false,
        error: `Cannot delete: ${attachedPosts} post(s) are assigned to this category. Reassign them first.`,
      };
    }

    await Category.findByIdAndDelete(id);

    revalidatePath("/admin/categories");
    revalidatePath("/blog");

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete category.";
    return { success: false, error: msg };
  }
}
