"use client"

// Rafael Marques - 26/10/2026
// Quadro com raias: as mesmas colunas repetidas em linhas, uma para cada pessoa, prioridade ou
// etiqueta. Arrastar um cartão para outra raia muda também a pessoa/prioridade/etiqueta dele.

import { useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { Coluna } from "@/components/kanban/coluna-kanban"
import type { RaiaKanban } from "@/lib/estado/visao-kanban"
import type { MembroEquipe } from "@/lib/tipos-equipe"
import type { CartaoKanban, ColunaKanban, EtiquetaKanban, ExibicaoCartao, Prioridade } from "@/lib/tipos"
import { cn } from "@/lib/utils"

export const RAIA_VAZIA = "__nenhum"

export type Raia = { chave: string; titulo: string; cartoes: CartaoKanban[] }

// Em qual raia o cartão fica (cada cartão aparece em uma só: na primeira etiqueta, por exemplo).
export function chaveDaRaia(tipo: Exclude<RaiaKanban, "nenhuma">, cartao: CartaoKanban, etiquetas: EtiquetaKanban[]) {
  if (tipo === "responsavel") return cartao.responsavelId ?? RAIA_VAZIA
  if (tipo === "prioridade") return cartao.prioridade ?? RAIA_VAZIA
  return cartao.etiquetas.find((id) => etiquetas.some((etiqueta) => etiqueta.id === id)) ?? RAIA_VAZIA
}

export function montarRaias(tipo: Exclude<RaiaKanban, "nenhuma">, cartoes: CartaoKanban[], etiquetas: EtiquetaKanban[], membros: MembroEquipe[]): Raia[] {
  const definicoes: { chave: string; titulo: string }[] =
    tipo === "responsavel"
      ? [...membros.map((membro) => ({ chave: membro.id, titulo: membro.nome })), { chave: RAIA_VAZIA, titulo: "Sem responsável" }]
      : tipo === "prioridade"
        ? [
            { chave: "alta", titulo: "Prioridade alta" },
            { chave: "media", titulo: "Prioridade média" },
            { chave: "baixa", titulo: "Prioridade baixa" },
            { chave: RAIA_VAZIA, titulo: "Sem prioridade" },
          ]
        : [...etiquetas.map((etiqueta) => ({ chave: etiqueta.id, titulo: etiqueta.nome })), { chave: RAIA_VAZIA, titulo: "Sem etiqueta" }]
  const raias = definicoes.map((definicao) => ({ ...definicao, cartoes: cartoes.filter((cartao) => chaveDaRaia(tipo, cartao, etiquetas) === definicao.chave) }))
  // Cartões de pessoas que já saíram da equipe vão para "Sem responsável".
  const conhecidas = new Set(definicoes.map((definicao) => definicao.chave))
  const orfaos = cartoes.filter((cartao) => !conhecidas.has(chaveDaRaia(tipo, cartao, etiquetas)))
  if (orfaos.length > 0) raias[raias.length - 1].cartoes.push(...orfaos)
  return raias
}

// O que muda no cartão quando ele é solto numa raia.
export function mudancasDaRaia(tipo: Exclude<RaiaKanban, "nenhuma">, chave: string, cartao: CartaoKanban): Partial<Pick<CartaoKanban, "responsavelId" | "prioridade" | "etiquetas">> {
  if (tipo === "responsavel") return { responsavelId: chave === RAIA_VAZIA ? null : chave }
  if (tipo === "prioridade") return { prioridade: chave === RAIA_VAZIA ? null : (chave as Prioridade) }
  // Etiqueta: a da raia passa a ser a primeira; as outras continuam.
  const outras = cartao.etiquetas.filter((id) => id !== chave)
  return { etiquetas: chave === RAIA_VAZIA ? [] : [chave, ...outras] }
}

export function RaiasKanban({
  raias,
  colunas,
  etiquetas,
  exibicao,
  vidro,
  aoAbrirCartao,
  aoMoverColuna,
  aoExcluirColuna,
}: {
  raias: Raia[]
  colunas: ColunaKanban[]
  etiquetas: EtiquetaKanban[]
  exibicao: ExibicaoCartao
  vidro: boolean
  aoAbrirCartao: (cartao: CartaoKanban) => void
  aoMoverColuna: (coluna: ColunaKanban, delta: -1 | 1) => void
  aoExcluirColuna: (coluna: ColunaKanban) => void
}) {
  const [recolhidas, setRecolhidas] = useState<Set<string>>(new Set())
  return (
    <div className="flex-1 overflow-x-auto px-4 pt-2 pb-6 md:px-6 md:pt-4">
      <div className="min-w-max space-y-5">
        {raias.map((raia, indiceRaia) => {
          const fechada = recolhidas.has(raia.chave)
          return (
            <section key={raia.chave} aria-label={`Raia ${raia.titulo}`} className="animacao-entrar space-y-2" style={{ ["--ordem" as string]: indiceRaia }}>
              <button
                type="button"
                aria-expanded={!fechada}
                onClick={() => setRecolhidas((atual) => new Set(fechada ? [...atual].filter((chave) => chave !== raia.chave) : [...atual, raia.chave]))}
                className={cn("sticky left-0 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold hover:bg-foreground/5", vidro && "bg-card/90 backdrop-blur-xl")}
              >
                <ChevronDownIcon className={cn("size-4 transition-transform", fechada && "-rotate-90")} />
                {raia.titulo}
                <span className="rounded-full bg-background px-2 text-xs font-normal text-muted-foreground tabular-nums">{raia.cartoes.length}</span>
              </button>
              {!fechada && (
                <div className="flex items-start gap-3">
                  {colunas.map((coluna, indice) => (
                    <Coluna
                      key={coluna.id}
                      coluna={coluna}
                      raia={raia.chave}
                      cartoes={raia.cartoes.filter((cartao) => cartao.colunaId === coluna.id)}
                      etiquetas={etiquetas}
                      exibicao={exibicao}
                      vidro={vidro}
                      posicao={indice}
                      total={colunas.length}
                      aoAbrirCartao={aoAbrirCartao}
                      aoMover={(delta) => aoMoverColuna(coluna, delta)}
                      aoExcluir={() => aoExcluirColuna(coluna)}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
