"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Sparkles, ArrowRight, ShieldCheck, UserCheck, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { loginAction, quickDemoLoginAction } from "@/lib/actions/auth";
import { toast } from "sonner";

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDemoLoading, setIsDemoLoading] = React.useState<"admin" | "author" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please provide both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginAction({ email, password });
      if (res.success) {
        toast.success("Welcome back! Redirecting...");
        router.push(callbackUrl);
        router.refresh();
      } else {
        toast.error(res.error || "Invalid credentials");
      }
    } catch {
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: "admin" | "author") => {
    setIsDemoLoading(role);
    try {
      const res = await quickDemoLoginAction(role);
      if (res.success) {
        toast.success(`Logged in as demo ${role}!`);
        router.push(callbackUrl);
        router.refresh();
      } else {
        toast.error(res.error || "Demo login failed");
      }
    } catch {
      toast.error("Demo login error");
    } finally {
      setIsDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

      {/* Brand Icon */}
      <div className="text-center mb-8 space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-bold tracking-tight text-2xl group"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Lumina<span className="text-primary font-black">.</span>
          </span>
        </Link>
        <p className="text-sm text-muted-foreground">
          Sign in to access your author studio and CMS
        </p>
      </div>

      <Card className="w-full max-w-md p-6 sm:p-8 bg-card/80 backdrop-blur-md border-border/80 shadow-2xl rounded-2xl space-y-6">
        {/* Quick 1-Click Demo Buttons */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Instant Demo Access (No typing needed)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isDemoLoading === "admin"}
              onClick={() => handleQuickDemo("admin")}
              className="text-xs bg-background/80 hover:bg-background border-border/80 gap-1.5 font-medium"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Demo Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isDemoLoading === "author"}
              onClick={() => handleQuickDemo("author")}
              className="text-xs bg-background/80 hover:bg-background border-border/80 gap-1.5 font-medium"
            >
              <UserCheck className="h-3.5 w-3.5 text-purple-500" />
              Demo Author
            </Button>
          </div>
        </div>

        <div className="relative flex items-center justify-center text-xs text-muted-foreground uppercase">
          <div className="border-t border-border/60 w-full" />
          <span className="bg-card px-3 shrink-0">Or sign in with email</span>
          <div className="border-t border-border/60 w-full" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@blogapp.io"
              required
              className="bg-background/60"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Password
              </label>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-background/60"
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full font-semibold shadow-md shadow-primary/20 mt-2"
          >
            Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Don&apos;t have an author account?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </Card>
    </div>
  );
}
