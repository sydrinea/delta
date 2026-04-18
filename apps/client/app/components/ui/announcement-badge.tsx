import type { VariantProps } from 'class-variance-authority'
import { ExternalLink } from 'lucide-react'

import { cn } from '@/app/lib/utils'
import { badgeVariants } from '@/components/ui/badge'

interface AnnouncementBadgeProps {
  label: string
  href?: string
  variant?: VariantProps<typeof badgeVariants>['variant'] | 'rainbow'
  className?: string
}

function AnnouncementBadge({ label, href, variant = 'accent', className }: AnnouncementBadgeProps) {
  const Comp = href ? 'a' : 'span'
  const linkProps = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {}

  const baseClass = cn(
    'h-7 px-3 text-xs gap-1.5 inline-flex items-center rounded-full whitespace-nowrap font-medium',
    href && 'cursor-pointer hover:opacity-80 transition-opacity',
    className,
  )

  if (variant === 'rainbow') {
    return (
      <div className="rounded-full bg-linear-to-r from-destructive via-primary to-primary p-px shadow-sm shadow-primary/30">
        <Comp
          data-slot="announcement-badge"
          data-variant="rainbow"
          className={cn(baseClass, 'bg-background text-muted-foreground')}
          {...linkProps}
        >
          {label}
          {href && <ExternalLink className="size-3 shrink-0" aria-hidden="true" />}
        </Comp>
      </div>
    )
  }

  return (
    <Comp
      data-slot="announcement-badge"
      data-variant={variant}
      className={cn(
        badgeVariants({ variant }),
        baseClass,
        'shadow-sm',
      )}
      {...linkProps}
    >
      {label}
      {href && <ExternalLink className="size-3 shrink-0" aria-hidden="true" />}
    </Comp>
  )
}

export { AnnouncementBadge }
