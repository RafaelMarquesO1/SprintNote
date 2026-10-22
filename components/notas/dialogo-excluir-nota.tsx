"use client"

import { usePathname, useRouter } from "next/navigation"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useKanban } from "@/lib/estado/kanban"
import { useNotas } from "@/lib/estado/notas"
import type { Nota } from "@/lib/tipos"

// Rafael Marques - 20/10/2026
// Confirmação antes de excluir uma nota (e suas subnotas).
export function DialogoExcluirNota({
  nota,
  aoMudarAberto,
}: {
  nota: Nota | null
  aoMudarAberto: (aberto: boolean) => void
}) {
  const router = useRouter()
  const caminho = usePathname()
  const excluirNota = useNotas((estado) => estado.excluirNota)
  const desvincularNotas = useKanban((estado) => estado.desvincularNotas)
  const totalSubnotas = useNotas(
    (estado) => estado.notas.filter((item) => item.paiId === nota?.id).length
  )

  function confirmarExclusao() {
    if (!nota) return
    const removidas = excluirNota(nota.id)
    desvincularNotas(removidas)
    aoMudarAberto(false)
    // Se a nota aberta foi excluída, volta para a lista de notas.
    if (removidas.some((id) => caminho === `/notas/${id}`)) {
      router.push("/notas")
    }
  }

  return (
    <AlertDialog open={nota !== null} onOpenChange={aoMudarAberto}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{nota?.titulo}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {totalSubnotas > 0
              ? "As subnotas também serão excluídas. Essa ação não pode ser desfeita."
              : "Essa ação não pode ser desfeita."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirmarExclusao}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
