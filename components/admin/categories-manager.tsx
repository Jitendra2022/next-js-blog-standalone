"use client";

import * as React from "react";
import { Plus, Tag, Trash2, Edit, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "@/lib/actions/categories";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postCount: number;
}

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#0ea5e9", // Sky
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#ef4444", // Rose
];

export function CategoriesManager({ initialCategories }: { initialCategories: CategoryItem[] }) {
  const [categories, setCategories] = React.useState<CategoryItem[]>(initialCategories);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete State
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setColor(PRESET_COLORS[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: CategoryItem) => {
    setEditingId(category._id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setColor(category.color || PRESET_COLORS[0]);
    setIsModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingId) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await updateCategoryAction(editingId, {
          name,
          slug: slugify(slug),
          description,
          color,
        });
        if (res.success) {
          toast.success("Category updated!");
          setCategories((prev) =>
            prev.map((c) =>
              c._id === editingId ? { ...c, name, slug: slugify(slug), description, color } : c
            )
          );
          setIsModalOpen(false);
        } else {
          toast.error(res.error || "Failed to update category");
        }
      } else {
        const res = await createCategoryAction({
          name,
          slug: slugify(slug),
          description,
          color,
        });
        if (res.success && res.data) {
          toast.success("Category created!");
          const data = res.data as any;
          const newCat: CategoryItem = {
            _id: data.id,
            name: data.name,
            slug: data.slug,
            description,
            color,
            postCount: 0,
          };
          setCategories([...categories, newCat]);
          setIsModalOpen(false);
        } else {
          toast.error(res.error || "Failed to create category");
        }
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deleteCategoryAction(deleteId);
      if (res.success) {
        toast.success("Category deleted");
        setCategories((prev) => prev.filter((c) => c._id !== deleteId));
        setDeleteId(null);
      } else {
        toast.error(res.error || "Failed to delete category");
      }
    } catch {
      toast.error("Error deleting category");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Category Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize articles into thematic topic hubs and badges.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 shadow-sm font-semibold">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Card key={cat._id} className="p-5 border-border/80 bg-card shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shadow-xs"
                    style={{ backgroundColor: cat.color || "#6366f1" }}
                  />
                  <h3 className="font-bold text-foreground text-base">{cat.name}</h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                  {cat.postCount} {cat.postCount === 1 ? "post" : "posts"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {cat.description || "No description provided."}
              </p>

              <p className="text-[11px] font-mono text-muted-foreground">
                slug: <span className="text-primary">{cat.slug}</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(cat)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(cat._id)}
                className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Category" : "Create New Category"}</DialogTitle>
          <DialogDescription>
            Categories group your publications and show colored badges across the site.
          </DialogDescription>
        </DialogHeader>
        <DialogClose onClose={() => setIsModalOpen(false)} />
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Name *</label>
            <Input
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Distributed Systems"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Slug *</label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="distributed-systems"
              required
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the topics in this category..."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">Accent Color</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    color === c ? "scale-110 ring-2 ring-foreground" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))}
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-24 text-xs font-mono ml-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingId ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this category? If any articles are associated with it, you must reassign them first.
          </DialogDescription>
        </DialogHeader>
        <DialogClose onClose={() => setDeleteId(null)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="destructive" isLoading={isDeleting} onClick={handleDeleteConfirm}>
            Delete Category
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
