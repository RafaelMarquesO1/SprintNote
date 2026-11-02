import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

import { Spinner } from "@/components/ui/spinner"

// Button (seção 6). Variantes do redesign: primary, secondary, ghost, danger.
// Os nomes antigos (default, outline, destructive, link) continuam valendo para as telas que ainda não foram refeitas.
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-transparent font-sans text-ui font-semibold whitespace-nowrap transition-[background-color,border-color,color,scale] duration-fast ease-out outline-none select-none active:not-aria-[haspopup]:scale-98 active:duration-instant disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-paper [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-paper text-night hover:bg-ink",
        default: "bg-paper text-night hover:bg-ink",
        secondary: "border-line-strong bg-transparent text-paper hover:bg-raised aria-expanded:bg-raised",
        outline: "border-line-strong bg-transparent text-paper hover:bg-raised aria-expanded:bg-raised",
        ghost: "text-ink-soft hover:bg-raised hover:text-paper aria-expanded:bg-raised aria-expanded:text-paper",
        danger: "border-line-strong bg-transparent text-paper hover:bg-raised",
        destructive: "border-line-strong bg-transparent text-paper hover:bg-raised",
        // Só para a última confirmação de algo que não volta (ex.: "Excluir conta e dados").
        irreversible: "border-line-strong bg-transparent text-irreversivel hover:bg-raised",
        link: "h-auto! px-0! text-paper underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-control-sm px-3 text-small has-data-[icon=inline-start]:pl-2.5 has-data-[icon=inline-end]:pr-2.5",
        md: "h-control px-4 has-data-[icon=inline-start]:pl-3 has-data-[icon=inline-end]:pr-3",
        lg: "h-control-lg px-5 text-body",
        default: "h-control px-4 has-data-[icon=inline-start]:pl-3 has-data-[icon=inline-end]:pr-3",
        xs: "h-7 gap-1 rounded-xs px-2 text-micro [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-control",
        "icon-xs": "size-7 rounded-xs [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-control-sm",
        "icon-lg": "size-control-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    // Mostra um spinner à esquerda e mantém a largura do texto.
    loading?: boolean
  }

function Button({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? <Spinner className="size-3.5" /> : null}
      {children}
    </ButtonPrimitive>
  )
}

type IconButtonProps = Omit<ButtonProps, "aria-label" | "size"> & {
  // Botão só com ícone precisa de nome acessível (11.2 #5).
  "aria-label": string
  size?: "sm" | "md" | "lg"
}

// Alvo mínimo de 40px no desktop e 44px no toque.
function IconButton({ size = "md", variant = "ghost", className, ...props }: IconButtonProps) {
  const tamanho = size === "sm" ? "icon-sm" : size === "lg" ? "icon-lg" : "icon"
  return <Button variant={variant} size={tamanho} className={cn("pointer-coarse:min-h-11 pointer-coarse:min-w-11", className)} {...props} />
}

export { Button, IconButton, buttonVariants }
export type { ButtonProps }
