import type { Metadata, Viewport } from "next";
import { Syne, Recursive } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AlertProvider } from "@/components/AlertProvider";
import { Loader } from "@/components/Loader";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const recursiveMono = Recursive({
  variable: "--font-recursive-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Delta — theory of computation tools",
  description: "Create, test, and visualize DFAs and NFAs, with more to come!",
  creator: "Sydney Newmark",
  metadataBase: new URL("https://comptheory.tools"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://comptheory.tools",
    title: "Delta — theory of computation tools",
    description:
      "Create, test, and visualize DFAs and NFAs, with more to come!",
    siteName: "Delta — theory of computation tools",
    images: [
      {
        url: "/android-chrome-192x192.png",
        width: 64,
        height: 64,
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#8839ef",
  initialScale: 1,
  width: "device-width",
  colorScheme: "light",
};

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlertProvider>
      <main className="relative h-dvh flex flex-col font-mono">
        <Loader />
        <Navbar />
        {children}
      </main>
    </AlertProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`latte overscroll-none bg-ctp-base ${recursiveMono.variable} ${syne.variable} antialiased font-sans`}
    >
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
