import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "PsyLex Human-Centric Landing Page",
  description: "PsyLex MVP first look",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text antialiased">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
