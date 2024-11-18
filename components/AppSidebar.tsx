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

const navItems = [
  {
    href: "/",
    icon: Home,
    label: "Home",
  },
  {
    href: "/stats",
    icon: PieChart,
    label: "Chart",
  },
  {
    href: "/profile",
    icon: User,
    label: "Profile",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-xl font-bold">Habit Tracker</h1>
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
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
