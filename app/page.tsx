import HabitTracker from "@/components/HabitTracker";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 h-full">
          <SidebarTrigger />
          <div className="h-full pb-10">
            <HabitTracker />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
