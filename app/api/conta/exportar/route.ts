// Rafael Marques - 22/10/2026
// "Baixar meus dados": tudo o que o banco guarda sobre a conta, num JSON
// legível por máquina (acesso e portabilidade — LGPD, Art. 18, II e V).

import { banco } from "@/lib/servidor/banco"
import { usuarioAtual } from "@/lib/servidor/sessao"

export async function GET() {
  const usuario = await usuarioAtual()
  if (!usuario) return Response.json({ erro: "Entre na sua conta." }, { status: 401, headers: { "Cache-Control": "no-store" } })

  const sql = banco()
  const [conta] = await sql`SELECT nome, email, criado_em, termos_aceitos_em, versao_termos FROM usuarios WHERE id = ${usuario.id}`
  const sessoes = await sql`SELECT criado_em, expira_em FROM sessoes WHERE usuario_id = ${usuario.id} AND expira_em > now() ORDER BY criado_em`
  const dados = await sql`SELECT chave, valor, atualizado_em FROM dados_usuario WHERE usuario_id = ${usuario.id} ORDER BY chave`

  const arquivo = {
    app: "SprintNote",
    geradoEm: new Date().toISOString(),
    observacao: "Senha não incluída: é guardada só como hash irreversível. Sessões listadas sem o token.",
    conta: { id: usuario.id, ...conta },
    sessoesAtivas: sessoes,
    conteudo: Object.fromEntries(dados.map((linha) => [String(linha.chave), { atualizadoEm: linha.atualizado_em, dados: linha.valor }])),
  }

  const dia = new Date().toISOString().slice(0, 10)
  return new Response(JSON.stringify(arquivo, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sprintnote-meus-dados-${dia}.json"`,
      "Cache-Control": "no-store",
    },
  })
}
