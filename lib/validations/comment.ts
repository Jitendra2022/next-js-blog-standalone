import { z } from "zod";

export const commentSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
  authorName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  authorEmail: z.string().trim().email("Please provide a valid email address"),
  content: z
    .string()
    .trim()
    .min(3, "Comment must be at least 3 characters")
    .max(1000, "Comment cannot exceed 1000 characters"),
});

export type CommentInput = z.infer<typeof commentSchema>;
