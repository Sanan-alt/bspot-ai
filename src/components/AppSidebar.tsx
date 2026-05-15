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
} from "lucide-react";
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

const items = [
  { title: "Home", url: "/app", icon: Home },
  { title: "Currency Converter", url: "/app/converter", icon: ArrowLeftRight },
  { title: "Business Suggestions", url: "/app/suggestions", icon: Lightbulb },
  { title: "Country Data", url: "/app/countries", icon: Globe2 },
  { title: "Conversion History", url: "/app/history", icon: History },
  { title: "Portfolio Tracker", url: "/app/portfolio", icon: Briefcase },
  { title: "Notifications", url: "/app/notifications", icon: Bell },
  { title: "AI Assistant", url: "/app/assistant", icon: Bot },
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
              {items.map((it) => {
                const active = path === it.url;
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link
                        to={it.url}
                        className={`flex items-center gap-3 ${
                          active ? "text-neon" : "hover:text-neon"
                        }`}
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
      </SidebarContent>
    </Sidebar>
  );
}
