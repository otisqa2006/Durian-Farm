import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { AppProvider } from "@/providers/AppProvider";

export const metadata: Metadata = {
  title: "OM Farm - Quản lý Thu Chi Rẫy Sầu Riêng",
  description: "Ứng dụng quản lý tài chính nội bộ cho rẫy sầu riêng. Theo dõi dòng thu, dòng chi, quỹ phân tương và công nợ.",
  keywords: ["sầu riêng", "quản lý tài chính", "thu chi", "rẫy"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OM Farm",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased overflow-x-hidden">
      <body className="min-h-full overflow-x-hidden w-full">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
