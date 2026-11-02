import type { Metadata } from "next"

import { TopbarSlot } from "@/components/shell/estado"
import { PainelGrafo } from "@/components/grafo/painel-grafo"

export const metadata: Metadata = { title: "Grafo de conexões" }

export default function PaginaGrafo() {
  return (
    <>
      <TopbarSlot largura="bleed" />
      <PainelGrafo />
    </>
  )
}
