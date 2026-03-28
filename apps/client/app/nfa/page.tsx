"use client";

import { simulate } from "@delta/simulator";
import { Workbench } from "@/components/workbench/Workbench";
// import { WhatsNewModal } from "@/components/WhatsNewModal";
import type { NFA } from "@delta/build";

export default function Page() {
  return (
    <section className="flex md:flex-col md:h-screen md:overflow-hidden">
      <Workbench<NFA>
        simulate={(machine, input) => simulate(machine, input).accepted}
        storeScope="nfa"
        enabledTabs={{
          editor: true,
          canvas: true,
          visualizer: true,
        }}
      />
      {/* <WhatsNewModal /> */}
    </section>
  );
}
