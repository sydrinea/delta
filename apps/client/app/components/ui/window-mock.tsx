import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface WindowMockTab {
  value: string
  label: string
  content: React.ReactNode
}

interface WindowMockProps {
  title?: string
  className?: string
  children?: React.ReactNode
  tabs?: WindowMockTab[]
  defaultTab?: string
}

// Title bar is h-10 (py-2 + 12px dots). Content area fills the rest.
const CHROME_HEIGHT = 'h-13'
const CONTENT_HEIGHT = 'h-[calc(100%-2.5rem)]'

export function WindowMock({ title, className, children, tabs, defaultTab }: WindowMockProps) {
  return (
    <div className={cn('rounded-2xl border border-ctp-surface0 bg-ctp-mantle overflow-hidden', className)}>
      {tabs
        ? (
            <Tabs defaultValue={defaultTab ?? tabs[0]?.value} className="flex-col gap-0 h-full">
              <div className={cn('flex items-center gap-1.5 px-4 bg-ctp-crust border-b border-ctp-surface0', CHROME_HEIGHT)}>
                <span className="w-3 h-3 rounded-full bg-ctp-red" />
                <span className="w-3 h-3 rounded-full bg-ctp-yellow" />
                <span className="w-3 h-3 rounded-full bg-ctp-green" />
                <TabsList className="ml-2">
                  {tabs.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <div className={cn('relative', CONTENT_HEIGHT)}>
                {tabs.map(tab => (
                  <TabsContent key={tab.value} value={tab.value} className="absolute inset-0 overflow-auto mt-0">
                    {tab.content}
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          )
        : (
            <>
              <div className={cn('flex items-center gap-1.5 px-4 bg-ctp-crust border-b border-ctp-surface0', CHROME_HEIGHT)}>
                <span className="w-3 h-3 rounded-full bg-ctp-red" />
                <span className="w-3 h-3 rounded-full bg-ctp-yellow" />
                <span className="w-3 h-3 rounded-full bg-ctp-green" />
                {title && <span className="ml-3 text-xs font-mono text-ctp-overlay0">{title}</span>}
              </div>
              <div className="overflow-x-auto">{children}</div>
            </>
          )}
    </div>
  )
}

export type { WindowMockTab }
