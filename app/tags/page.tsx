import { Suspense } from "react"
import type { Metadata } from "next"

import { PaginaTags } from "@/components/tags/pagina-tags"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Tags · SprintNote" }

// A tag escolhida vem da URL (?tag=), lida no navegador: por isso o <Suspense>.
export default function RotaTags() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-64 max-w-4xl" />}>
      <PaginaTags />
    </Suspense>
  )
}
