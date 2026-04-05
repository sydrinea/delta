import Link from 'next/link'
import { cn } from '@/lib/utils'

export type FeatureCardVariant = 'sapphire' | 'blue' | 'green' | 'red' | 'mauve' | 'peach' | 'teal' | 'lavender'

export interface FeatureCardProps {
  title: string
  description: string
  href: string
  label: string
  variant: FeatureCardVariant
  external?: boolean
  onClick?: () => void
  className?: string
}

const variantStyles: Record<FeatureCardVariant, { container: string, text: string }> = {
  sapphire: {
    container: 'bg-ctp-sapphire/10 hover:bg-ctp-sapphire/20 border-ctp-sapphire/25 shadow-ctp-sapphire/10',
    text: 'text-ctp-sapphire',
  },
  blue: {
    container: 'bg-ctp-blue/10 hover:bg-ctp-blue/20 border-ctp-blue/25 shadow-ctp-blue/10',
    text: 'text-ctp-blue',
  },
  green: {
    container: 'bg-ctp-green/10 hover:bg-ctp-green/20 border-ctp-green/25 shadow-ctp-green/10',
    text: 'text-ctp-green',
  },
  red: {
    container: 'bg-ctp-red/10 hover:bg-ctp-red/20 border-ctp-red/25 shadow-ctp-red/10',
    text: 'text-ctp-red',
  },
  mauve: {
    container: 'bg-ctp-mauve/10 hover:bg-ctp-mauve/20 border-ctp-mauve/25 shadow-ctp-mauve/10',
    text: 'text-ctp-mauve',
  },
  peach: {
    container: 'bg-ctp-peach/10 hover:bg-ctp-peach/20 border-ctp-peach/25 shadow-ctp-peach/10',
    text: 'text-ctp-peach',
  },
  teal: {
    container: 'bg-ctp-teal/10 hover:bg-ctp-teal/20 border-ctp-teal/25 shadow-ctp-teal/10',
    text: 'text-ctp-teal',
  },
  lavender: {
    container: 'bg-ctp-lavender/10 hover:bg-ctp-lavender/20 border-ctp-lavender/25 shadow-ctp-lavender/10',
    text: 'text-ctp-lavender',
  },
}

export function FeatureCard({
  title,
  description,
  href,
  label,
  variant,
  external,
  onClick,
  className,
}: FeatureCardProps) {
  const styles = variantStyles[variant]

  const containerClasses = cn(
    'group relative rounded-xl border p-5 transition-all duration-300 overflow-hidden shadow-lg',
    styles.container,
    className,
  )

  const content = (
    <>
      <div className="flex items-start justify-between mb-2">
        <h2 className={cn('text-sm font-semibold font-mono', styles.text)}>{title}</h2>
        <span className={cn('text-xs font-mono transition-colors duration-200', styles.text)}>
          {label}
        </span>
      </div>
      <p className="font-sans text-ctp-subtext1 leading-relaxed">
        {description}
      </p>
    </>
  )

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={containerClasses}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={href} onClick={onClick} className={containerClasses}>
      {content}
    </Link>
  )
}
