import { Suspense } from "react"

import { PaginaLivro } from "@/components/livros/pagina-livro"
import { Skeleton } from "@/components/ui/skeleton"

// Rafael Marques - 20/10/2026
// Os livros ficam no navegador: o id é lido aqui e o resto acontece no cliente.
export default function RotaLivro({ params }: PageProps<"/livros/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-64 max-w-4xl" />}>
      {params.then(({ id }) => (
        <PaginaLivro key={id} id={id} />
      ))}
    </Suspense>
  )
}
