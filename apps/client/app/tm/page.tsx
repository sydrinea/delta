"use client";

import { TmWorkbench } from "@/components/workbench/TmWorkbench";

export default function TMPage() {
  return (
    <section className="flex flex-1 min-h-0 md:flex-col md:h-[calc(100dvh-3.5rem)] md:overflow-hidden">
      <TmWorkbench />
    </section>
  );
}
