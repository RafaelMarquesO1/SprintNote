"use client"

import Link from "next/link"
import { useEffect, useId, useState } from "react"
import { motion } from "motion/react"
import { useShallow } from "zustand/react/shallow"
import { cn } from "@/lib/utils"

import { AlertCircleIcon, ArrowUpRightIcon, CalendarIcon, ListChecksIcon } from "lucide-react"

import { spring } from "@/components/motion/presets"
import { EtiquetaChip } from "@/components/ui/etiqueta"
import { PriorityIcon, StatusIcon } from "@/components/ui/status-icon"
import { useHoje } from "@/hooks/use-hoje"
import { estilosPrioridade } from "@/components/kanban/cartao-kanban"
import { lerChave } from "@/lib/datas"
import { formaDaColuna } from "@/lib/domain/quadros"
import { cartaoPeloNumero, useKanban } from "@/lib/estado/kanban"
import { rotuloPrazo } from "@/lib/tarefas-notas"

import { useNotas } from "@/lib/estado/notas"
import { obterReferencias } from "@/lib/links-wiki"
import type { Nota } from "@/lib/tipos"

type Titulo = { id: string; texto: string; elemento: HTMLElement }

// "Nesta nota" (8.10): índice dos H2 do texto; o trecho visível ganha o marcador Brasa (IntersectionObserver).
export function useTitulosDaNota(container: HTMLElement | null) {
  const [titulos, setTitulos] = useState<Titulo[]>([])
  const [ativo, setAtivo] = useState<string | null>(null)

  useEffect(() => {
    if (!container) return
    const ler = () => {
      const lista = [...container.querySelectorAll<HTMLElement>(".editor-notas h2")].map((elemento, indice) => ({
        id: `titulo-${indice}`,
        texto: elemento.textContent?.trim() ?? "",
        elemento,
      }))
      setTitulos((atual) => (atual.length === lista.length && atual.every((item, i) => item.texto === lista[i].texto && item.elemento === lista[i].elemento) ? atual : lista.filter((item) => item.texto)))
    }
    ler()
    const observador = new MutationObserver(ler)
    observador.observe(container, { childList: true, subtree: true, characterData: true })
    return () => observador.disconnect()
  }, [container])

  useEffect(() => {
    if (titulos.length === 0) return
    const visiveis = new Map<string, boolean>()
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          const titulo = titulos.find((item) => item.elemento === entrada.target)
          if (titulo) visiveis.set(titulo.id, entrada.isIntersecting)
        }
        const primeiro = titulos.find((item) => visiveis.get(item.id))
        if (primeiro) setAtivo(primeiro.id)
      },
      { rootMargin: "-10% 0px -60% 0px" }
    )
    titulos.forEach((titulo) => observador.observe(titulo.elemento))
    return () => observador.disconnect()
  }, [titulos])

  return { titulos, ativo: ativo ?? titulos[0]?.id ?? null }
}

export function NestaNota({ titulos, ativo }: { titulos: Titulo[]; ativo: string | null }) {
  // O marcador Brasa desliza entre os títulos ao rolar. Um id por índice (o trilho e a gaveta do celular).
  const idMarcador = `nesta-nota-${useId()}`
  if (titulos.length === 0) return null
  return (
    <nav aria-label="Nesta nota" className="space-y-2">
      <h2 className="text-small font-semibold text-ink-soft">Nesta nota</h2>
      <ol className="space-y-0.5">
        {titulos.map((titulo) => (
          <li key={titulo.id} className="relative">
            {titulo.id === ativo ? (
              <motion.span aria-hidden="true" layoutId={idMarcador} transition={spring.layout} className="absolute top-1 bottom-1 left-0 w-0.5 rounded-full bg-ember" />
            ) : null}
            <button
              type="button"
              aria-current={titulo.id === ativo ? "location" : undefined}
              onClick={() => titulo.elemento.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={cn("block w-full truncate py-1 pl-3 text-left text-ui", titulo.id === ativo ? "text-paper" : "text-ink-soft hover:text-paper")}
            >
              {titulo.texto}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

const REGEX_CARTAO = /\[([^\]]+)\]\((\/kanban\?[^)\s]*cartao=[^)\s]*)\)/g

// Rafael Marques - 04/11/2026 (v1.5a): prévia real do cartão citado (status, datas, etiquetas,
// checklist e prioridade). Clicar abre o cartão no Kanban.
function PreviaCartao({ href, tituloCitado }: { href: string; tituloCitado: string }) {
  const hoje = useHoje()
  const parametros = new URLSearchParams(href.split("?")[1] ?? "")
  const quadroId = parametros.get("quadro")
  const numero = Number(parametros.get("cartao"))
  const dados = useKanban(
    useShallow((estado) => {
      const id = quadroId && numero ? cartaoPeloNumero(estado, quadroId, numero) : null
      const cartao = estado.cartoes.find((item) => item.id === id)
      const coluna = estado.colunas.find((item) => item.id === cartao?.colunaId)
      const quadro = estado.quadros.find((item) => item.id === quadroId)
      return { cartao, coluna, quadro }
    })
  )
  const { cartao, coluna, quadro } = dados

  if (!cartao || !coluna) {
    return (
      <Link href={href} className="block rounded-md border border-dashed border-line px-3 py-2 text-small text-ink-soft hover:border-line-strong hover:text-paper">
        <span className="block truncate">Cartão {tituloCitado}</span>
        <span className="block text-micro text-ink-muted">Não encontrado neste aparelho. Pode ter sido excluído.</span>
      </Link>
    )
  }

  const concluido = coluna.concluida
  const etiquetas = (quadro?.etiquetas ?? []).filter((etiqueta) => cartao.etiquetas.includes(etiqueta.id))
  const feitos = cartao.checklist.filter((item) => item.feito).length
  const atrasado = Boolean(hoje && cartao.prazo && cartao.prazo < hoje && !concluido)
  // Curto para caber no trilho: "hoje", "amanhã" ou "6 nov.".
  const curto = (chave: string) => (["hoje", "amanhã", "ontem"].includes(rotuloPrazo(chave, hoje)) ? rotuloPrazo(chave, hoje) : lerChave(chave).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }))
  const datas =
    cartao.prazo && hoje
      ? cartao.inicio && cartao.inicio < cartao.prazo
        ? `${curto(cartao.inicio)} → ${curto(cartao.prazo)}`
        : curto(cartao.prazo)
      : null

  return (
    <Link
      href={href}
      title="Abrir o cartão no Kanban"
      className="group/cartao block space-y-2 rounded-md border border-line bg-panel px-3 py-2.5 transition-colors hover:border-line-strong hover:bg-raised"
    >
      <span className="flex items-start gap-2">
        <StatusIcon status={formaDaColuna(coluna)} className="mt-0.5 size-3.5 shrink-0" />
        <span className={cn("min-w-0 flex-1 text-ui leading-snug text-paper", concluido && "text-ink-soft")}>
          <span className="mr-1 font-mono text-micro text-ink-muted">#{numero}</span>
          {cartao.titulo}
        </span>
        <ArrowUpRightIcon className="size-3.5 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover/cartao:opacity-100" aria-hidden="true" />
      </span>
      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pl-5.5 text-micro text-ink-soft">
        <span className="truncate">{[quadro?.titulo, coluna.titulo].filter(Boolean).join(" · ")}</span>
        {datas && (
          <span className={cn("flex items-center gap-1", atrasado && "text-paper")}>
            {atrasado ? <AlertCircleIcon className="size-3" /> : <CalendarIcon className="size-3" />} {atrasado ? `Atrasado, ${datas}` : datas}
          </span>
        )}
        {cartao.prioridade && !concluido && (
          <span className="flex items-center gap-1">
            <PriorityIcon priority={cartao.prioridade} className="size-3" /> {estilosPrioridade[cartao.prioridade].titulo}
          </span>
        )}
        {cartao.checklist.length > 0 && (
          <span className="flex items-center gap-1 tabular-nums">
            <ListChecksIcon className="size-3" /> {feitos}/{cartao.checklist.length}
          </span>
        )}
      </span>
      {etiquetas.length > 0 && (
        <span className="flex flex-wrap gap-1 pl-5.5">
          {etiquetas.slice(0, 3).map((etiqueta) => (
            <EtiquetaChip key={etiqueta.id} nome={etiqueta.nome} cor={etiqueta.cor} />
          ))}
          {etiquetas.length > 3 && <span className="text-micro text-ink-muted">+{etiquetas.length - 3}</span>}
        </span>
      )}
    </Link>
  )
}

// "Ligações" (8.10): cartões citados nesta nota e notas que citam esta.
export function Ligacoes({ nota }: { nota: Nota }) {
  const biblioteca = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const citam = obterReferencias(biblioteca, { tipo: "nota", nota })
  const cartoes = [...new Map([...nota.conteudo.matchAll(REGEX_CARTAO)].map((achado) => [achado[2], achado[1]])).entries()]

  return (
    <section aria-labelledby="titulo-ligacoes" className="space-y-4">
      <h2 id="titulo-ligacoes" className="text-small font-semibold text-ink-soft">
        Ligações
      </h2>
      {cartoes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-micro text-ink-muted">{cartoes.length === 1 ? "Cartão citado" : `${cartoes.length} cartões citados`}</p>
          <ul className="space-y-1.5">
            {cartoes.map(([href, titulo]) => (
              <li key={href}>
                <PreviaCartao href={href} tituloCitado={titulo} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="space-y-1.5">
        {citam.length > 0 && <p className="text-micro text-ink-muted">Notas que citam esta</p>}
        {citam.length > 0 && (
          <ul className="space-y-1">
            {citam.map((outra) => (
              <li key={outra.id}>
                <Link href={`/notas/${outra.id}`} className="block truncate rounded-xs py-1 text-ui text-paper hover:underline hover:underline-offset-4">
                  {outra.titulo}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {citam.length === 0 ? <p className="text-small text-ink-soft">Nenhuma nota cita esta ainda. Escreva [[ em outra nota para ligar.</p> : null}
      </div>
    </section>
  )
}
