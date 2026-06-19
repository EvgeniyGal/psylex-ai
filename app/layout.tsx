import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "PsyLex - Professional Legal Resolution",
  description: "PsyLex MVP first look",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className="dark" lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} min-h-screen bg-surface font-sans text-on-surface antialiased`}>
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <div className="flex-grow">{children}</div>
            <SiteFooter />
          </div>
        </AppProviders>
        <Toaster richColors />
      </body>
    </html>
  );
}
