"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Home, PieChart, LogOut, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useLanguage } from "@/hooks/useLanguage";

const getNavItems = (t: (key: string) => string) => [
  {
    href: "/",
    icon: Home,
    label: t("sidebar.home"),
  },
  {
    href: "/stats",
    icon: PieChart,
    label: t("sidebar.stats"),
  },
  {
    href: "/profile",
    icon: User,
    label: t("sidebar.profile"),
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { t } = useLanguage();
  const navItems = getNavItems(t);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-xl font-bold">{t("sidebar.title")}</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="flex flex-col gap-2">
          {navItems.map((item) => (
            <SidebarMenuButton
              key={item.href}
              isActive={pathname === item.href}
              tooltip={item.label}
              onClick={() => router.push(item.href)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          ))}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="destructive" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          <span>{t("sidebar.signOut")}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
