"use client";

import * as React from "react";
import { Heart, Share2, Link2, Check, Bookmark } from "lucide-react";
import { TwitterIcon, LinkedinIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { likePostAction } from "@/lib/actions/posts";
import { toast } from "sonner";

interface PostActionsProps {
  postId: string;
  initialLikes: number;
  title: string;
  slug: string;
}

export function PostActions({
  postId,
  initialLikes,
  title,
  slug,
}: PostActionsProps) {
  const [likes, setLikes] = React.useState(initialLikes);
  const [hasLiked, setHasLiked] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    setLikes((prev) => prev + 1);

    try {
      const res = await likePostAction(postId);
      if (res.success && res.data) {
        setLikes((res.data as any).likes);
      }
    } catch {
      // Revert if error
      setHasLiked(false);
      setLikes((prev) => prev - 1);
      toast.error("Failed to like post");
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out "${title}" on Lumina Blog:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? "Removed from bookmarks" : "Article bookmarked!");
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-6 my-8 border-y border-border/60">
      {/* Like Button */}
      <div className="flex items-center gap-3">
        <Button
          variant={hasLiked ? "default" : "outline"}
          onClick={handleLike}
          className={`gap-2 rounded-full px-5 transition-all ${
            hasLiked ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-500/20" : ""
          }`}
        >
          <Heart className={`h-4 w-4 ${hasLiked ? "fill-white text-white" : "text-rose-500"}`} />
          <span className="font-semibold">{likes}</span>
          <span className="hidden sm:inline">Likes</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleBookmark}
          className="rounded-full text-muted-foreground hover:text-foreground"
          title={isBookmarked ? "Remove Bookmark" : "Save for later"}
        >
          <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-primary text-primary" : ""}`} />
        </Button>
      </div>

      {/* Share Buttons */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wider mr-2 hidden sm:inline">
          Share:
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShareTwitter}
          className="rounded-full h-9 w-9 hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
          title="Share on Twitter / X"
        >
          <TwitterIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShareLinkedIn}
          className="rounded-full h-9 w-9 hover:text-[#0A66C2] hover:bg-[#0A66C2]/10"
          title="Share on LinkedIn"
        >
          <LinkedinIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyLink}
          className="rounded-full h-9 w-9 hover:text-foreground"
          title="Copy Link"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
