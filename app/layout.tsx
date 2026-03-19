import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Delta — theory of computation tools",
  description: "Create, test, and visualize DFAs and NFAs, with more to come!",
  creator: "Sydney Newmark",
  openGraph: {
    type: "website",
    url: "https://comptheory.tools",
    title: "Delta — theory of computation tools",
    description:
      "Create, test, and visualize DFAs and NFAs, with more to come!",
    siteName: "Delta — theory of computation tools",
  },
};

export const viewport: Viewport = {
  themeColor: "#8839ef",
  initialScale: 1,
  width: "device-width",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="latte overscroll-none">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main className="h-dvh bg-ctp-base flex flex-col overflow-hidden font-mono">
          <Navbar />
          {children}
        </main>
      </body>
    </html>
  );
}
