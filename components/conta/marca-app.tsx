import { LogoMark } from "@/components/brand/logo"

// Ícone do SprintNote (abertura, login, novidades). Redesign v2: usa o logotipo novo.
export function IconeApp({ tamanho = "md", className }: { tamanho?: "md" | "lg"; className?: string }) {
  return <LogoMark size={tamanho === "lg" ? 72 : 36} className={className} />
}
