// Rafael Marques - 21/10/2026
// Quem está logado neste navegador (null = ninguém).

import { usuarioAtual } from "@/lib/servidor/sessao"

export async function GET() {
  try {
    return Response.json({ usuario: await usuarioAtual() }, { headers: { "Cache-Control": "no-store" } })
  } catch (erro) {
    console.error("Erro ao ler a sessão:", erro)
    return Response.json({ erro: "Falha ao falar com o banco." }, { status: 503 })
  }
}
