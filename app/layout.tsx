import type { Metadata } from "next";
import { Caveat, Geist, Geist_Mono, Literata } from "next/font/google";
import "./globals.css";

import { AppSidebar } from "@/components/app-sidebar";
import { BotaoBusca, DialogoBusca } from "@/components/busca";
import { PortaoConta } from "@/components/conta/portao-conta";
import { InlineScript } from "@/components/inline-script";
import { themeScript } from "@/lib/theme";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Rafael Marques - 21/10/2026
// Fonte serifada opcional das notas (Personalizar → Fonte → Serifada).
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

// Fonte manuscrita opcional das notas (Personalizar → Fonte → Manuscrita).
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SprintNote",
  description: "Notas estilo Notion + Obsidian",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${literata.variable} ${caveat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body className="min-h-full">
        {/* Rafael Marques - 21/10/2026 - abertura, login/cadastro e sincronização com o banco */}
        <PortaoConta depoisDeEntrar={<DialogoBusca />}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="min-w-0">
            <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">SprintNote</span>
              <div className="ml-auto">
                <BotaoBusca />
              </div>
            </header>
            <div className="min-w-0 flex-1 p-4 md:p-6">{children}</div>
          </SidebarInset>
        </SidebarProvider>
        </PortaoConta>
      </body>
    </html>
  );
}