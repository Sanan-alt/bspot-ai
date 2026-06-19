import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  ArrowLeftRight,
  Lightbulb,
  Globe2,
  History,
  Briefcase,
  Bell,
  Bot,
  Settings,
  Coins,
  Receipt,
  Shield,
  Star,
  Calculator,
  Plane,
  Map,
  Gauge,
  FolderLock,
  LineChart,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
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

// 7 primary items — the most-used journey
const primary = [
  { title: "Home", url: "/app", icon: Home },
  { title: "Markets", url: "/app/markets", icon: LineChart },
  { title: "Currency Converter", url: "/app/converter", icon: ArrowLeftRight },
  { title: "Country Data", url: "/app/countries", icon: Globe2 },
  { title: "Visa Guide", url: "/app/visa", icon: Plane },
  { title: "Portfolio", url: "/app/portfolio", icon: Briefcase },
  { title: "AI Assistant", url: "/app/assistant", icon: Bot },
];

// secondary — collapsed by default
const more = [
  { title: "Cost Calculator", url: "/app/calculator", icon: Calculator },
  { title: "Readiness Score", url: "/app/readiness", icon: Gauge },
  { title: "Roadmap", url: "/app/roadmap", icon: Map },
  { title: "Document Vault", url: "/app/documents", icon: FolderLock },
  { title: "Watchlist", url: "/app/watchlist", icon: Star },
  { title: "Business Suggestions", url: "/app/suggestions", icon: Lightbulb },
  { title: "Conversion History", url: "/app/history", icon: History },
  { title: "Notifications", url: "/app/notifications", icon: Bell },
];

const billing = [
  { title: "Buy Credits", url: "/app/buy-credits", icon: Coins },
  { title: "Credit History", url: "/app/history-credits", icon: Receipt },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { isOwner } = useCredits();
  const moreActive = more.some((m) => m.url === path);
  const [showMore, setShowMore] = useState(moreActive);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4 border-b border-sidebar-border">
        {!collapsed ? <NeonLogo /> : <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-display">B</div>}
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
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {showMore && !collapsed && more.map((it) => {
                const active = path === it.url;
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link
                        to={it.url}
                        className={`flex items-center gap-3 pl-7 text-sm ${active ? "text-neon" : "text-muted-foreground hover:text-neon"}`}
                      >
                        <it.icon className="h-3.5 w-3.5" />
                        <span>{it.title}</span>
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
