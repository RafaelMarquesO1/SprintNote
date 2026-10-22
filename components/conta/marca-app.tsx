import { NotebookPenIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Rafael Marques - 21/10/2026
// Ícone do SprintNote num quadrado com a cor principal (abertura e login).
export function IconeApp({ tamanho = "md", className }: { tamanho?: "md" | "lg"; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary text-primary-foreground shadow-lg shadow-primary/25",
        tamanho === "lg" ? "size-20 rounded-3xl [&_svg]:size-10" : "size-9 rounded-xl [&_svg]:size-5",
        className
      )}
    >
      <NotebookPenIcon aria-hidden />
    </span>
  )
}
