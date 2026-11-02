// Rafael Marques - 21/10/2026
// Dados do usuário logado: cada área do app (notas, tarefas, hábitos…)
// é guardada como um JSON numa linha de "dados_usuario".
//   GET              → todas as áreas  { dados: { "sprintnote-notas": {...}, ... }, versoes: { ... } }
//   GET ?versoes=1   → só as versões   { versoes: { "sprintnote-notas": "2026-10-30 ..." } }
//   PUT ?chave=nome  → grava uma área (corpo = o JSON da área)
//
// Rafael Marques - 30/10/2026: proteção contra um aparelho apagar o que outro salvou.
// A versão de cada área é o seu "atualizado_em". O app manda no cabeçalho
// "x-versao-base" a versão em que a mudança foi feita ("" = a área ainda não existia).
// Se o servidor já tiver outra versão, nada é gravado: responde 409 com o que está
// no banco, e o app junta as mudanças e manda de novo.
//
// Redesign v2: a lógica foi para lib/servidor/dados.ts (a mesma das Server Actions).
// Esta rota continua com o mesmo contrato; o app a usa só para o envio com "keepalive" ao fechar a aba.

import { gravarArea, lerDadosDaConta, lerVersoesDaConta } from "@/lib/servidor/dados"
import { usuarioAtual } from "@/lib/servidor/sessao"

const semCache = { "Cache-Control": "no-store" }

const naoAutorizado = () => Response.json({ erro: "Entre na sua conta." }, { status: 401, headers: semCache })

export async function GET(requisicao: Request) {
  const usuario = await usuarioAtual()
  if (!usuario) return naoAutorizado()
  if (new URL(requisicao.url).searchParams.has("versoes")) {
    return Response.json({ versoes: await lerVersoesDaConta(usuario.id) }, { headers: semCache })
  }
  return Response.json(await lerDadosDaConta(usuario.id), { headers: semCache })
}

export async function PUT(requisicao: Request) {
  const usuario = await usuarioAtual()
  if (!usuario) return naoAutorizado()

  const chave = new URL(requisicao.url).searchParams.get("chave") ?? ""
  const resultado = await gravarArea(usuario.id, chave, await requisicao.text(), requisicao.headers.get("x-versao-base"))
  if (resultado.ok) return Response.json({ ok: true, versao: resultado.versao }, { headers: semCache })
  if (resultado.erro === "conflito") {
    return Response.json({ erro: "conflito", valor: resultado.valor, versao: resultado.versao }, { status: 409, headers: semCache })
  }
  return Response.json({ erro: resultado.mensagem }, { status: resultado.erro === "grande" ? 413 : 400, headers: semCache })
}
