import { unstable_rethrow } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"

import { PortaoConta } from "@/components/conta/portao-conta"
import { TelaAbertura } from "@/components/conta/tela-abertura"
import { Shell } from "@/components/shell/shell"
import { lerDadosDaConta, type DadosDaConta } from "@/lib/servidor/dados"
import { usuarioAtual } from "@/lib/servidor/sessao"
import type { Usuario } from "@/lib/tipos-conta"

// Redesign v2 (4.5): a sessão e os dados da conta são lidos no servidor, antes da página chegar.
// Quem não está logado vê a página inicial pública e a entrada (PortaoConta), sem trocar de URL.
export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<TelaAbertura />}>
      <ContaDoServidor>{children}</ContaDoServidor>
    </Suspense>
  )
}

async function ContaDoServidor({ children }: { children: React.ReactNode }) {
  // Só na hora do pedido (nunca na pré-renderização): depende do cookie da sessão.
  await connection()
  let usuario: Usuario | null = null
  let dados: DadosDaConta | null = null
  let falhou = false
  try {
    usuario = await usuarioAtual()
    if (usuario) dados = await lerDadosDaConta(usuario.id)
  } catch (erro) {
    unstable_rethrow(erro)
    console.error("Erro ao ler a conta:", erro)
    falhou = true
  }
  return (
    <PortaoConta usuarioInicial={usuario} dadosIniciais={dados} falhouNoServidor={falhou}>
      <Shell>{children}</Shell>
    </PortaoConta>
  )
}
