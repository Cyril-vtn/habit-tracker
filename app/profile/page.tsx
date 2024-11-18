import { AppSidebar } from "@/components/AppSidebar";
import { ProfileForm } from "@/components/ProfileForm";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function ProfilePage() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-4">
          <SidebarTrigger />
          <ProfileForm />
        </main>
      </div>
    </SidebarProvider>
  );
}
