import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Input (seção 6): default com borda line-strong; "bare" sem borda (usado no capture).
// Sempre acompanhado de <Label> (pode ser sr-only). Erro: aria-invalid + aria-describedby.
const inputVariants = cva(
  "w-full min-w-0 font-sans text-body text-paper transition-colors duration-fast outline-none placeholder:text-ink-muted file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-small file:font-medium file:text-paper disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "h-control rounded-md border border-line-strong bg-transparent px-3 hover:border-ink-muted focus-visible:border-paper focus-visible:outline-none aria-invalid:border-paper",
        bare: "h-control border-0 bg-transparent px-0 focus-visible:outline-none",
      },
      inputSize: {
        sm: "h-control-sm text-ui",
        md: "",
        lg: "h-control-lg",
      },
    },
    defaultVariants: { variant: "default", inputSize: "md" },
  }
)

function Input({
  className,
  type,
  variant,
  inputSize,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return <InputPrimitive type={type} data-slot="input" className={cn(inputVariants({ variant, inputSize }), className)} {...props} />
}

// Mensagem de erro abaixo do campo: texto + ícone, sem vermelho (3.1).
function FieldError({ id, children, className }: { id: string; children?: React.ReactNode; className?: string }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className={cn("mt-1.5 flex items-start gap-1.5 text-small text-paper", className)}>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-0.5 size-3.5 shrink-0">
        <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5v4.25M8 11.1v.15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </p>
  )
}

export { FieldError, Input, inputVariants }
