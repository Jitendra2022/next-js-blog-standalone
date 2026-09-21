import { getCurrentUser } from "@/lib/auth/session";
import { isS3Configured, AWS_S3_BUCKET_NAME, AWS_REGION } from "@/lib/s3/client";
import { SettingsView } from "@/components/admin/settings-view";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const s3Status = {
    isConfigured: isS3Configured,
    bucket: AWS_S3_BUCKET_NAME,
    region: AWS_REGION,
  };

  return <SettingsView currentUser={currentUser} s3Status={s3Status} />;
}
