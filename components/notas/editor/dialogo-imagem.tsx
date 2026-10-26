"use client"

// Rafael Marques - 23/10/2026
// Janela "Imagem" do editor: enviar um arquivo (reduzido antes de guardar) ou usar um endereço.

import { useState } from "react"
import { ImageIcon, UploadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { comprimirImagem } from "@/lib/imagem"

const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const TAMANHO_MAXIMO = 15 * 1024 * 1024

// Reduz a imagem para ela não pesar nas notas (e no que é salvo na conta).
export async function prepararImagem(arquivo: File) {
  if (!TIPOS.includes(arquivo.type)) throw new Error("Use uma imagem JPG, PNG, WebP ou GIF.")
  if (arquivo.size > TAMANHO_MAXIMO) throw new Error("A imagem tem mais de 15 MB.")
  // GIF animado e SVG não podem ser redesenhados: GIFs pequenos entram como estão.
  if (arquivo.type === "image/gif" && arquivo.size < 400 * 1024) {
    return await new Promise<string>((resolver, rejeitar) => {
      const leitor = new FileReader()
      leitor.onload = () => resolver(String(leitor.result))
      leitor.onerror = () => rejeitar(new Error("Não foi possível ler a imagem."))
      leitor.readAsDataURL(arquivo)
    })
  }
  return await comprimirImagem(arquivo, 1200, 0.78)
}

export function DialogoImagem({ aberto, aoMudarAberto, aoInserir }: { aberto: boolean; aoMudarAberto: (aberto: boolean) => void; aoInserir: (src: string, alt: string) => void }) {
  const [endereco, setEndereco] = useState("")
  const [descricao, setDescricao] = useState("")
  const [lendo, setLendo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function fechar(valor: boolean) {
    if (!valor) {
      setEndereco("")
      setDescricao("")
      setErro(null)
    }
    aoMudarAberto(valor)
  }

  async function aoEscolherArquivo(arquivo: File | undefined) {
    if (!arquivo) return
    setLendo(true)
    setErro(null)
    try {
      aoInserir(await prepararImagem(arquivo), descricao.trim())
      fechar(false)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível usar essa imagem.")
    } finally {
      setLendo(false)
    }
  }

  function usarEndereco() {
    const limpo = endereco.trim()
    if (!/^https?:\/\/\S+$/i.test(limpo)) return setErro("Digite um endereço que comece com http:// ou https://.")
    aoInserir(limpo, descricao.trim())
    fechar(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="flex items-center gap-2"><ImageIcon className="size-4" /> Inserir imagem</DialogTitle>
        <DialogDescription>Envie um arquivo do seu aparelho ou cole o endereço de uma imagem da internet.</DialogDescription>

        <div className="space-y-3">
          <Button variant="outline" className="w-full" nativeButton={false} render={<label />} disabled={lendo}>
            {lendo ? <Spinner /> : <UploadIcon />} Enviar arquivo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(evento) => {
                void aoEscolherArquivo(evento.target.files?.[0])
                evento.target.value = ""
              }}
            />
          </Button>

          <p className="text-center text-xs text-muted-foreground">ou</p>

          <form
            className="flex gap-2"
            onSubmit={(evento) => {
              evento.preventDefault()
              usarEndereco()
            }}
          >
            <Input value={endereco} onChange={(evento) => setEndereco(evento.target.value)} placeholder="https://…/imagem.png" aria-label="Endereço da imagem" />
            <Button type="submit" disabled={!endereco.trim()}>Inserir</Button>
          </form>

          <Input value={descricao} onChange={(evento) => setDescricao(evento.target.value)} placeholder="Descrição da imagem (opcional)" aria-label="Descrição da imagem" />
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
