import { cn } from '@/lib/utils'

export type FeatureCardVariant = 'sapphire' | 'blue' | 'green' | 'red' | 'mauve' | 'peach' | 'teal' | 'lavender'

export interface FeatureCardProps {
  title: string
  description: string
  variant: FeatureCardVariant
  className?: string
}

const variantStyles: Record<FeatureCardVariant, { container: string, text: string }> = {
  sapphire: {
    container: 'bg-primary/10 hover:bg-primary/20 border-primary/25 shadow-primary/10',
    text: 'text-primary',
  },
  blue: {
    container: 'bg-primary/10 hover:bg-primary/20 border-primary/25 shadow-primary/10',
    text: 'text-primary',
  },
  green: {
    container: 'bg-success/10 hover:bg-success/20 border-success/25 shadow-success/10',
    text: 'text-success',
  },
  red: {
    container: 'bg-destructive/10 hover:bg-destructive/20 border-destructive/25 shadow-destructive/10',
    text: 'text-destructive',
  },
  mauve: {
    container: 'bg-primary/10 hover:bg-primary/20 border-primary/25 shadow-primary/10',
    text: 'text-primary',
  },
  peach: {
    container: 'bg-warning/10 hover:bg-warning/20 border-warning/25 shadow-warning/10',
    text: 'text-warning',
  },
  teal: {
    container: 'bg-success/10 hover:bg-success/20 border-success/25 shadow-success/10',
    text: 'text-success',
  },
  lavender: {
    container: 'bg-primary/10 hover:bg-primary/20 border-primary/25 shadow-primary/10',
    text: 'text-primary',
  },
}

export function FeatureCard({
  title,
  description,
  variant,
  className,
}: FeatureCardProps) {
  const styles = variantStyles[variant]

  return (
    <div className={cn(
      'group relative rounded-xl border p-5 transition-all duration-300 overflow-hidden shadow-lg',
      styles.container,
      className,
    )}
    >
      <div className="flex items-start justify-between mb-2">
        <h2 className={cn('text-md font-semibold font-sans leading-none', styles.text)}>{title}</h2>
      </div>
      <p className="text-sm font-sans text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}
