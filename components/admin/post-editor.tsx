"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Image as ImageIcon,
  Check,
  Eye,
  Edit3,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  Link as LinkIcon,
  Sparkles,
  ArrowLeft,
  Trash2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { createPostAction, updatePostAction } from "@/lib/actions/posts";
import { slugify, estimateReadingTime } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface CategoryOption {
  _id: string;
  name: string;
}

interface PostEditorProps {
  categories: CategoryOption[];
  initialData?: {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    categoryId: string;
    tags: string[];
    status: "draft" | "published" | "scheduled";
    isFeatured: boolean;
  };
}

export function PostEditor({ categories, initialData }: PostEditorProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData?._id);

  // Form states
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [slug, setSlug] = React.useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = React.useState(initialData?.excerpt || "");
  const [content, setContent] = React.useState(initialData?.content || "");
  const [coverImage, setCoverImage] = React.useState(initialData?.coverImage || "");
  const [categoryId, setCategoryId] = React.useState(
    initialData?.categoryId || (categories[0]?._id || "")
  );
  const [tags, setTags] = React.useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = React.useState("");
  const [isFeatured, setIsFeatured] = React.useState(initialData?.isFeatured || false);
  const [isAutoSlug, setIsAutoSlug] = React.useState(!initialData?.slug);

  // UI / Upload states
  const [editorTab, setEditorTab] = React.useState<string>("write");
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (isAutoSlug) {
      setSlug(slugify(newTitle));
    }
  };

  // Tag management
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^#/, "");
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Image Upload handler (AWS S3 or Fallback)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setCoverImage(data.url);
        toast.success(
          data.provider === "s3"
            ? "Uploaded to AWS S3 successfully!"
            : "Image uploaded locally!"
        );
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch {
      toast.error("Upload error. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Formatting Toolbar Helper
  const insertFormatting = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = prefix + selected + suffix;

    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  // Submit Handler
  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) {
      toast.error("Please provide an article title");
      return;
    }
    if (!slug.trim()) {
      toast.error("Please provide a slug");
      return;
    }
    if (!excerpt.trim()) {
      toast.error("Please provide an excerpt");
      return;
    }
    if (!content.trim()) {
      toast.error("Article content cannot be empty");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    setIsSubmitting(true);

    const postPayload = {
      title,
      slug: slugify(slug),
      excerpt,
      content,
      coverImage,
      categoryId,
      tags,
      status,
      isFeatured,
    };

    try {
      let res;
      if (isEditing && initialData) {
        res = await updatePostAction(initialData._id, postPayload);
      } else {
        res = await createPostAction(postPayload);
      }

      if (res.success) {
        toast.success(
          status === "published"
            ? "Article published successfully!"
            : "Draft saved successfully!"
        );
        router.push("/admin/posts");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save post");
      }
    } catch {
      toast.error("An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const readingTime = estimateReadingTime(content);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/posts">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEditing ? "Edit Article" : "Write New Story"}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3 w-3" />
              Estimated reading time: {readingTime} min
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleSave("draft")}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            isLoading={isSubmitting}
            onClick={() => handleSave("published")}
            className="shadow-md shadow-primary/20 font-semibold"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Publish Story
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Inputs & Content Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Title, Excerpt, Markdown Editor */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Article Title *
            </label>
            <Input
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g. Mastering Next.js 16 App Router & RSC"
              className="text-lg sm:text-xl font-bold py-6 bg-card"
            />
          </div>

          {/* Slug Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                URL Slug *
              </label>
              <button
                type="button"
                onClick={() => setIsAutoSlug(!isAutoSlug)}
                className="text-[11px] text-primary hover:underline cursor-pointer"
              >
                {isAutoSlug ? "Auto-syncing with title (click to customize)" : "Custom slug (click to auto-sync)"}
              </button>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-input bg-muted text-xs text-muted-foreground font-mono">
                /blog/
              </span>
              <Input
                value={slug}
                onChange={(e) => {
                  setIsAutoSlug(false);
                  setSlug(e.target.value);
                }}
                placeholder="mastering-nextjs-app-router"
                className="rounded-l-none font-mono text-xs bg-card"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Excerpt / Brief Summary *
            </label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short, captivating summary of what readers will learn in this publication..."
              rows={2}
              className="bg-card"
            />
          </div>

          {/* Markdown Editor with Write / Preview Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Story Content (Markdown supported) *
              </label>
              <Tabs value={editorTab} onValueChange={setEditorTab} className="w-auto">
                <TabsList className="h-8">
                  <TabsTrigger value="write" className="text-xs gap-1">
                    <Edit3 className="h-3 w-3" /> Write
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs gap-1">
                    <Eye className="h-3 w-3" /> Live Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {editorTab === "write" ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                {/* Formatting Toolbar */}
                <div className="flex flex-wrap items-center gap-1 border-b border-border/80 bg-muted/40 p-2 text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => insertFormatting("**", "**")}
                    className="p-1.5 rounded hover:bg-accent hover:text-foreground cursor-pointer"
                    title="Bold"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("*", "*")}
                    className="p-1.5 rounded hover:bg-accent hover:text-foreground cursor-pointer"
                    title="Italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <div className="h-4 w-px bg-border mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting("## ", "")}
                    className="p-1.5 rounded hover:bg-accent hover:text-foreground cursor-pointer"
                    title="Heading 2"
                  >
                    <Heading2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("### ", "")}
                    className="p-1.5 rounded hover:bg-accent hover:text-foreground cursor-pointer"
                    title="Heading 3"
                  >
                    <Heading3 className="h-3.5 w-3.5" />
                  </button>
                  <div className="h-4 w-px bg-border mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting("> ", "")}
                    className="p-1.5 rounded hover:bg-accent hover:text-foreground cursor-pointer"
                    title="Quote"
                  >
                    <Quote className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("```typescript\n", "\n```")}
                    className="p-1.5 rounded hover:bg-accent hover:text-foreground cursor-pointer"
                    title="Code Block"
                  >
                    <Code className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("- ", "")}
                    className="p-1.5 rounded hover:bg-accent hover:text-foreground cursor-pointer"
                    title="Bullet List"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("[link title](", ")")}
                    className="p-1.5 rounded hover:bg-accent hover:text-foreground cursor-pointer"
                    title="Link"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your article in Markdown..."
                  rows={18}
                  className="border-0 rounded-none focus-visible:ring-0 font-mono text-sm leading-relaxed p-4"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-6 min-h-[400px]">
                <MarkdownContent content={content || "*Nothing to preview yet. Start writing!*"} />
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Publishing Settings & Cover Image */}
        <div className="lg:col-span-4 space-y-6">
          {/* Cover Image Upload */}
          <Card className="p-5 border-border bg-card space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Cover Image
            </h3>

            {coverImage ? (
              <div className="space-y-3">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-white hover:bg-rose-600 transition-colors"
                    title="Remove image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Image URL"
                  className="text-xs font-mono"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-accent/40 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs font-semibold text-foreground">
                    {isUploading ? "Uploading to S3..." : "Upload Cover Image"}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1 text-center">
                    PNG, JPG, WebP up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>

                <div className="relative flex items-center justify-center text-[10px] text-muted-foreground uppercase">
                  <div className="border-t border-border w-full" />
                  <span className="bg-card px-2 shrink-0">Or enter URL</span>
                  <div className="border-t border-border w-full" />
                </div>

                <Input
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="text-xs font-mono"
                />
              </div>
            )}
          </Card>

          {/* Category Selector */}
          <Card className="p-5 border-border bg-card space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Category *</h3>
              <Link
                href="/admin/categories"
                target="_blank"
                className="text-xs text-primary hover:underline"
              >
                + Manage
              </Link>
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Card>

          {/* Tags Chip Input */}
          <Card className="p-5 border-border bg-card space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-foreground">Tags</h3>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type tag and press Enter..."
              className="text-xs"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Featured Post Switch */}
          <Card className="p-5 border-border bg-card space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Featured Story
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pin this article to the top hero section of the home page.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
