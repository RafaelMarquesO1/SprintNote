"use client"

// Rafael Marques - 04/11/2026 (v1.5a)
// Dica de uso no canto da tela: aparece sozinha de vez em quando (depois de um tempo usando o app e
// no máximo uma a cada dois dias), nunca junto com "O que há de novo", e some com um clique.
// "Dicas de uso" no menu da conta abre uma na hora. As dicas ficam em lib/dicas.ts.

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { LightbulbIcon, XIcon } from "lucide-react"
import { create } from "zustand"

import { Button, IconButton } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { useHidratado } from "@/hooks/use-hidratado"
import { DICAS, ESPERA_DICA, INTERVALO_DICAS, proximaDica, type Dica } from "@/lib/dicas"
import { usePreferencias } from "@/lib/estado/preferencias"
import { novidadesNaoVistas } from "@/lib/novidades"

// Dica na tela e as já mostradas nesta visita ("Outra dica" não repete).
const useDicaAtual = create<{ dica: Dica | null; daVisita: string[] }>(() => ({ dica: null, daVisita: [] }))

function mostrar(dica: Dica | null) {
  if (dica) {
    useDicaAtual.setState((estado) => ({ dica, daVisita: [...estado.daVisita, dica.id] }))
    usePreferencias.getState().marcarDicaVista(dica.id)
  } else useDicaAtual.setState({ dica: null })
}

// "Dicas de uso" no menu da conta: mostra uma agora (se todas já foram vistas, recomeça a lista).
export function abrirDicaDeUso() {
  const caminho = window.location.pathname
  const { daVisita } = useDicaAtual.getState()
  mostrar(proximaDica(usePreferencias.getState().dicasVistas ?? [], caminho) ?? proximaDica([], caminho, daVisita) ?? DICAS[0])
}

export function DicaOcasional() {
  const hidratado = useHidratado()
  const caminho = usePathname()
  const vistas = usePreferencias((estado) => estado.dicasVistas ?? [])
  const ultimaEm = usePreferencias((estado) => estado.ultimaDicaEm ?? null)
  const desligadas = usePreferencias((estado) => Boolean(estado.dicasDesligadas))
  const novidadesVistas = usePreferencias((estado) => estado.novidadesVistas)
  const definirDesligadas = usePreferencias((estado) => estado.definirDicasDesligadas)
  const dica = useDicaAtual((estado) => estado.dica)
  const setDica = mostrar

  const temNovidade = novidadesNaoVistas(novidadesVistas).length > 0

  // Aparece sozinha: depois de ESPERA_DICA usando o app, se já passou o intervalo e há dica nova.
  useEffect(() => {
    if (!hidratado || desligadas || temNovidade || dica) return
    if (ultimaEm && Date.now() - ultimaEm < INTERVALO_DICAS) return
    if (!proximaDica(vistas, caminho)) return
    const espera = setTimeout(() => {
      const escolhida = proximaDica(usePreferencias.getState().dicasVistas ?? [], window.location.pathname)
      if (!escolhida || document.querySelector("[role=dialog][data-open], [role=alertdialog]")) return
      mostrar(escolhida)
    }, ESPERA_DICA)
    return () => clearTimeout(espera)
  }, [hidratado, desligadas, temNovidade, ultimaEm, dica, vistas, caminho])

  function outra() {
    const pular = [...useDicaAtual.getState().daVisita, dica?.id ?? ""]
    mostrar(proximaDica(usePreferencias.getState().dicasVistas ?? [], caminho, pular) ?? proximaDica([], caminho, pular))
  }

  return (
    <AnimatePresence mode="wait">
      {dica && (
        <motion.aside
          key={dica.id}
          role="status"
          aria-label="Dica de uso"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed right-4 bottom-24 z-(--z-dropdown) w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line-strong bg-raised p-4 shadow-lg md:right-6 md:bottom-6"
        >
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-ember/15 text-ember">
              <LightbulbIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-micro font-semibold tracking-wide text-ink-muted uppercase">Dica</p>
              <p className="text-ui font-semibold text-paper">{dica.titulo}</p>
              <p className="text-small text-ink-soft">{dica.texto}</p>
              {dica.teclas && (
                <p className="flex flex-wrap gap-1 pt-1" aria-hidden="true">
                  {dica.teclas.map((tecla, indice) => (
                    <Kbd key={`${tecla}-${indice}`}>{tecla}</Kbd>
                  ))}
                </p>
              )}
            </div>
            <IconButton variant="ghost" size="sm" aria-label="Fechar dica" className="-mt-1 -mr-1" onClick={() => setDica(null)}>
              <XIcon />
            </IconButton>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-10">
            {dica.acao && (
              <Button variant="secondary" size="sm" nativeButton={false} render={<Link href={dica.acao.href} />} onClick={() => setDica(null)}>
                {dica.acao.rotulo}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={outra}>
              Outra dica
            </Button>
            <button
              type="button"
              onClick={() => {
                definirDesligadas(!desligadas)
                if (!desligadas) setDica(null)
              }}
              className="ml-auto text-micro text-ink-muted hover:text-paper hover:underline hover:underline-offset-4"
            >
              {desligadas ? "Mostrar dicas de vez em quando" : "Não mostrar sozinhas"}
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
