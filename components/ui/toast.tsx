"use client"

import { Toaster as Sonner, toast as sonner } from "sonner"

// Toast (seção 6, M13): sonner, embaixo no centro, com "Desfazer" de 5s.
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      theme="system"
      gap={8}
      offset={24}
      toastOptions={{
        duration: 5000,
        unstyled: true,
        classNames: {
          toast:
            "flex w-full min-w-80 items-center gap-3 rounded-lg bg-panel px-4 py-3 font-sans text-ui text-paper shadow-float",
          title: "font-medium",
          description: "text-small text-ink-soft",
          actionButton: "ml-auto h-control-sm shrink-0 rounded-sm px-3 text-small font-semibold text-paper underline-offset-4 hover:bg-raised",
          cancelButton: "h-control-sm shrink-0 rounded-sm px-3 text-small text-ink-soft hover:bg-raised",
          icon: "text-paper",
        },
      }}
    />
  )
}

// Atalhos com o texto do guia (9.3).
export const toast = Object.assign(
  (mensagem: string, opcoes?: Parameters<typeof sonner>[1]) => sonner(mensagem, opcoes),
  {
    // "Tarefa concluída." · "Desfazer"
    comDesfazer: (mensagem: string, desfazer: () => void) => sonner(mensagem, { action: { label: "Desfazer", onClick: desfazer } }),
    // Erro: diz o que aconteceu e como resolver, com "Tentar de novo" quando faz sentido.
    erro: (mensagem: string, tentarDeNovo?: () => void) =>
      sonner(mensagem, tentarDeNovo ? { action: { label: "Tentar de novo", onClick: tentarDeNovo } } : undefined),
    sucesso: (mensagem: string) => sonner(mensagem),
  }
)
