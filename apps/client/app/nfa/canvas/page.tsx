import { Workbench } from '@/components'

export default function NFACanvasPage() {
  return (
    <section className="flex flex-col flex-1 h-full overflow-hidden">
      <Workbench.NFA initialTab="canvas" />
    </section>
  )
}
