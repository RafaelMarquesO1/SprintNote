"use client"

// Rafael Marques - 26/10/2026
// Fundo do quadro no "Personalizar": nenhum, três modelos neutros (bons no claro e no escuro)
// ou a sua foto. A foto é ajustada direto no quadro (veja ajuste-foto-ao-vivo.tsx).

import { useRef } from "react"
import { ImagePlusIcon, MoveIcon } from "lucide-react"

import { FotoDeFundo } from "@/components/kanban/camada-fundo"
import { Button } from "@/components/ui/button"
import { ajusteFotoPadrao, automaticoPadrao, codificarAjusteFoto, fundosQuadro, lerAjusteFoto, resolverFundoQuadro } from "@/lib/kanban/fundo"
import { cn } from "@/lib/utils"

function Opcao({ ativo, rotulo, children, aoEscolher }: { ativo: boolean; rotulo: string; children: React.ReactNode; aoEscolher: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={ativo} onClick={aoEscolher} className="group/miniatura space-y-1 text-center">
      <span className={cn("relative block h-12 overflow-hidden rounded-lg border bg-background transition-all", ativo ? "border-primary ring-2 ring-primary/30" : "group-hover/miniatura:border-foreground/30")}>
        {children}
      </span>
      <span className={cn("block truncate text-[11px]", ativo ? "font-medium text-foreground" : "text-muted-foreground")}>{rotulo}</span>
    </button>
  )
}

export function SeletorFundo({
  fundo,
  imagem,
  aoMudar,
  aoAjustarFoto,
}: {
  fundo: string | null
  imagem: string | null | undefined
  aoMudar: (mudancas: { fundo?: string | null; imagemFundo?: string | null }) => void
  // Abre o ajuste ao vivo: com um arquivo novo ou com a foto atual.
  aoAjustarFoto: (arquivo?: File) => void
}) {
  const entrada = useRef<HTMLInputElement>(null)
  const resolvido = resolverFundoQuadro(fundo, imagem)
  const idAtivo = !resolvido ? "nenhum" : resolvido.tipo === "foto" ? "foto" : resolvido.id
  // O ajuste da foto continua guardado mesmo com outro fundo escolhido (para voltar a ela).
  const ajuste = (fundo ? lerAjusteFoto(fundo) : null) ?? ajusteFotoPadrao

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Fundo do quadro" className="grid grid-cols-4 gap-2">
        <Opcao ativo={idAtivo === "nenhum"} rotulo="Nenhum" aoEscolher={() => aoMudar({ fundo: null })}>
          <span />
        </Opcao>
        {fundosQuadro.map((modelo) => (
          <Opcao key={modelo.id} ativo={idAtivo === modelo.id} rotulo={modelo.nome} aoEscolher={() => aoMudar({ fundo: modelo.id })}>
            <span className="absolute inset-0" style={{ background: modelo.valor }} />
          </Opcao>
        ))}
      </div>

      <div className={cn("flex items-center gap-3 rounded-lg border p-2", idAtivo === "foto" && "border-primary ring-2 ring-primary/30")}>
        <button
          type="button"
          onClick={() => (imagem ? aoMudar({ fundo: codificarAjusteFoto(ajuste) }) : entrada.current?.click())}
          aria-label={imagem ? "Usar a foto como fundo" : "Escolher uma foto de fundo"}
          className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border bg-muted"
        >
          {imagem ? <FotoDeFundo imagem={imagem} ajuste={ajuste} automatico={{ ...automaticoPadrao, visibilidade: 1 }} /> : <ImagePlusIcon className="absolute inset-0 m-auto size-5 text-muted-foreground" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Sua foto</p>
          <p className="text-xs text-muted-foreground">Brilho e transparência são ajustados sozinhos para o quadro ficar legível.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => entrada.current?.click()}>
          <ImagePlusIcon /> {imagem ? "Trocar foto" : "Escolher foto"}
        </Button>
        <Button variant="outline" size="sm" disabled={!imagem} onClick={() => aoAjustarFoto()}>
          <MoveIcon /> Enquadrar
        </Button>
      </div>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Escolher foto de fundo"
        onChange={(evento) => {
          const arquivo = evento.target.files?.[0]
          if (arquivo) aoAjustarFoto(arquivo)
          evento.target.value = ""
        }}
      />
    </div>
  )
}
