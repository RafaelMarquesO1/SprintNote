import type { Metadata, Viewport } from "next"

import "./globals.css"
import { classesFontes } from "./fonts"

import { InlineScript } from "@/components/inline-script"
import { MotionProvider } from "@/components/motion/motion-provider"
import { Toaster } from "@/components/ui/toast"
import { themeScript } from "@/lib/theme"

export const metadata: Metadata = {
  title: { default: "SprintNote", template: "%s · SprintNote" },
  description: "Notas, tarefas e projetos que conversam entre si. Escreva uma nota, cite o cartão do projeto e veja seu dia numa tela.",
  applicationName: "SprintNote",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  viewportFit: "cover",
}

// Redesign v2: o layout raiz só cuida de fontes, tema, motion e toasts.
// O app (menu, conta e dados) fica em app/(app)/layout.tsx; páginas públicas ficam fora dele.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-theme="dark" className={`${classesFontes} dark h-full antialiased`} suppressHydrationWarning>
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body className="min-h-full">
        <MotionProvider>
          {children}
          <Toaster />
        </MotionProvider>
      </body>
    </html>
  )
}
