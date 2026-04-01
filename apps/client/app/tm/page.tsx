"use client";

import { simulateTM } from "@delta/simulator";
import { Workbench } from "@/components/workbench/Workbench";
import type { TuringMachine } from "@delta/build";

export default function TMPage() {
  return (
    <section className="flex flex-1 min-h-0 md:flex-col md:h-[calc(100dvh-3.5rem)] md:overflow-hidden">
      <Workbench<TuringMachine>
        simulate={(machine, input) =>
          simulateTM(machine, input, {
            maxSteps: Math.max(1000, input.length * 100),
          }).accepted
        }
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
