import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  Tags,
  MessageSquare,
  Settings,
  Globe,
  LogOut,
  BookOpen,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?callbackUrl=/admin");
  }

  if (currentUser.role !== "admin" && currentUser.role !== "author") {
    redirect("/login?error=unauthorized");
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "All Posts", href: "/admin/posts", icon: FileText },
    { label: "New Post", href: "/admin/posts/new", icon: PenSquare },
    { label: "Categories", href: "/admin/categories", icon: Tags },
    { label: "Comments", href: "/admin/comments", icon: MessageSquare },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/80 bg-card/60 backdrop-blur-md shrink-0 flex flex-col justify-between">
        <div className="p-5">
          {/* Logo */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-lg">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md">
                <BookOpen className="h-4 w-4" />
              </div>
              <span>
                Lumina<span className="text-primary font-black"> CMS</span>
              </span>
            </Link>
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/40 border border-border/50 mb-6">
            {currentUser.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-9 w-9 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-foreground truncate">{currentUser.name}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3 w-3" />
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-border/60 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              View Public Blog
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-border/70 bg-card/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">
              Portal
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium capitalize">CMS Console</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/admin/posts/new">
              <Button size="sm" className="gap-1.5 shadow-sm">
                <PenSquare className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Write Post</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Body Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
