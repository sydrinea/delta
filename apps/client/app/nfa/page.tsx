"use client";

import { simulate } from "@delta/simulator";
import { Workbench } from "@/components/workbench/Workbench";
import type { NFA } from "@delta/build";

export default function Page() {
  return (
    <section className="flex flex-1 min-h-0 md:flex-col md:h-[calc(100dvh-3.5rem)] md:overflow-hidden">
      <Workbench<NFA>
        simulate={(machine, input) => simulate(machine, input).accepted}
        storeScope="nfa"
        enabledTabs={{
          editor: true,
          canvas: true,
          visualizer: true,
        }}
      />
    </section>
  );
}
