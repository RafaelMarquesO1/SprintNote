import type { Metadata } from "next"
import { Suspense } from "react"

import { PaginaTarefas } from "@/components/features/tasks/pagina-tarefas"

export const metadata: Metadata = { title: "Tarefas" }

export default function TarefasPage() {
  // useSearchParams (?criar=1) precisa de Suspense com Cache Components.
  return (
    <Suspense fallback={null}>
      <PaginaTarefas />
    </Suspense>
  )
}
