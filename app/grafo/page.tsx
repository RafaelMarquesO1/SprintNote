import type { Metadata } from "next"

import { PainelGrafo } from "@/components/grafo/painel-grafo"

export const metadata: Metadata = { title: "Grafo · SprintNote" }

export default function PaginaGrafo() {
  return <PainelGrafo />
}
