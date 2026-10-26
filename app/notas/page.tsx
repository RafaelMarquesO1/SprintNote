import { Suspense } from "react"
import type { Metadata } from "next"

import { ExploradorBiblioteca } from "@/components/biblioteca/explorador"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Biblioteca · SprintNote" }

// Rafael Marques - 26/10/2026: a Biblioteca agora é um explorador (estrutura à esquerda, conteúdo à direita).
export default function NotasPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ExploradorBiblioteca />
    </Suspense>
  )
}
