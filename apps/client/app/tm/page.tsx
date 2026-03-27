"use client";

import { simulateTM } from "@delta/simulator";
import { Workbench } from "@/components/workbench/Workbench";
import type { TuringMachine } from "@delta/build";

export default function TMPage() {
  return (
    <section className="flex md:flex-col md:h-screen md:overflow-hidden">
      <Workbench<TuringMachine>
        simulate={(machine, input) => simulateTM(machine, input).accepted}
        storeScope="tm"
        enabledTabs={{
          editor: true,
          canvas: false,
          visualizer: true,
        }}
      />
    </section>
  );
}
