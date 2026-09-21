"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Trash2, ArrowUpRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { moderateCommentAction, deleteCommentAction } from "@/lib/actions/comments";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export interface AdminCommentItem {
  _id: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
  likes: number;
  post?: {
    _id: string;
    title: string;
    slug: string;
  };
}

export function CommentsModerator({
  initialComments,
}: {
  initialComments: AdminCommentItem[];
}) {
  const [comments, setComments] = React.useState<AdminCommentItem[]>(initialComments);
  const [filter, setFilter] = React.useState<"all" | "approved" | "pending" | "rejected">("all");

  const filteredComments = comments.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const handleModerate = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      const res = await moderateCommentAction(id, newStatus);
      if (res.success) {
        setComments((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
        );
        toast.success(`Comment marked as ${newStatus}`);
      } else {
        toast.error(res.error || "Failed to update comment");
      }
    } catch {
      toast.error("Error moderating comment");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteCommentAction(id);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c._id !== id));
        toast.success("Comment deleted");
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch {
      toast.error("Error deleting comment");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Comment Moderation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and moderate reader questions and feedback.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border">
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                filter === status
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Comment List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-border/80">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No comments found in this queue.</p>
          </Card>
        ) : (
          filteredComments.map((comment) => (
            <Card
              key={comment._id}
              className="p-5 border-border/80 bg-card/60 backdrop-blur-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold uppercase">
                    {comment.authorName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">
                        {comment.authorName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({comment.authorEmail})
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      comment.status === "approved"
                        ? "success"
                        : comment.status === "pending"
                        ? "warning"
                        : "destructive"
                    }
                  >
                    {comment.status}
                  </Badge>

                  {comment.post && (
                    <Link
                      href={`/blog/${comment.post.slug}`}
                      target="_blank"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 ml-2"
                    >
                      Article <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              <p className="text-sm text-foreground/90 leading-relaxed pl-11">
                {comment.content}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                {comment.status !== "approved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleModerate(comment._id, "approved")}
                    className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Approve
                  </Button>
                )}

                {comment.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleModerate(comment._id, "rejected")}
                    className="h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 border-amber-500/30"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(comment._id)}
                  className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
