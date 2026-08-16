import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatbotFab } from "@/components/ChatbotFab";
import { CreditsBadge } from "@/components/CreditsBadge";
import { ThemeToggle } from "@/components/ThemeToggle";

import { CreditsProvider } from "@/hooks/use-credits";
import { Bell, LogOut } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { NotificationsListener } from "@/components/NotificationsListener";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "BSpot AI Dashboard" },
      { name: "description", content: "Your BSpot AI workspace — markets, country roadmaps, calculators, and AI tools." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  // Demo is a real (anonymous) Supabase session — gate cannot be bypassed via localStorage.
  const isDemo = !!user?.is_anonymous;
  const unread = useUnreadNotifications();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/signin" });
  }, [loading, user, navigate]);

  // Idle timeout (30min) — auto sign-out for security
  useIdleTimeout(!!user && !isDemo, () => navigate({ to: "/signin" }));


  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-neon" />
      </div>
    );
  }

  return (
    <CreditsProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 border-b border-border bg-card/30 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground hidden sm:inline">// BSPOT.AI</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                
                <CreditsBadge />
                <Link
                  to="/app/notifications"
                  aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
                  className="relative h-9 w-9 grid place-items-center rounded-md hover:bg-accent"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-mono grid place-items-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
                <span className="hidden lg:block font-mono text-xs text-muted-foreground truncate max-w-[160px]">{user?.email ?? "demo@bspot.ai"}</span>
                <button
                  onClick={async () => {
                    try {
                      localStorage.removeItem("bspot.demo_mode");
                      localStorage.removeItem("bspot.demo_profile");
                    } catch {}
                    if (user) await signOut();
                    navigate({ to: "/" });
                  }}
                  className="h-9 w-9 grid place-items-center rounded-md hover:bg-accent text-destructive"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </header>
            <DemoBanner isDemo={isDemo} signOut={signOut} navigate={navigate} />
            <main className="flex-1 p-4 md:p-8">
              <Outlet />
            </main>
          </div>
          <ChatbotFab />
          <NotificationsListener />
        </div>
      </SidebarProvider>
    </CreditsProvider>
  );
}

function DemoBanner({
  isDemo,
  signOut,
  navigate,
}: {
  isDemo: boolean;
  signOut: () => Promise<void>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  if (!isDemo) return null;
  return (
    <div className="bg-primary/15 border-b border-primary/40 px-4 py-2 flex items-center justify-between gap-3 text-xs">
      <span className="font-mono">
        ⚡ <span className="text-neon uppercase tracking-widest">Demo Mode</span> — you're exploring as a guest. Create a free account to save your progress.
      </span>
      <div className="flex items-center gap-2">
        <Link to="/signup" className="px-3 py-1 rounded bg-primary text-primary-foreground font-mono uppercase tracking-widest text-[10px]">Sign up</Link>
        <button
          onClick={async () => {
            try {
              localStorage.removeItem("bspot.demo_mode");
              localStorage.removeItem("bspot.demo_profile");
            } catch {}
            await signOut();
            navigate({ to: "/" });
          }}
          className="px-3 py-1 rounded border border-border font-mono uppercase tracking-widest text-[10px] hover:border-primary"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
