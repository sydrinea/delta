import Navbar from "@/components/Navbar";
import { AlertProvider } from "@/components/AlertProvider";
import { Loader } from "@/components/Loader";

export default function Layout({ children }: { children: React.ReactNode }) {
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
