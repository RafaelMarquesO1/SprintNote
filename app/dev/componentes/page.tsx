import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Vitrine } from "./vitrine"

export const metadata: Metadata = { title: "Componentes · SprintNote", robots: { index: false } }

// Página interna (fase 2): cada componente em todos os estados, nos dois temas. Só em desenvolvimento.
export default function PaginaComponentes() {
  if (process.env.NODE_ENV === "production") notFound()
  return <Vitrine />
}
