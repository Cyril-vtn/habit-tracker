import ActivityStats from "@/components/ActivityStats";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function StatsPage() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-4">
          <SidebarTrigger />
          <ActivityStats />
        </main>
      </div>
    </SidebarProvider>
  );
}
