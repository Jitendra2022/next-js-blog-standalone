"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  ArrowUpRight,
  CheckCircle,
  FileEdit,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { togglePublishAction, deletePostAction } from "@/lib/actions/posts";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export interface AdminPostItem {
  _id: string;
  title: string;
  slug: string;
  coverImage?: string;
  status: "draft" | "published" | "scheduled";
  isFeatured: boolean;
  views: number;
  likes: number;
  createdAt: string;
  category?: {
    _id: string;
    name: string;
    color?: string;
  };
  author?: {
    name: string;
  };
}

interface PostsTableProps {
  posts: AdminPostItem[];
  categories: { _id: string; name: string }[];
}

export function PostsTable({ posts: initialPosts, categories }: PostsTableProps) {
  const router = useRouter();
  const [posts, setPosts] = React.useState<AdminPostItem[]>(initialPosts);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Delete modal state
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Sync if initialPosts changes
  React.useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Filtered posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || post.category?._id === categoryFilter;

    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    try {
      const res = await togglePublishAction(id);
      if (res.success && res.data) {
        const newStatus = (res.data as any).status;
        setPosts((prev) =>
          prev.map((p) =>
            p._id === id ? { ...p, status: newStatus } : p
          )
        );
        toast.success(
          newStatus === "published"
            ? "Story published live!"
            : "Story changed to draft"
        );
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch {
      toast.error("Error toggling publish status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deletePostAction(deleteId);
      if (res.success) {
        setPosts((prev) => prev.filter((p) => p._id !== deleteId));
        toast.success("Post and its comments deleted successfully.");
        setDeleteId(null);
      } else {
        toast.error(res.error || "Failed to delete post");
      }
    } catch {
      toast.error("Error deleting post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title or slug..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-card/60 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-sm rounded-lg border border-input bg-card/60 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-sm rounded-lg border border-input bg-card/60 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>

        <Link href="/admin/posts/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2 shadow-sm font-semibold">
            <Plus className="h-4 w-4" />
            Create Post
          </Button>
        </Link>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Article</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Views</th>
                <th className="px-5 py-3 text-right">Likes</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    No articles found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {post.coverImage && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.coverImage}
                            alt=""
                            className="h-10 w-14 rounded-lg object-cover border border-border shrink-0 hidden sm:block"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/admin/posts/${post._id}/edit`}
                              className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 max-w-sm"
                            >
                              {post.title}
                            </Link>
                            {post.isFeatured && (
                              <span title="Featured Story">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{formatDate(post.createdAt)}</span>
                            <span>•</span>
                            <span>by {post.author?.name || "Author"}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {post.category ? (
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
                          style={{ backgroundColor: post.category.color || "#6366f1" }}
                        >
                          {post.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleTogglePublish(post._id, post.status)}
                        className="cursor-pointer group"
                        title="Click to toggle status"
                      >
                        <Badge
                          variant={post.status === "published" ? "success" : "warning"}
                          className="group-hover:opacity-80 transition-opacity"
                        >
                          {post.status}
                        </Badge>
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-xs text-muted-foreground">
                      {post.views}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-xs text-muted-foreground">
                      {post.likes}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post.status === "published" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                            title="View public page"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/posts/${post._id}/edit`}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-accent"
                          title="Edit post"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(post._id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          title="Delete post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete this article? All reader comments on this post will also be deleted. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogClose onClose={() => setDeleteId(null)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" isLoading={isDeleting} onClick={handleDeleteConfirm}>
            Delete Article
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
