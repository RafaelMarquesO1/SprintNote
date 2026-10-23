"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronsUpDownIcon, CircleUserRoundIcon, CloudAlertIcon, CloudCheckIcon, CloudUploadIcon, LogOutIcon, NotebookPenIcon } from "lucide-react"

import { useConta } from "@/components/conta/portao-conta"
import { abrirHistoricoDeNovidades } from "@/components/novidades/cartao-novidades"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { usePreferencias } from "@/lib/estado/preferencias"
import { VERSAO_APP } from "@/lib/versao"
import { useSincronizacao } from "@/lib/estado/sincronizacao"
import { cn } from "@/lib/utils"

const textosEstado = {
  salvo: "Tudo salvo na nuvem",
  pendente: "Salvando em instantes…",
  salvando: "Salvando…",
  erro: "Sem conexão — tentando de novo",
}

function IconeEstado({ estado }: { estado: keyof typeof textosEstado }) {
  if (estado === "salvando") return <Spinner className="size-3.5" />
  if (estado === "erro") return <CloudAlertIcon className="size-3.5 text-destructive" />
  if (estado === "pendente") return <CloudUploadIcon className="size-3.5" />
  return <CloudCheckIcon className="size-3.5" />
}

// Rafael Marques - 21/10/2026 (foto de perfil no avatar em 23/10/2026)
// Conta no rodapé da sidebar: e-mail, se os dados estão salvos e "Sair".
export function MenuConta() {
  const conta = useConta()
  const estado = useSincronizacao((dados) => dados.estado)
  const foto = usePreferencias((dados) => dados.fotoPerfil)
  const [saindo, setSaindo] = useState(false)
  if (!conta) return null
  const { usuario, sair } = conta
  const nome = usuario.nome || usuario.email
  const iniciais = nome
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("")

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent" />}>
            <Avatar className="size-8 rounded-lg">
              {foto && <AvatarImage src={foto} alt="" className="rounded-lg" />}
              <AvatarFallback className="rounded-lg bg-primary/10 font-medium text-primary">{iniciais}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{nome}</span>
              <span className={cn("flex items-center gap-1 truncate text-xs text-muted-foreground", estado === "erro" && "text-destructive")}>
                <IconeEstado estado={estado} /> {textosEstado[estado]}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-(--anchor-width) min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="grid gap-0.5">
                <span className="truncate text-sm font-medium text-foreground">{nome}</span>
                {usuario.nome && <span className="truncate text-xs font-normal">{usuario.email}</span>}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/conta" />}>
              <CircleUserRoundIcon /> Minha conta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={abrirHistoricoDeNovidades}>
              <NotebookPenIcon /> O que há de novo
              <span className="ml-auto text-xs text-muted-foreground">v{VERSAO_APP}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={saindo}
              onClick={async () => {
                setSaindo(true)
                await sair()
              }}
            >
              {saindo ? <Spinner /> : <LogOutIcon />} Sair da conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
