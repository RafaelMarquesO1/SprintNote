"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Label({ className, srOnly, ...props }: React.ComponentProps<"label"> & { srOnly?: boolean }) {
  return (
    <label
      data-slot="label"
      className={cn(
        srOnly
          ? "sr-only"
          : "flex items-center gap-2 text-small font-medium text-ink-soft select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-40 peer-disabled:cursor-not-allowed peer-disabled:opacity-40",
        className
      )}
      {...props}
    />
  )
}

export { Label }
