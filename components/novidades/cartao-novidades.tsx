"use client"

// Rafael Marques - 23/10/2026 · redesign v2
// "O que há de novo": abre sozinho depois do login quando há novidade não vista e pode ser aberto pelo menu
// da conta. A versão atual aparece como uma página (título, resumo e itens por tipo); as anteriores ficam
// numa linha do tempo recolhida. A Brasa marca só a versão em que você está ("você está aqui").

import { useState } from "react"
import { ChevronDownIcon, PlusIcon, TrendingUpIcon, WrenchIcon, type LucideIcon } from "lucide-react"
import { create } from "zustand"
import { cn } from "@/lib/utils"

import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { usePreferencias } from "@/lib/estado/preferencias"
import { NOVIDADES, novidadesNaoVistas, ordemTipos, rotulosNovidade, type Novidade, type TipoNovidade } from "@/lib/novidades"
import { VERSAO_APP } from "@/lib/versao"

const iconesTipo: Record<TipoNovidade, LucideIcon> = { novo: PlusIcon, melhorado: TrendingUpIcon, corrigido: WrenchIcon }

// "O que há de novo" no menu da conta abre o histórico completo.
const useHistoricoAberto = create<{ aberto: boolean }>(() => ({ aberto: false }))
export const abrirHistoricoDeNovidades = () => useHistoricoAberto.setState({ aberto: true })

function ItensPorTipo({ novidade }: { novidade: Novidade }) {
  return (
    <div className="space-y-6">
      {ordemTipos.map((tipo) => {
        const itens = novidade.itens.filter((item) => item.tipo === tipo)
        if (itens.length === 0) return null
        const Icone = iconesTipo[tipo]
        return (
          <section key={tipo} aria-label={rotulosNovidade[tipo].plural}>
            <h4 className="flex items-center gap-2 text-small font-semibold text-ink-soft">
              <Icone aria-hidden="true" className="size-4" />
              {itens.length === 1 ? rotulosNovidade[tipo].singular : rotulosNovidade[tipo].plural}
              <span className="font-normal text-ink-muted tabular-nums">{itens.length}</span>
            </h4>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {itens.map((item) => (
                <li key={item.texto} className="py-3">
                  {item.titulo && <p className="text-ui font-semibold text-paper">{item.titulo}</p>}
                  <p className="text-small text-ink-soft">{item.texto}</p>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function Versao({ versao, atual }: { versao: string; atual: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xs border border-line-strong px-1.5 py-0.5 font-mono text-micro text-paper">
      {atual ? <span aria-hidden="true" className="size-1.5 rounded-full bg-ember" /> : null}v{versao}
      {atual ? <span className="sr-only">, versão atual</span> : null}
    </span>
  )
}

export function CartaoNovidades() {
  const ultimaVista = usePreferencias((estado) => estado.novidadesVistas)
  const marcarVistas = usePreferencias((estado) => estado.marcarNovidadesVistas)
  const historico = useHistoricoAberto((estado) => estado.aberto)
  // Fechou nesta visita: não reabre até a próxima vez que entrar.
  const [dispensado, setDispensado] = useState(false)
  const [verTudo, setVerTudo] = useState(false)

  const naoVistas = novidadesNaoVistas(ultimaVista)
  const aberto = historico || (naoVistas.length > 0 && !dispensado)
  const mostrarHistorico = historico || verTudo
  const [destaque, ...anteriores] = mostrarHistorico ? NOVIDADES : naoVistas.length ? naoVistas : NOVIDADES.slice(0, 1)
  const haMais = NOVIDADES.length > naoVistas.length

  function fechar() {
    setDispensado(true)
    setVerTudo(false)
    useHistoricoAberto.setState({ aberto: false })
    marcarVistas(NOVIDADES[0].id)
  }

  if (!destaque) return null

  return (
    <Dialog open={aberto} onOpenChange={(valor) => !valor && fechar()}>
      <DialogContent className="flex max-h-[min(44rem,90dvh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <header className="flex shrink-0 items-center gap-3 px-6 pt-6 pr-14 pb-2">
          <LogoMark size={32} />
          <div className="min-w-0">
            <DialogTitle className="font-display text-section text-paper">O que há de novo</DialogTitle>
            <DialogDescription className="text-small text-ink-soft">
              Você está na versão {VERSAO_APP}
              {!mostrarHistorico && naoVistas.length > 1 ? `. ${naoVistas.length} atualizações desde a sua última visita.` : "."}
            </DialogDescription>
          </div>
        </header>

        <div className="rolagem-fina min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 pt-4 pb-6">
          <article className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-small text-ink-soft">
              <Versao versao={destaque.versao} atual={destaque.versao === VERSAO_APP} />
              <span>{destaque.data}</span>
            </div>
            <h3 className="font-display text-title text-paper">{destaque.titulo}</h3>
            <p className="text-body text-ink">{destaque.resumo}</p>
            <ItensPorTipo novidade={destaque} />
          </article>

          {anteriores.length > 0 ? (
            <section aria-label="Versões anteriores" className="mt-8">
              <h3 className="mb-3 text-small font-semibold text-ink-soft">Antes</h3>
              <ol className="relative space-y-1 before:absolute before:top-2 before:bottom-2 before:left-1 before:w-px before:bg-line-strong">
                {anteriores.map((novidade) => (
                  <li key={novidade.id} className="relative pl-6">
                    <span aria-hidden="true" className="absolute top-4 left-0 size-2 rounded-full border border-line-strong bg-night" />
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-sm py-2.5 pr-2 hover:bg-raised [&::-webkit-details-marker]:hidden">
                        <Versao versao={novidade.versao} atual={novidade.versao === VERSAO_APP} />
                        <span className="min-w-0 flex-1 truncate text-ui text-paper">{novidade.titulo}</span>
                        <span className="shrink-0 text-micro text-ink-muted">{novidade.data}</span>
                        <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 text-ink-soft transition-transform duration-fast group-open:rotate-180" />
                      </summary>
                      <div className="space-y-4 pt-2 pb-4">
                        <p className="text-small text-ink">{novidade.resumo}</p>
                        <ItensPorTipo novidade={novidade} />
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <footer className={cn("flex shrink-0 flex-wrap items-center gap-2 border-t border-line px-6 py-3", !historico && haMais ? "justify-between" : "justify-end")}>
          {!historico && haMais ? (
            <Button variant="ghost" size="sm" onClick={() => setVerTudo(!verTudo)}>
              {verTudo ? "Ver só as novidades" : "Ver histórico completo"}
            </Button>
          ) : null}
          <Button onClick={fechar}>Entendi</Button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
