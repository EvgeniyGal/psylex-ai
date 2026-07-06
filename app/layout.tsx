import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import { ConditionalSiteFooter } from "@/components/conditional-site-footer";
import "./globals.css";
import { Toaster } from "sonner";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "PsyLex - Professional Legal Resolution",
  description: "PsyLex MVP first look",
  icons: {
    icon: "/logo.webp",
    apple: "/logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${ibmPlexSans.variable} ${newsreader.variable} min-h-screen bg-paper font-sans text-body-md text-ink antialiased`}
      >
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <div className="flex-grow">{children}</div>
            <ConditionalSiteFooter />
          </div>
        </AppProviders>
        <Toaster richColors />
      </body>
    </html>
  );
}
