import { Suspense } from "react"

import { EditorNota } from "@/components/notas/editor-nota"
import { Skeleton } from "@/components/ui/skeleton"

// Rafael Marques - 20/10/2026
// As notas ficam no navegador, então o id só é lido aqui e o resto
// acontece no cliente. O <Suspense> é exigido pelo Cache Components.
export default function PaginaNota({ params }: PageProps<"/notas/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      {params.then(({ id }) => (
        <EditorNota key={id} id={id} />
      ))}
    </Suspense>
  )
}
