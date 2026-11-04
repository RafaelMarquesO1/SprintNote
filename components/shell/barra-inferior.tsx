"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CircleUserRoundIcon,
  InfoIcon,
  LightbulbIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { useConta } from "@/components/conta/portao-conta"
import { abrirDicaDeUso } from "@/components/dicas/dica-ocasional"
import { abrirHistoricoDeNovidades } from "@/components/novidades/cartao-novidades"
import { abrirPaleta } from "@/components/shell/command-palette"
import { abrirCriar } from "@/components/shell/estado"
import { ITEM_BIBLIOTECA, ITEM_HOJE, ITENS_BIBLIOTECA, ITENS_FAZER, itemAtivo, type ItemNav } from "@/components/shell/navegacao"
import { SyncStatus } from "@/components/shell/sync-status"
import { PersonAvatar } from "@/components/ui/avatar-stack"
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Spinner } from "@/components/ui/spinner"
import { usePreferencias } from "@/lib/estado/preferencias"
import { alternarTema } from "@/lib/theme"

// Barra inferior do celular (10): Hoje, Tarefas, Criar (+), Quadros e Mais. Alvos de 48px e safe-area.
// Rafael Marques - 04/11/2026 (v1.5a): "Mais" abre uma gaveta com o resto do app (Biblioteca, Hábitos,
// Rotina, Grafo, Tags, Buscar) e a conta (antes, no celular, não havia como chegar nessas telas nem na conta).
const ESQUERDA: ItemNav[] = [ITEM_HOJE, ITENS_FAZER[0]]
const DIREITA: ItemNav[] = [ITENS_FAZER[3]]
const NA_GAVETA: ItemNav[] = [ITEM_BIBLIOTECA, ITENS_FAZER[1], ITENS_FAZER[2], ...ITENS_BIBLIOTECA]

function ativoNaRota(caminho: string, nav: ItemNav) {
  if (nav === ITEM_BIBLIOTECA) return caminho === "/notas" || caminho.startsWith("/notas/")
  return itemAtivo(caminho, nav.href)
}

function LinhaConta({ icone: Icone, rotulo, ...props }: { icone: LucideIcon | React.ComponentType<{ className?: string }>; rotulo: string } & React.ComponentProps<"button">) {
  return (
    <button type="button" className="flex h-12 w-full items-center gap-3 rounded-md px-2 text-left text-ui text-paper hover:bg-raised disabled:opacity-60" {...props}>
      <Icone aria-hidden="true" className="size-5 text-ink-soft" />
      {rotulo}
    </button>
  )
}

function GavetaMais({ aberta, aoMudar }: { aberta: boolean; aoMudar: (aberta: boolean) => void }) {
  const caminho = usePathname()
  const conta = useConta()
  const foto = usePreferencias((dados) => dados.fotoPerfil)
  const [saindo, setSaindo] = useState(false)
  const fechar = () => aoMudar(false)
  const nome = conta ? conta.usuario.nome || conta.usuario.email : ""

  return (
    <Drawer open={aberta} onOpenChange={aoMudar}>
      <DrawerContent aria-describedby="gaveta-mais-descricao">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Mais</DrawerTitle>
          <DrawerDescription id="gaveta-mais-descricao">Outras telas do app e a sua conta.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-5 pt-3">
          <nav aria-label="Outras telas">
            <ul className="grid grid-cols-3 gap-2">
              {NA_GAVETA.map((nav) => {
                const ativo = ativoNaRota(caminho, nav)
                const Icone = nav.icone
                return (
                  <li key={nav.href}>
                    <Link
                      href={nav.href}
                      onClick={fechar}
                      aria-current={ativo ? "page" : undefined}
                      className={cn(
                        "flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border text-small font-medium",
                        ativo ? "border-line-strong bg-raised text-paper" : "border-line text-ink-soft hover:bg-raised hover:text-paper"
                      )}
                    >
                      <Icone aria-hidden="true" className={cn("size-5", ativo && "text-ember")} />
                      {nav.rotulo}
                    </Link>
                  </li>
                )
              })}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    fechar()
                    abrirPaleta()
                  }}
                  className="flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-line text-small font-medium text-ink-soft hover:bg-raised hover:text-paper"
                >
                  <SearchIcon aria-hidden="true" className="size-5" />
                  Buscar
                </button>
              </li>
            </ul>
          </nav>

          {conta ? (
            <section aria-label="Conta" className="space-y-1 border-t border-line pt-4">
              <div className="flex items-center gap-3 px-2 pb-2">
                <PersonAvatar pessoa={{ id: conta.usuario.id, nome, foto }} size="md" />
                <span className="grid min-w-0">
                  <span className="truncate text-ui font-semibold text-paper">{nome}</span>
                  <SyncStatus className="truncate text-micro text-ink-muted" />
                </span>
              </div>
              <Link href="/conta" onClick={fechar} className="flex h-12 items-center gap-3 rounded-md px-2 text-ui text-paper hover:bg-raised">
                <CircleUserRoundIcon aria-hidden="true" className="size-5 text-ink-soft" /> Minha conta
              </Link>
              <LinhaConta icone={MoonIcon} rotulo="Alternar tema" onClick={(evento) => alternarTema({ x: evento.clientX, y: evento.clientY })} />
              <LinhaConta
                icone={SparklesIcon}
                rotulo="O que há de novo"
                onClick={() => {
                  fechar()
                  abrirHistoricoDeNovidades()
                }}
              />
              <LinhaConta
                icone={LightbulbIcon}
                rotulo="Dicas de uso"
                onClick={() => {
                  fechar()
                  abrirDicaDeUso()
                }}
              />
              <Link href="/creditos" onClick={fechar} className="flex h-12 items-center gap-3 rounded-md px-2 text-ui text-paper hover:bg-raised">
                <InfoIcon aria-hidden="true" className="size-5 text-ink-soft" /> Créditos
              </Link>
              <LinhaConta
                icone={saindo ? Spinner : LogOutIcon}
                rotulo="Sair"
                disabled={saindo}
                onClick={async () => {
                  setSaindo(true)
                  await conta.sair()
                }}
              />
            </section>
          ) : null}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

export function BarraInferior() {
  const caminho = usePathname()
  const [maisAberto, setMaisAberto] = useState(false)
  const ativoMais = NA_GAVETA.some((nav) => ativoNaRota(caminho, nav)) || caminho === "/conta" || caminho === "/creditos"

  const item = (nav: ItemNav) => {
    const ativo = ativoNaRota(caminho, nav)
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
    <>
      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-line bg-night/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="flex items-center px-2 pt-1">
          {ESQUERDA.map(item)}
          <li className="flex flex-1 justify-center">
            <button type="button" onClick={abrirCriar} aria-label="Criar" className="flex size-12 items-center justify-center rounded-full bg-paper text-night">
              <PlusIcon aria-hidden="true" className="size-5.5" />
            </button>
          </li>
          {DIREITA.map(item)}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMaisAberto(true)}
              aria-haspopup="dialog"
              aria-expanded={maisAberto}
              className={cn("flex h-12 w-full flex-col items-center justify-center gap-0.5 text-micro font-medium", ativoMais ? "text-paper" : "text-ink-soft")}
            >
              <MenuIcon aria-hidden="true" className={cn("size-5", ativoMais && "text-ember")} />
              Mais
            </button>
          </li>
        </ul>
      </nav>
      <GavetaMais aberta={maisAberto} aoMudar={setMaisAberto} />
    </>
  )
}
