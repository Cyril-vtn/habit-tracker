import "./globals.css";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Sidebar />
        <main className="pl-64">
          <div className="container mx-auto p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
