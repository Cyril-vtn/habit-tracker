"use client";

import Link from "next/link";
import { Home, PieChart } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

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
  ];

  return (
    <div className="h-screen w-64 bg-card border-r p-4 fixed left-0 top-0">
      <h1 className="text-2xl font-bold mb-8">Habit Tracker</h1>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg transition-colors",
              "hover:bg-accent/50",
              pathname === item.href
                ? "bg-accent/50 text-accent-foreground font-medium"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
