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

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/signin" });
  }, [loading, user, navigate]);

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
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground hidden sm:inline">// BSPOT.AI v0.1</span>
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
