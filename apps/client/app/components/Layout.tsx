import Navbar from "@/components/Navbar";
import { AlertProvider } from "@/components/AlertProvider";
import { Loader } from "@/components/Loader";
import { ToastProvider } from "./ToastProvider";
import { OfflineReadyToast } from "./OfflineReadyToast";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AlertProvider>
        <main className="relative h-dvh flex flex-col font-mono">
          <Loader />
          <Navbar />
          {children}
          <OfflineReadyToast />
        </main>
      </AlertProvider>
    </ToastProvider>
  );
}
