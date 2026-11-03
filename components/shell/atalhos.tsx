"use client"

import { useRouter } from "next/navigation"
import { useEffect, useEffectEvent, useState } from "react"

import { useConta } from "@/components/conta/portao-conta"
import { alternarPaleta } from "@/components/shell/command-palette"
import { abrirCriar, useShell } from "@/components/shell/estado"
import { Kbd } from "@/components/ui/kbd"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { alternarFiltroPorResponsavel, aplicarFiltroAtribuidosAMim, useFiltroAtribuidos } from "@/lib/estado/filtro-atribuidos"
import { useNotas } from "@/lib/estado/notas"

// Atalhos globais (7.3). Os de uma tecla não disparam em campos de texto nem no editor.
const IR_PARA: Record<string, string> = { h: "/", t: "/tarefas", b: "/habitos", r: "/rotina", q: "/kanban" }

function emCampoDeTexto(alvo: EventTarget | null) {
  if (!(alvo instanceof HTMLElement)) return false
  return alvo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName) || Boolean(alvo.closest("[contenteditable=true], [role=textbox]"))
}

export function Atalhos() {
  const router = useRouter()
  const alternarMenu = useShell((estado) => estado.alternarRecolhido)
  const criarNota = useNotas((estado) => estado.criarNota)
  const [ajuda, setAjuda] = useState(false)
  // Rafael Marques - 03/11/2026: id de quem está logado, para o atalho "Atribuídos a mim".
  const meuId = useConta()?.usuario.id ?? null

  const aoTeclar = useEffectEvent((evento: KeyboardEvent) => {
    const mod = evento.ctrlKey || evento.metaKey
    if (mod && evento.key.toLowerCase() === "k") {
      evento.preventDefault()
      alternarPaleta()
      return
    }
    // Rafael Marques - 03/11/2026: Mod+Shift+U liga o filtro "Atribuídos a mim" e abre os Quadros
    // (o mesmo que a busca faz); se o filtro já estiver ligado para mim, desliga.
    // Ctrl+Shift+A e Ctrl+Shift+Q são do navegador.
    if (mod && evento.shiftKey && !evento.altKey && evento.code === "KeyU") {
      evento.preventDefault()
      if (!meuId) return
      if (useFiltroAtribuidos.getState().responsavelId === meuId) {
        alternarFiltroPorResponsavel(meuId, "você")
        return
      }
      aplicarFiltroAtribuidosAMim(meuId)
      router.push("/kanban")
      return
    }
    if (mod && (evento.key === "\\" || evento.code === "Backslash" || evento.code === "IntlBackslash")) {
      evento.preventDefault()
      alternarMenu()
      return
    }
    if (mod || evento.altKey || evento.defaultPrevented || emCampoDeTexto(evento.target)) return
    // Algum dialog aberto: as teclas ficam com ele.
    if (document.querySelector("[role=dialog][data-open], [role=alertdialog]")) return

    const tecla = evento.key.toLowerCase()
    if (esperandoG) {
      esperandoG = false
      if (tecla === "n") {
        evento.preventDefault()
        router.push(`/notas/${criarNota().id}`)
      } else if (IR_PARA[tecla]) {
        evento.preventDefault()
        router.push(IR_PARA[tecla])
      }
      return
    }
    if (tecla === "g") {
      esperandoG = true
      setTimeout(() => (esperandoG = false), 1200)
    } else if (tecla === "c") {
      evento.preventDefault()
      abrirCriar()
    } else if (evento.key === "?") {
      evento.preventDefault()
      setAjuda(true)
    }
  })

  useEffect(() => {
    const ouvinte = (evento: KeyboardEvent) => aoTeclar(evento)
    window.addEventListener("keydown", ouvinte)
    return () => window.removeEventListener("keydown", ouvinte)
  }, [])

  return (
    <ResponsiveDialog open={ajuda} onOpenChange={setAjuda} title="Atalhos do teclado" width="sm">
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3 text-ui">
        {[
          ["Mod K", "Buscar ou criar"],
          ["Mod \\", "Recolher ou expandir o menu"],
          ["Mod Shift U", "Ligar ou desligar \"Atribuídos a mim\""],
          ["C", "Criar"],
          ["G H", "Ir para Hoje"],
          ["G T", "Ir para Tarefas"],
          ["G B", "Ir para Hábitos"],
          ["G R", "Ir para Rotina"],
          ["G Q", "Ir para Quadros"],
          ["G N", "Nova nota"],
          ["?", "Esta lista"],
          ["Esc", "Fechar o que estiver aberto"],
        ].map(([teclas, acao]) => (
          <div key={teclas} className="contents">
            <dt className="flex gap-1">
              {teclas.split(" ").map((tecla, indice) => (
                <Kbd key={indice}>{tecla === "Mod" ? "Mod" : tecla}</Kbd>
              ))}
            </dt>
            <dd className="text-ink">{acao}</dd>
          </div>
        ))}
      </dl>
    </ResponsiveDialog>
  )
}

let esperandoG = false
