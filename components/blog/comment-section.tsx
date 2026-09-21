"use client";

import * as React from "react";
import { MessageSquare, Send, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { addCommentAction, likeCommentAction } from "@/lib/actions/comments";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export interface CommentItem {
  _id: string;
  authorName: string;
  content: string;
  createdAt: string | Date;
  likes?: number;
}

interface CommentSectionProps {
  postId: string;
  initialComments: CommentItem[];
}

export function CommentSection({
  postId,
  initialComments,
}: CommentSectionProps) {
  const [comments, setComments] = React.useState<CommentItem[]>(initialComments);
  const [authorName, setAuthorName] = React.useState("");
  const [authorEmail, setAuthorEmail] = React.useState("");
  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !authorEmail.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addCommentAction({
        postId,
        authorName,
        authorEmail,
        content,
      });

      if (res.success && res.data) {
        toast.success("Comment posted successfully!");
        const data: any = res.data;
        const newComment: CommentItem = {
          _id: data.id,
          authorName: data.authorName,
          content: data.content,
          createdAt: data.createdAt,
          likes: 0,
        };
        setComments([newComment, ...comments]);
        setContent("");
      } else {
        toast.error(res.error || "Failed to post comment");
      }
    } catch {
      toast.error("An error occurred while posting your comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const res = await likeCommentAction(commentId);
      if (res.success && res.data) {
        const data: any = res.data;
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId ? { ...c, likes: data.likes } : c
          )
        );
      }
    } catch {
      toast.error("Could not register like");
    }
  };

  return (
    <div className="space-y-8 mt-12 pt-8 border-t border-border/80">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          Discussion ({comments.length})
        </h3>
      </div>

      {/* Submission Form */}
      <Card className="p-6 bg-card/60 backdrop-blur-xs border-border/80 rounded-2xl shadow-sm">
        <h4 className="text-sm font-semibold mb-4 text-foreground">
          Leave a comment
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Your Name *
              </label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Alex Vance"
                required
                className="bg-background/80"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Email Address * (Will not be published)
              </label>
              <Input
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="alex@example.com"
                required
                className="bg-background/80"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Your Comment *
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or architectural feedback..."
              rows={3}
              required
              className="bg-background/80"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="gap-2 font-medium"
            >
              <Send className="h-4 w-4" />
              Post Comment
            </Button>
          </div>
        </form>
      </Card>

      {/* Comment List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-dashed border-border bg-muted/20">
            <p className="text-muted-foreground text-sm">
              No comments yet. Be the first to start the conversation!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <Card
              key={comment._id}
              className="p-5 border-border/70 bg-card/40 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs uppercase">
                    {comment.authorName.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-foreground">
                      {comment.authorName}
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleLikeComment(comment._id)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-accent cursor-pointer"
                  title="Upvote comment"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>{comment.likes || 0}</span>
                </button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed pl-11">
                {comment.content}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
