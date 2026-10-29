"use client"

// Rafael Marques - 26/10/2026
// Partes novas do cartão: anexos (imagens e links), repetição, complexidade e bloqueios.
// Valem para quadros pessoais e de equipe.

import { useRef, useState } from "react"
import { ImageIcon, LinkIcon, PaperclipIcon, XIcon } from "lucide-react"

import { Secao } from "@/components/kanban/blocos-cartao"
import { classeSelect } from "@/components/tarefas/dialogo-tarefa"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { gerarId } from "@/lib/gerar-id"
import { comprimirImagem } from "@/lib/imagem"
import { complexidadeDe, complexidades } from "@/lib/kanban/complexidade"
import { descreverRecorrencia, nomesFrequencia, type FrequenciaRecorrencia } from "@/lib/kanban/recorrencia"
import type { AnexoCartao, CartaoKanban } from "@/lib/tipos"
import { cn } from "@/lib/utils"

const MAXIMO_ANEXOS = 6
// Cada imagem fica pequena: tudo é guardado no navegador (~5 MB para o app inteiro) e, em equipe, vai
// para o servidor junto com o cartão.
const LIMITE_IMAGEM_CARACTERES = 380_000

type Atualizar = (mudancas: Partial<Pick<CartaoKanban, "anexos" | "recorrencia" | "estimativa">>, atividade?: string) => void

export function SecaoAnexos({ cartao, atualizar }: { cartao: CartaoKanban; atualizar: Atualizar }) {
  const entrada = useRef<HTMLInputElement>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [adicionandoLink, setAdicionandoLink] = useState(false)
  const [endereco, setEndereco] = useState("")
  const [nomeLink, setNomeLink] = useState("")
  const [ampliado, setAmpliado] = useState<AnexoCartao | null>(null)
  const cheio = cartao.anexos.length >= MAXIMO_ANEXOS

  async function enviar(arquivos: FileList | null) {
    if (!arquivos?.length) return
    setAviso(null)
    const novos: AnexoCartao[] = []
    for (const arquivo of Array.from(arquivos)) {
      if (cartao.anexos.length + novos.length >= MAXIMO_ANEXOS) {
        setAviso(`Cada cartão aceita até ${MAXIMO_ANEXOS} anexos.`)
        break
      }
      if (!arquivo.type.startsWith("image/")) {
        setAviso("Por enquanto só imagens podem ser enviadas. Para outros arquivos, adicione o link.")
        continue
      }
      try {
        // Tenta qualidades menores até caber no limite.
        let url = await comprimirImagem(arquivo, 1280, 0.75)
        if (url.length > LIMITE_IMAGEM_CARACTERES) url = await comprimirImagem(arquivo, 1000, 0.6)
        if (url.length > LIMITE_IMAGEM_CARACTERES) {
          setAviso(`“${arquivo.name}” continua grande demais mesmo reduzida.`)
          continue
        }
        novos.push({ id: gerarId(), tipo: "imagem", nome: arquivo.name.slice(0, 120), url, criadoEm: Date.now() })
      } catch {
        setAviso(`Não consegui ler “${arquivo.name}”.`)
      }
    }
    if (novos.length) atualizar({ anexos: [...cartao.anexos, ...novos] }, `${novos.length === 1 ? "Imagem anexada" : `${novos.length} imagens anexadas`}`)
    if (entrada.current) entrada.current.value = ""
  }

  function adicionarLink() {
    const limpo = endereco.trim()
    const comProtocolo = /^https?:\/\//i.test(limpo) ? limpo : `https://${limpo}`
    try {
      const url = new URL(comProtocolo)
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocolo")
      atualizar({ anexos: [...cartao.anexos, { id: gerarId(), tipo: "link", nome: nomeLink.trim().slice(0, 120) || url.hostname, url: url.toString(), criadoEm: Date.now() }] }, "Link anexado")
      setEndereco("")
      setNomeLink("")
      setAdicionandoLink(false)
      setAviso(null)
    } catch {
      setAviso("Esse endereço não parece válido.")
    }
  }

  const imagens = cartao.anexos.filter((anexo) => anexo.tipo === "imagem")
  const links = cartao.anexos.filter((anexo) => anexo.tipo === "link")
  const remover = (anexo: AnexoCartao) => atualizar({ anexos: cartao.anexos.filter((item) => item.id !== anexo.id) }, "Anexo removido")

  return (
    <Secao titulo="Anexos" icone={PaperclipIcon} extra={cartao.anexos.length > 0 && `${cartao.anexos.length}/${MAXIMO_ANEXOS}`}>
      {imagens.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {imagens.map((anexo) => (
            <li key={anexo.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <button type="button" onClick={() => setAmpliado(anexo)} className="size-full" aria-label={`Ampliar ${anexo.nome}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={anexo.url} alt={anexo.nome} className="size-full object-cover" />
              </button>
              <button
                type="button"
                aria-label={`Remover ${anexo.nome}`}
                onClick={() => remover(anexo)}
                className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-md bg-background/85 opacity-0 group-hover:opacity-100 hover:bg-background focus-visible:opacity-100 max-md:opacity-100"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {links.length > 0 && (
        <ul className="space-y-1">
          {links.map((anexo) => (
            <li key={anexo.id} className="group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm">
              <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <a href={anexo.url} target="_blank" rel="noreferrer noopener" className="min-w-0 flex-1 truncate hover:underline">
                {anexo.nome}
              </a>
              <button type="button" aria-label={`Remover ${anexo.nome}`} onClick={() => remover(anexo)} className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 max-md:opacity-100">
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adicionandoLink ? (
        <form
          className="space-y-2 rounded-lg border p-2.5"
          onSubmit={(evento) => {
            evento.preventDefault()
            adicionarLink()
          }}
        >
          <Input autoFocus value={endereco} onChange={(evento) => setEndereco(evento.target.value)} placeholder="Endereço (https://…)" aria-label="Endereço do link" />
          <Input value={nomeLink} onChange={(evento) => setNomeLink(evento.target.value)} placeholder="Nome (opcional)" aria-label="Nome do link" />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!endereco.trim()}>
              Adicionar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdicionandoLink(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={cheio} onClick={() => entrada.current?.click()}>
            <ImageIcon /> Enviar imagem
          </Button>
          <Button variant="outline" size="sm" disabled={cheio} onClick={() => setAdicionandoLink(true)}>
            <LinkIcon /> Adicionar link
          </Button>
          <input ref={entrada} type="file" accept="image/*" multiple className="hidden" onChange={(evento) => void enviar(evento.target.files)} aria-label="Enviar imagem" />
        </div>
      )}
      {aviso && (
        <p role="alert" className="text-xs text-destructive">
          {aviso}
        </p>
      )}
      <p className="text-xs text-muted-foreground">As imagens são reduzidas e guardadas junto com os seus dados.</p>

      <Dialog open={ampliado !== null} onOpenChange={(aberto) => !aberto && setAmpliado(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogTitle className="truncate pr-8">{ampliado?.nome}</DialogTitle>
          <DialogDescription className="sr-only">Imagem anexada ao cartão</DialogDescription>
          {ampliado && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ampliado.url} alt={ampliado.nome} className="max-h-[70svh] w-full rounded-lg object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </Secao>
  )
}

// Três barrinhas que enchem conforme a complexidade (como um sinal de rede).
export function BarrasComplexidade({ nivel, className }: { nivel: number; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex items-end gap-px", className)}>
      {[1, 2, 3].map((barra) => (
        <span key={barra} className={cn("w-[3px] rounded-[1px] bg-current", barra > nivel && "opacity-25")} style={{ height: 3 + barra * 2.5 }} />
      ))}
    </span>
  )
}

// Rafael Marques - 29/10/2026: complexidade e repetição viraram peças separadas (o cartão as mostra em menus,
// estilo Trello). A opção "Bloqueado por" foi retirada.
export function SeletorComplexidade({ cartao, atualizar }: { cartao: CartaoKanban; atualizar: Atualizar }) {
  return (
    <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Complexidade">
      {complexidades.map((opcao) => {
        const ativa = complexidadeDe(cartao.estimativa) === opcao.id
        return (
          <button
            key={opcao.id}
            type="button"
            role="radio"
            aria-checked={ativa}
            title={ativa ? "Clique de novo para tirar" : undefined}
            onClick={() => atualizar({ estimativa: ativa ? null : opcao.valor }, ativa ? "Complexidade removida" : `Complexidade ${opcao.rotulo.toLowerCase()}`)}
            className={cn("flex h-8 items-center justify-center gap-1.5 rounded-md border px-2 text-xs", ativa ? "border-foreground bg-foreground text-background" : "hover:bg-muted")}
          >
            <BarrasComplexidade nivel={opcao.valor} /> {opcao.rotulo}
          </button>
        )
      })}
    </div>
  )
}

export function CampoRepetir({ cartao, atualizar }: { cartao: CartaoKanban; atualizar: Atualizar }) {
  const rec = cartao.recorrencia
  return (
    <div className="space-y-2">
      <select
        value={rec?.frequencia ?? ""}
        onChange={(evento) => {
          const frequencia = evento.target.value as FrequenciaRecorrencia | ""
          atualizar({ recorrencia: frequencia ? { frequencia, intervalo: rec?.intervalo ?? 1 } : null }, frequencia ? "Repetição ativada" : "Repetição desativada")
        }}
        className={classeSelect}
        aria-label="Repetir o cartão"
      >
        <option value="">Não repetir</option>
        <option value="diaria">Todo dia</option>
        <option value="semanal">Toda semana</option>
        <option value="mensal">Todo mês</option>
        <option value="anual">Todo ano</option>
      </select>
      {rec && (
        <>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            A cada
            <Input
              type="number"
              min={1}
              max={365}
              value={rec.intervalo}
              aria-label="Intervalo da repetição"
              className="h-7 w-16"
              onChange={(evento) => atualizar({ recorrencia: { ...rec, intervalo: Math.min(365, Math.max(1, Math.round(Number(evento.target.value)) || 1)) } })}
            />
            {rec.intervalo === 1 ? nomesFrequencia[rec.frequencia].um : nomesFrequencia[rec.frequencia].varios}
          </label>
          <p className="text-xs text-muted-foreground">{descreverRecorrencia(rec)}: ao concluir, o próximo cartão é criado sozinho.</p>
        </>
      )}
    </div>
  )
}
