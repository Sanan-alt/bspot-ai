import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  ArrowLeftRight,
  Globe2,
  History,
  Briefcase,
  Bell,
  Bot,
  Settings,
  Coins,
  Calculator,
  Plane,
  FolderLock,
  LineChart,
  Newspaper,
  Map as MapIcon,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { NeonLogo } from "./NeonLogo";

// primary items — the most-used journey
const primary = [
  { title: "Home", url: "/app", icon: Home },
  { title: "Markets", url: "/app/markets", icon: LineChart },
  { title: "News", url: "/app/news", icon: Newspaper },
  { title: "Currency Converter", url: "/app/converter", icon: ArrowLeftRight },
  { title: "Country Data", url: "/app/countries", icon: Globe2 },
  { title: "Visa Guide", url: "/app/visa", icon: Plane },
  { title: "My Roadmap", url: "/app/roadmap", icon: MapIcon },
  { title: "Portfolio", url: "/app/portfolio", icon: Briefcase },
  { title: "AI Assistant", url: "/app/assistant", icon: Bot },
];

// secondary — collapsed by default
const more = [
  { title: "Cost Calculator", url: "/app/calculator", icon: Calculator },
  { title: "Document Vault", url: "/app/documents", icon: FolderLock },
  { title: "Activity & Credits", url: "/app/history", icon: History },
  { title: "Notifications", url: "/app/notifications", icon: Bell },
];

const billing = [
  { title: "Buy Credits", url: "/app/buy-credits", icon: Coins },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { isOwner } = useCredits();
  const unread = useUnreadNotifications();
  const moreActive = more.some((m) => m.url === path);
  const [showMore, setShowMore] = useState(moreActive || unread > 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2">
          {!collapsed ? <NeonLogo /> : <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-display">B</div>}
          {unread > 0 && (
            <Link
              to="/app/notifications"
              aria-label={`${unread} unread notifications`}
              className="relative h-8 w-8 grid place-items-center rounded-md border border-border hover:border-primary hover:text-neon"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-mono grid place-items-center glow-sm">
                {unread > 9 ? "9+" : unread}
              </span>
            </Link>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] tracking-[0.25em]">// NAVIGATION</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primary.map((it) => {
                const active = path === it.url;
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link
                        to={it.url}
                        className={`flex items-center gap-3 ${active ? "text-neon" : "hover:text-neon"}`}
                      >
                        <it.icon className="h-4 w-4" />
                        {!collapsed && <span>{it.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {!collapsed && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setShowMore((v) => !v)}
                    className="flex items-center gap-3 text-muted-foreground hover:text-neon"
                  >
                    {showMore ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span>More tools</span>
                    {!showMore && unread > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono glow-sm">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {showMore && !collapsed && more.map((it) => {
                const active = path === it.url;
                const isNotif = it.url === "/app/notifications";
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link
                        to={it.url}
                        className={`flex items-center gap-3 pl-7 text-sm ${active ? "text-neon" : "text-muted-foreground hover:text-neon"}`}
                      >
                        <it.icon className="h-3.5 w-3.5" />
                        <span>{it.title}</span>
                        {isNotif && unread > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono glow-sm">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] tracking-[0.25em]">// BILLING</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {billing.map((it) => {
                const active = path === it.url;
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link
                        to={it.url}
                        className={`flex items-center gap-3 ${active ? "text-neon" : "hover:text-neon"}`}
                      >
                        <it.icon className="h-4 w-4" />
                        {!collapsed && <span>{it.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isOwner && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[10px] tracking-[0.25em] text-neon">// OWNER</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={path === "/app/admin"}>
                    <Link to="/app/admin" className={`flex items-center gap-3 ${path === "/app/admin" ? "text-neon" : "hover:text-neon"}`}>
                      <Shield className="h-4 w-4" />
                      {!collapsed && <span>Admin Panel</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
