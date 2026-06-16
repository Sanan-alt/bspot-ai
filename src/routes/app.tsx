import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatbotFab } from "@/components/ChatbotFab";
import { CreditsBadge } from "@/components/CreditsBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CreditsProvider } from "@/hooks/use-credits";
import { supabase } from "@/integrations/supabase/client";
import { Bell, LogOut } from "lucide-react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/signin" });
  }, [loading, user, navigate]);

  // Auto-redirect to onboarding if profile isn't completed
  useEffect(() => {
    if (!user) return;
    if (location.pathname.startsWith("/onboarding")) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarded_at, is_demo")
        .eq("id", user.id)
        .maybeSingle();
      if (data && !data.onboarded_at && !data.is_demo) {
        navigate({ to: "/onboarding" });
      }
    })();
  }, [user, location.pathname, navigate]);

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
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground hidden sm:inline">// BSPOT.AI Beta v1.0</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <CreditsBadge />
                <Link to="/app/notifications" className="relative h-9 w-9 grid place-items-center rounded-md hover:bg-accent">
                  <Bell className="h-4 w-4" />
                </Link>
                <span className="hidden lg:block font-mono text-xs text-muted-foreground truncate max-w-[160px]">{user.email}</span>
                <button
                  onClick={async () => { await signOut(); navigate({ to: "/" }); }}
                  className="h-9 w-9 grid place-items-center rounded-md hover:bg-accent text-destructive"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </header>
            <DemoBanner />
            <main className="flex-1 p-4 md:p-8">
              <Outlet />
            </main>
          </div>
          <ChatbotFab />
        </div>
      </SidebarProvider>
    </CreditsProvider>
  );
}

function DemoBanner() {
  const isDemo = typeof window !== "undefined" && localStorage.getItem("bspot.demo_mode") === "true";
  if (!isDemo) return null;
  return (
    <div className="bg-primary/15 border-b border-primary/40 px-4 py-2 flex items-center justify-between gap-3 text-xs">
      <span className="font-mono">
        ⚡ <span className="text-neon uppercase tracking-widest">Demo Mode</span> — you're exploring as Ahmed from Karachi. Create a free account to save your progress.
      </span>
      <div className="flex items-center gap-2">
        <Link to="/signup" className="px-3 py-1 rounded bg-primary text-primary-foreground font-mono uppercase tracking-widest text-[10px]">Sign up</Link>
        <button
          onClick={() => { localStorage.removeItem("bspot.demo_mode"); localStorage.removeItem("bspot.demo_profile"); window.location.href = "/"; }}
          className="px-3 py-1 rounded border border-border font-mono uppercase tracking-widest text-[10px] hover:border-primary"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
