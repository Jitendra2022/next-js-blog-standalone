import mongoose, { Schema, Document, Model } from "mongoose";
import "./Post";
import "./User";

export type CommentStatus = "approved" | "pending" | "rejected";

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  authorName: string;
  authorEmail: string;
  authorUser?: mongoose.Types.ObjectId;
  content: string;
  status: CommentStatus;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post reference is required"],
      index: true,
    },
    authorName: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    authorEmail: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    authorUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
      index: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

CommentSchema.index({ post: 1, createdAt: -1 });

export const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);
