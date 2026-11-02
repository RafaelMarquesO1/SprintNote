import { Skeleton } from "@/components/ui/skeleton"

// Carregando (8.15): esqueleto com a forma da página (cabeçalho + blocos), nunca tela vazia.
export default function Carregando() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Carregando">
      <div className="space-y-3">
        <Skeleton variant="line" className="h-12 w-72" />
        <Skeleton variant="line" className="w-96 max-w-full" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton variant="block" className="h-80 rounded-xl" />
        <div className="space-y-5">
          <Skeleton variant="block" className="h-40 rounded-xl" />
          <Skeleton variant="block" className="h-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
