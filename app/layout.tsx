import { MobileNav } from "@/components/MobileNav";
import Link from "next/link";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          {/* Sidebar pour desktop */}
          <div className="hidden md:flex w-64 border-r">
            <Sidebar />
          </div>

          {/* Layout mobile */}
          <div className="flex flex-col w-full">
            <div className="md:hidden flex items-center border-b p-4">
              <MobileNav />
              <h1 className="text-xl font-bold mx-auto">Habit Tracker</h1>
            </div>

            <main className="flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
