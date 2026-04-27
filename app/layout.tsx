import type { Metadata, Viewport } from "next";
import { ToasterProvider } from "@/components/toaster-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanban Board",
  description: "Trello-benzeri basit ve hızlı görev yönetimi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom'u açık bırakıyoruz — accessibility için kritik.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
