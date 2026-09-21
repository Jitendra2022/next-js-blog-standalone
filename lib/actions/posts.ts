"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Post } from "@/models/Post";
import { Comment } from "@/models/Comment";
import { getCurrentUser } from "@/lib/auth/session";
import { postSchema, PostInput } from "@/lib/validations/post";
import { estimateReadingTime } from "@/lib/utils";
import mongoose from "mongoose";

export interface ActionResult<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function createPostAction(input: PostInput): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "author")) {
      return { success: false, error: "Unauthorized. Admin or Author role required." };
    }

    const validated = postSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectToDatabase();

    // Check slug uniqueness
    const existingSlug = await Post.findOne({ slug: validated.data.slug });
    if (existingSlug) {
      return { success: false, error: "A post with this slug already exists. Please choose a different title or slug." };
    }

    const readingTime = estimateReadingTime(validated.data.content);
    const publishedAt = validated.data.status === "published" ? new Date() : undefined;

    const post: any = await Post.create({
      title: validated.data.title,
      slug: validated.data.slug,
      excerpt: validated.data.excerpt,
      content: validated.data.content,
      coverImage: validated.data.coverImage || "",
      author: new mongoose.Types.ObjectId(user.userId),
      category: new mongoose.Types.ObjectId(validated.data.categoryId),
      tags: validated.data.tags,
      status: validated.data.status,
      isFeatured: validated.data.isFeatured,
      readingTime,
      publishedAt,
    });

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/posts");

    return {
      success: true,
      data: {
        id: post._id.toString(),
        slug: post.slug,
      },
    };
  } catch (error: unknown) {
    console.error("Create post error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create post.";
    return { success: false, error: msg };
  }
}

export async function updatePostAction(id: string, input: PostInput): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "author")) {
      return { success: false, error: "Unauthorized. Admin or Author role required." };
    }

    const validated = postSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectToDatabase();

    const post = await Post.findById(id);
    if (!post) {
      return { success: false, error: "Post not found." };
    }

    // Role check: Author can only edit their own post
    if (user.role === "author" && post.author.toString() !== user.userId) {
      return { success: false, error: "You are only authorized to edit your own posts." };
    }

    // Check slug uniqueness if changed
    if (post.slug !== validated.data.slug) {
      const slugCheck = await Post.findOne({ slug: validated.data.slug, _id: { $ne: id } });
      if (slugCheck) {
        return { success: false, error: "A post with this slug already exists." };
      }
    }

    const readingTime = estimateReadingTime(validated.data.content);
    let publishedAt = post.publishedAt;
    if (validated.data.status === "published" && !publishedAt) {
      publishedAt = new Date();
    }

    post.title = validated.data.title;
    post.slug = validated.data.slug;
    post.excerpt = validated.data.excerpt;
    post.content = validated.data.content;
    post.coverImage = validated.data.coverImage || "";
    post.category = new mongoose.Types.ObjectId(validated.data.categoryId);
    post.tags = validated.data.tags;
    post.status = validated.data.status;
    post.isFeatured = validated.data.isFeatured;
    post.readingTime = readingTime;
    post.publishedAt = publishedAt;

    await post.save();

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/posts");

    return {
      success: true,
      data: {
        id: post._id.toString(),
        slug: post.slug,
      },
    };
  } catch (error: unknown) {
    console.error("Update post error:", error);
    const msg = error instanceof Error ? error.message : "Failed to update post.";
    return { success: false, error: msg };
  }
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "author")) {
      return { success: false, error: "Unauthorized. Admin or Author role required." };
    }

    await connectToDatabase();

    const post = await Post.findById(id);
    if (!post) {
      return { success: false, error: "Post not found." };
    }

    if (user.role === "author" && post.author.toString() !== user.userId) {
      return { success: false, error: "You are only authorized to delete your own posts." };
    }

    const postSlug = post.slug;
    await Post.findByIdAndDelete(id);
    await Comment.deleteMany({ post: id });

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${postSlug}`);
    revalidatePath("/admin/posts");

    return { success: true };
  } catch (error: unknown) {
    console.error("Delete post error:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete post.";
    return { success: false, error: msg };
  }
}

export async function togglePublishAction(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "author")) {
      return { success: false, error: "Unauthorized." };
    }

    await connectToDatabase();

    const post = await Post.findById(id);
    if (!post) {
      return { success: false, error: "Post not found." };
    }

    if (user.role === "author" && post.author.toString() !== user.userId) {
      return { success: false, error: "Permission denied." };
    }

    if (post.status === "published") {
      post.status = "draft";
    } else {
      post.status = "published";
      if (!post.publishedAt) {
        post.publishedAt = new Date();
      }
    }

    await post.save();

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/posts");

    return { success: true, data: { status: post.status } };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update post status.";
    return { success: false, error: msg };
  }
}

export async function likePostAction(id: string): Promise<ActionResult> {
  try {
    await connectToDatabase();
    const updated = await Post.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true, select: "likes" }
    );
    if (!updated) {
      return { success: false, error: "Post not found." };
    }
    return { success: true, data: { likes: updated.likes } };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to like post.";
    return { success: false, error: msg };
  }
}

export async function incrementViewAction(slug: string): Promise<ActionResult> {
  try {
    await connectToDatabase();
    await Post.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } }
    );
    return { success: true };
  } catch {
    return { success: false };
  }
}
