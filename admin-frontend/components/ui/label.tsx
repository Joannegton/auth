import { cn } from "@/lib/utils"
import { forwardRef, type LabelHTMLAttributes } from "react"

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium text-foreground leading-none",
          className,
        )}
        {...props}
      />
    )
  },
)
Label.displayName = "Label"
