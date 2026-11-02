"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { abrirCriar } from "@/components/shell/estado"
import { ITEM_BIBLIOTECA, ITEM_HOJE, ITENS_FAZER, itemAtivo, type ItemNav } from "@/components/shell/navegacao"

// Barra inferior do celular (10): Hoje, Tarefas, Criar (+), Quadros, Biblioteca. Alvos de 48px e safe-area.
const ESQUERDA: ItemNav[] = [ITEM_HOJE, ITENS_FAZER[0]]
const DIREITA: ItemNav[] = [ITENS_FAZER[3], ITEM_BIBLIOTECA]

export function BarraInferior() {
  const caminho = usePathname()
  const ativoBiblioteca = caminho === "/notas" || caminho.startsWith("/notas/") || caminho === "/grafo" || caminho === "/tags"

  const item = (nav: ItemNav) => {
    const ativo = nav === ITEM_BIBLIOTECA ? ativoBiblioteca : itemAtivo(caminho, nav.href)
    const Icone = nav.icone
    return (
      <li key={nav.href} className="flex-1">
        <Link
          href={nav.href}
          aria-current={ativo ? "page" : undefined}
          className={cn("flex h-12 flex-col items-center justify-center gap-0.5 text-micro font-medium", ativo ? "text-paper" : "text-ink-soft")}
        >
          <Icone aria-hidden="true" className={cn("size-5", ativo && "text-ember")} />
          {nav.rotulo}
        </Link>
      </li>
    )
  }

  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-line bg-night/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="flex items-center px-2 pt-1">
        {ESQUERDA.map(item)}
        <li className="flex flex-1 justify-center">
          <button type="button" onClick={abrirCriar} aria-label="Criar" className="flex size-12 items-center justify-center rounded-full bg-paper text-night">
            <PlusIcon aria-hidden="true" className="size-5.5" />
          </button>
        </li>
        {DIREITA.map(item)}
      </ul>
    </nav>
  )
}
