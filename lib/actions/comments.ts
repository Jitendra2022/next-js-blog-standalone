"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Comment, CommentStatus } from "@/models/Comment";
import { Post } from "@/models/Post";
import { getCurrentUser } from "@/lib/auth/session";
import { commentSchema, CommentInput } from "@/lib/validations/comment";
import mongoose from "mongoose";

export interface ActionResult<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function addCommentAction(input: CommentInput): Promise<ActionResult<{ id: string; authorName: string; content: string; createdAt: Date }>> {
  try {
    const validated = commentSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectToDatabase();

    const post = await Post.findById(validated.data.postId);
    if (!post) {
      return { success: false, error: "Post not found." };
    }

    const currentUser = await getCurrentUser();

    const comment: any = await Comment.create({
      post: new mongoose.Types.ObjectId(validated.data.postId),
      authorName: validated.data.authorName,
      authorEmail: validated.data.authorEmail.toLowerCase(),
      authorUser: currentUser ? new mongoose.Types.ObjectId(currentUser.userId) : undefined,
      content: validated.data.content,
      status: "approved", // Default approved for responsive reader experience
    });

    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/comments");

    return {
      success: true,
      data: {
        id: comment._id.toString(),
        authorName: comment.authorName,
        content: comment.content,
        createdAt: comment.createdAt,
      },
    };
  } catch (error: unknown) {
    console.error("Add comment error:", error);
    const msg = error instanceof Error ? error.message : "Failed to post comment.";
    return { success: false, error: msg };
  }
}

export async function moderateCommentAction(
  id: string,
  status: CommentStatus
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "author")) {
      return { success: false, error: "Unauthorized." };
    }

    await connectToDatabase();

    const comment = await Comment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("post", "slug");

    if (!comment) {
      return { success: false, error: "Comment not found." };
    }

    if (comment.post && typeof comment.post === "object" && "slug" in comment.post) {
      revalidatePath(`/blog/${comment.post.slug}`);
    }
    revalidatePath("/admin/comments");

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to moderate comment.";
    return { success: false, error: msg };
  }
}

export async function deleteCommentAction(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "author")) {
      return { success: false, error: "Unauthorized." };
    }

    await connectToDatabase();

    await Comment.findByIdAndDelete(id);

    revalidatePath("/admin/comments");

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete comment.";
    return { success: false, error: msg };
  }
}

export async function likeCommentAction(id: string): Promise<ActionResult> {
  try {
    await connectToDatabase();
    const comment = await Comment.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true, select: "likes" }
    );
    return { success: true, data: { likes: comment?.likes || 0 } };
  } catch {
    return { success: false, error: "Could not register like" };
  }
}
