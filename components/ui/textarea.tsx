import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-md border border-line-strong bg-transparent px-3 py-2.5 font-sans text-body text-paper transition-colors duration-fast outline-none placeholder:text-ink-muted hover:border-ink-muted focus-visible:border-paper focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-paper",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
