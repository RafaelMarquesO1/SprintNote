// Rafael Marques - 23/10/2026
// Foto ou iniciais de uma pessoa (colegas de equipe, responsável do cartão, comentários).

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function iniciaisDe(nome: string) {
  return (
    nome
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join("") || "?"
  )
}

export function AvatarPessoa({
  nome,
  foto,
  tamanho = "default",
  className,
}: {
  nome: string
  foto?: string | null
  tamanho?: "default" | "sm" | "lg"
  className?: string
}) {
  return (
    <Avatar size={tamanho} className={cn(className)} title={nome}>
      {foto && <AvatarImage src={foto} alt="" />}
      <AvatarFallback>{iniciaisDe(nome)}</AvatarFallback>
    </Avatar>
  )
}
