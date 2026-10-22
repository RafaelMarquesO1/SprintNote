"use client"

import { usePathname, useRouter } from "next/navigation"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useKanban } from "@/lib/estado/kanban"
import { useNotas } from "@/lib/estado/notas"
import type { Livro } from "@/lib/tipos"

// Rafael Marques - 20/10/2026
// Excluir livro: o usuário escolhe se as notas viram notas soltas ou se vão junto.
export function DialogoExcluirLivro({ livro, aoMudarAberto }: { livro: Livro | null; aoMudarAberto: (aberto: boolean) => void }) {
  const router = useRouter()
  const caminho = usePathname()
  const excluirLivro = useNotas((estado) => estado.excluirLivro)
  const desvincularNotas = useKanban((estado) => estado.desvincularNotas)
  const totalNotas = useNotas((estado) => estado.notas.filter((nota) => nota.livroId === livro?.id).length)

  function excluir(manterNotas: boolean) {
    if (!livro) return
    const removidas = excluirLivro(livro.id, manterNotas)
    desvincularNotas(removidas)
    aoMudarAberto(false)
    if (caminho === `/livros/${livro.id}` || removidas.some((id) => caminho === `/notas/${id}`)) router.push("/notas")
  }

  return (
    <AlertDialog open={livro !== null} onOpenChange={aoMudarAberto}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir o livro “{livro?.titulo}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {totalNotas > 0
              ? `Ele tem ${totalNotas} nota(s). Você pode mantê-las como notas soltas ou excluir tudo.`
              : "O livro está vazio. Essa ação não pode ser desfeita."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {totalNotas > 0 && (
            <Button variant="outline" onClick={() => excluir(true)}>
              Manter notas
            </Button>
          )}
          <Button variant="destructive" onClick={() => excluir(false)}>
            {totalNotas > 0 ? "Excluir tudo" : "Excluir"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
