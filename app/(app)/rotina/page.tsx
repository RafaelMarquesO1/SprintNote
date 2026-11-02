import type { Metadata } from "next"

import { PaginaRotina } from "@/components/features/routine/pagina-rotina"

export const metadata: Metadata = { title: "Rotina" }

// Rotina (8.7): lista do dia com a linha do agora, semana e calendário.
export default function RotinaPage() {
  return <PaginaRotina />
}
