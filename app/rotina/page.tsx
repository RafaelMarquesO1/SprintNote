import type { Metadata } from "next"

import { PainelRotina } from "@/components/rotina/painel-rotina"

export const metadata: Metadata = { title: "Rotina · SprintNote" }

export default function PaginaRotina() {
  return <PainelRotina />
}
