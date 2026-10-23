// Rafael Marques - 23/10/2026
import { Suspense } from "react"
import type { Metadata } from "next"

import { PaginaConvite } from "@/components/equipes/pagina-convite"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Convite · SprintNote" }

// O token vem na URL: só é lido aqui e o resto acontece no cliente.
// O <Suspense> é exigido pelo Cache Components (igual às notas).
export default function PaginaDoConvite({ params }: PageProps<"/convite/[token]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-40 w-full max-w-3xl" />}>
      {params.then(({ token }) => (
        <PaginaConvite key={token} token={token} />
      ))}
    </Suspense>
  )
}
