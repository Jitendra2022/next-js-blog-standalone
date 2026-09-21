import { z } from "zod";

export const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  excerpt: z
    .string()
    .trim()
    .min(10, "Excerpt must be at least 10 characters")
    .max(400, "Excerpt cannot exceed 400 characters"),
  content: z
    .string()
    .trim()
    .min(20, "Content must be at least 20 characters"),
  coverImage: z.string().optional().default(""),
  categoryId: z.string().min(1, "Please select a category"),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "scheduled"]).default("draft"),
  isFeatured: z.boolean().default(false),
});

export type PostInput = z.infer<typeof postSchema>;
