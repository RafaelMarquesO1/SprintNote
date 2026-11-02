import type { Metadata } from "next"
import { Suspense } from "react"

import { PaginaHabitos as Habitos } from "@/components/features/habits/pagina-habitos"

export const metadata: Metadata = { title: "Hábitos" }

export default function PaginaHabitos() {
  // useSearchParams (?criar=1) precisa de Suspense com Cache Components.
  return (
    <Suspense fallback={null}>
      <Habitos />
    </Suspense>
  )
}
