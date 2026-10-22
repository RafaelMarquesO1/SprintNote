import type { Metadata } from "next"

import { PainelHabitos } from "@/components/habitos/painel-habitos"

export const metadata: Metadata = { title: "Hábitos · SprintNote" }

export default function PaginaHabitos() {
  return <PainelHabitos />
}
