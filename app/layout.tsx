import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import "./globals.css";
import { AppSidebar } from "@/components/AppSidebar";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body className={!session ? "" : "overflow-hidden"}>{children}</body>
    </html>
  );
}
