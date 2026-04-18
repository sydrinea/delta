import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/lib/utils"

const textVariants = cva(
  "text-foreground",
  {
    variants: {
      variant: {
        default: "text-base",
        lead: "text-sm md:text-md leading-relaxed max-w-md",
        body: "text-sm leading-relaxed",
        muted: "text-sm text-muted-foreground font-sans",
        code: "font-mono text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: React.ElementType
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, as: Comp = "p", ...props }, ref) => {
    return (
      <Comp
        ref={ref}
        className={cn(textVariants({ variant, className }))}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"
