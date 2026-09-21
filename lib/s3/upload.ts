import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, isS3Configured, AWS_S3_BUCKET_NAME, AWS_REGION } from "./client";
import fs from "fs/promises";
import path from "path";

export interface UploadResult {
  url: string;
  provider: "s3" | "local";
  filename: string;
  size: number;
}

export async function uploadImage(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<UploadResult> {
  const extension = path.extname(originalFilename) || ".jpg";
  const uniqueKey = `blogs/${Date.now()}-${Math.random().toString(36).substring(2, 9)}${extension}`;
  const filename = path.basename(uniqueKey);

  // If AWS S3 is fully configured with credentials and bucket name
  if (isS3Configured && s3Client && AWS_S3_BUCKET_NAME) {
    try {
      const command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: uniqueKey,
        Body: buffer,
        ContentType: mimeType,
      });

      await s3Client.send(command);

      const s3Url = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${uniqueKey}`;
      return {
        url: s3Url,
        provider: "s3",
        filename,
        size: buffer.length,
      };
    } catch (error) {
      console.warn("AWS S3 upload failed, falling back to local storage:", error);
    }
  }

  // Graceful fallback: Store locally in public/uploads
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${filename}`,
    provider: "local",
    filename,
    size: buffer.length,
  };
}
