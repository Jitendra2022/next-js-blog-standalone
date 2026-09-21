import { connectToDatabase } from "@/lib/db/mongodb";
import { Comment } from "@/models/Comment";
import { CommentsModerator } from "@/components/admin/comments-moderator";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  await connectToDatabase();

  const commentsRaw = await Comment.find()
    .populate("post", "title slug")
    .sort({ createdAt: -1 })
    .lean();

  const comments = commentsRaw.map((c: any) => ({
    _id: c._id.toString(),
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    content: c.content,
    status: c.status,
    createdAt: c.createdAt?.toISOString?.(),
    likes: c.likes || 0,
    post: c.post
      ? {
          _id: c.post._id.toString(),
          title: c.post.title,
          slug: c.post.slug,
        }
      : undefined,
  }));

  return <CommentsModerator initialComments={comments} />;
}
