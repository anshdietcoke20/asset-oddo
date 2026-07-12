import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AssetFlow",
  description: "Enterprise Asset & Resource Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-canvas-dark text-body">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
