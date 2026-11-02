import { cn } from "@/lib/utils"

// Skeleton (M14): shimmer sutil line → raised, nas mesmas dimensões do conteúdo final.
function Skeleton({ className, variant = "block", ...props }: React.ComponentProps<"div"> & { variant?: "line" | "block" | "card" }) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "bg-line motion-safe:animate-shimmer",
        variant === "line" && "h-3.5 rounded-xs",
        variant === "block" && "rounded-sm",
        variant === "card" && "h-28 rounded-lg",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
