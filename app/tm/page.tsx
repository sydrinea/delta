"use client";

import { simulate } from "@/lib/simulator/tm";
import { Workbench } from "@/components/workbench/Workbench";
import type { TuringMachine } from "@/lib/compiler/tm";

export default function TMPage() {
  return (
    <section className="flex md:flex-col md:h-screen md:overflow-hidden">
      <Workbench<TuringMachine>
        simulate={(machine, input) => simulate(machine, input).accepted}
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
