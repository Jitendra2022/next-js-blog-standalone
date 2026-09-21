"use client";

import * as React from "react";
import {
  Cloud,
  HardDrive,
  Database,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  User,
  Shield,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SettingsViewProps {
  currentUser: {
    userId: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  s3Status: {
    isConfigured: boolean;
    bucket: string;
    region: string;
  };
}

export function SettingsView({ currentUser, s3Status }: SettingsViewProps) {
  const [isSeeding, setIsSeeding] = React.useState(false);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Database seeded with demo data successfully!");
      } else {
        toast.error(data.error || "Failed to seed database");
      }
    } catch {
      toast.error("Error connecting to seed endpoint");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Platform & System Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review environment status, cloud storage pipelines, and author profile details.
        </p>
      </div>

      {/* Cloud Storage / AWS S3 Integration Card */}
      <Card className="p-6 border-border/80 bg-card/60 backdrop-blur-xs space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              s3Status.isConfigured
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-amber-500/10 text-amber-500"
            }`}>
              {s3Status.isConfigured ? <Cloud className="h-5 w-5" /> : <HardDrive className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">AWS S3 Cloud Media Storage</h3>
              <p className="text-xs text-muted-foreground">
                High-throughput image uploads via @aws-sdk/client-s3
              </p>
            </div>
          </div>

          <Badge variant={s3Status.isConfigured ? "success" : "warning"}>
            {s3Status.isConfigured ? "S3 Active" : "Local Fallback Active"}
          </Badge>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Configured S3 Bucket:</span>
            <span className="font-mono text-foreground">{s3Status.bucket || "(Unset - Using local disk)"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">AWS Region:</span>
            <span className="font-mono text-foreground">{s3Status.region || "us-east-1"}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {s3Status.isConfigured ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Direct S3 uploads enabled. All images uploaded in post editor will be saved to your S3 bucket.
            </span>
          ) : (
            <span className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              AWS S3 keys are currently unset in <code>.env.local</code>. The app is automatically using public disk storage (<code>/public/uploads</code>), ensuring image uploads work without crashing!
            </span>
          )}
        </p>
      </Card>

      {/* Database Seeder & Demo Content Card */}
      <Card className="p-6 border-border/80 bg-card/60 backdrop-blur-xs space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">Demo Data Generator</h3>
              <p className="text-xs text-muted-foreground">
                Populate realistic articles, categories, and author accounts
              </p>
            </div>
          </div>

          <Button
            onClick={handleSeedDatabase}
            isLoading={isSeeding}
            variant="outline"
            className="gap-2 font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            Seed Demo Data
          </Button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Clicking this will automatically create default admin & author credentials (<code>admin@blogapp.io</code> and <code>author@blogapp.io</code>), comprehensive engineering articles with rich markdown, categories, and approved comments.
        </p>
      </Card>

      {/* Current User Profile Card */}
      <Card className="p-6 border-border/80 bg-card/60 backdrop-blur-xs space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">Your Author Account</h3>
            <p className="text-xs text-muted-foreground">Active session credentials</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
            <span className="text-muted-foreground block mb-1">Author Name</span>
            <span className="font-bold text-foreground text-sm">{currentUser.name}</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
            <span className="text-muted-foreground block mb-1">Email Address</span>
            <span className="font-bold text-foreground text-sm">{currentUser.email}</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
            <span className="text-muted-foreground block mb-1">Assigned Role</span>
            <span className="font-bold text-primary uppercase tracking-wider">{currentUser.role}</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
            <span className="text-muted-foreground block mb-1">Session Security</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              JWT Signed & Encrypted (httpOnly)
            </span>
          </div>
        </div>
      </Card>

      {/* Technical Architecture Badge */}
      <Card className="p-6 border-border/80 bg-card/60 backdrop-blur-xs space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Server className="h-4 w-4 text-primary" />
          Application Architecture Stack
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg border border-border bg-background/50 text-center">
            <span className="text-muted-foreground block text-[10px]">Framework</span>
            <span className="font-bold text-foreground">Next.js 16 (App Router)</span>
          </div>
          <div className="p-2.5 rounded-lg border border-border bg-background/50 text-center">
            <span className="text-muted-foreground block text-[10px]">React Runtime</span>
            <span className="font-bold text-foreground">React 19 Server Actions</span>
          </div>
          <div className="p-2.5 rounded-lg border border-border bg-background/50 text-center">
            <span className="text-muted-foreground block text-[10px]">Database</span>
            <span className="font-bold text-foreground">MongoDB & Mongoose</span>
          </div>
          <div className="p-2.5 rounded-lg border border-border bg-background/50 text-center">
            <span className="text-muted-foreground block text-[10px]">Design System</span>
            <span className="font-bold text-foreground">Tailwind CSS & shadcn/ui</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
