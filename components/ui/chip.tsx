import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Chip (seção 6): tags sempre monocromáticas. "filter" e "day" alternam (ligado = fundo paper).
const chipVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 border font-sans font-medium whitespace-nowrap transition-colors duration-fast outline-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        tag: "h-6 rounded-full border-line-strong px-2.5 text-micro text-ink",
        filter:
          "h-control-sm rounded-full border-line-strong px-3 text-small text-ink hover:border-ink-muted aria-pressed:border-paper aria-pressed:bg-paper aria-pressed:text-night",
        day: "h-control min-w-11 rounded-sm border-line-strong px-2 text-small text-ink-soft hover:border-ink-muted aria-pressed:border-paper aria-pressed:bg-paper aria-pressed:font-semibold aria-pressed:text-night",
        dashed: "h-6 rounded-full border-dashed border-line-strong px-2.5 text-micro text-ink-soft hover:text-paper",
      },
    },
    defaultVariants: { variant: "tag" },
  }
)

type ChipProps = VariantProps<typeof chipVariants> & { className?: string; children: React.ReactNode }

// Chip estático (tag, rótulo).
function Chip({ variant, className, children, ...props }: ChipProps & React.ComponentProps<"span">) {
  return (
    <span data-slot="chip" className={cn(chipVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}

// Chip alternável (filtro, dia): botão com aria-pressed.
function ToggleChip({
  pressed,
  onPressedChange,
  variant = "filter",
  className,
  children,
  ...props
}: ChipProps & Omit<React.ComponentProps<"button">, "onChange"> & { pressed: boolean; onPressedChange: (pressed: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(chipVariants({ variant }), "cursor-pointer", className)}
      {...props}
    >
      {children}
    </button>
  )
}

export { Chip, ToggleChip, chipVariants }
