import type { IconProps } from './shared'
import { siGithub } from 'simple-icons/icons'

export function GitHub({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml -- simple-icons provides trusted static SVG markup for the official GitHub icon.
      dangerouslySetInnerHTML={{ __html: siGithub.svg }}
    />
  )
}
