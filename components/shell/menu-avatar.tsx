"use client"

import Link from "next/link"
import { useState } from "react"
import { CircleUserRoundIcon, InfoIcon, LogOutIcon, MoonIcon, SparklesIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { useConta } from "@/components/conta/portao-conta"
import { abrirHistoricoDeNovidades } from "@/components/novidades/cartao-novidades"
import { SyncStatus } from "@/components/shell/sync-status"
import { PersonAvatar } from "@/components/ui/avatar-stack"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { usePreferencias } from "@/lib/estado/preferencias"
import { alternarTema } from "@/lib/theme"

// Rodapé do menu (7.1): avatar + nome + status. Menu: Minha conta, Tema, Créditos, Sair.
export function MenuAvatar({ recolhido = false }: { recolhido?: boolean }) {
  const conta = useConta()
  const foto = usePreferencias((dados) => dados.fotoPerfil)
  const [saindo, setSaindo] = useState(false)
  if (!conta) return null
  const { usuario, sair } = conta
  const nome = usuario.nome || usuario.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Conta de ${nome}`}
        className={cn(
          "flex w-full items-center gap-3 rounded-sm p-2 text-left outline-none hover:bg-raised data-popup-open:bg-raised",
          recolhido && "justify-center"
        )}
      >
        <PersonAvatar pessoa={{ id: usuario.id, nome, foto }} size="md" />
        {recolhido ? null : (
          <span className="grid min-w-0 flex-1">
            <span className="truncate text-ui font-semibold text-paper">{nome}</span>
            <SyncStatus className="truncate text-micro text-ink-muted" />
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuGroup>
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="truncate text-ui font-semibold text-paper">{nome}</span>
          {usuario.nome ? <span className="truncate text-micro font-normal text-ink-soft">{usuario.email}</span> : null}
        </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/conta" />}>
          <CircleUserRoundIcon /> Minha conta
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(evento) => alternarTema({ x: evento.clientX, y: evento.clientY })}>
          <MoonIcon /> Alternar tema
        </DropdownMenuItem>
        <DropdownMenuItem onClick={abrirHistoricoDeNovidades}>
          <SparklesIcon /> O que há de novo
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/creditos" />}>
          <InfoIcon /> Créditos
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={saindo}
          onClick={async () => {
            setSaindo(true)
            await sair()
          }}
        >
          {saindo ? <Spinner /> : <LogOutIcon />} Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
