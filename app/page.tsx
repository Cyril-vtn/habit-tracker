import HabitTracker from "@/components/HabitTracker";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-4">
          <SidebarTrigger />
          <HabitTracker />
        </main>
      </div>
    </SidebarProvider>
  );
}
