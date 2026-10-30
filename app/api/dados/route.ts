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

import { banco } from "@/lib/servidor/banco"
import { usuarioAtual } from "@/lib/servidor/sessao"
import { PREFIXO_DADOS } from "@/lib/tipos-conta"

const TAMANHO_MAXIMO = 20 * 1024 * 1024 // 20 MB por área (notas com imagens)
const semCache = { "Cache-Control": "no-store" }

const naoAutorizado = () => Response.json({ erro: "Entre na sua conta." }, { status: 401, headers: semCache })

export async function GET(requisicao: Request) {
  const usuario = await usuarioAtual()
  if (!usuario) return naoAutorizado()
  const sql = banco()

  if (new URL(requisicao.url).searchParams.has("versoes")) {
    const linhas = await sql`SELECT chave, atualizado_em::text AS versao FROM dados_usuario WHERE usuario_id = ${usuario.id}`
    const versoes = Object.fromEntries(linhas.map((linha) => [String(linha.chave), String(linha.versao)]))
    return Response.json({ versoes }, { headers: semCache })
  }

  const linhas = await sql`SELECT chave, valor, atualizado_em::text AS versao FROM dados_usuario WHERE usuario_id = ${usuario.id}`
  const dados = Object.fromEntries(linhas.map((linha) => [String(linha.chave), linha.valor]))
  const versoes = Object.fromEntries(linhas.map((linha) => [String(linha.chave), String(linha.versao)]))
  return Response.json({ dados, versoes }, { headers: semCache })
}

export async function PUT(requisicao: Request) {
  const usuario = await usuarioAtual()
  if (!usuario) return naoAutorizado()

  const chave = new URL(requisicao.url).searchParams.get("chave") ?? ""
  if (!chave.startsWith(PREFIXO_DADOS) || chave.length > 64) {
    return Response.json({ erro: "Chave inválida." }, { status: 400, headers: semCache })
  }

  const texto = await requisicao.text()
  if (texto.length > TAMANHO_MAXIMO) return Response.json({ erro: "Dados grandes demais." }, { status: 413, headers: semCache })
  try {
    JSON.parse(texto)
  } catch {
    return Response.json({ erro: "JSON inválido." }, { status: 400, headers: semCache })
  }

  const sql = banco()
  const versaoBase = requisicao.headers.get("x-versao-base")

  // Abas abertas antes desta atualização não mandam a versão: gravam como antes.
  if (versaoBase === null) {
    const [linha] = await sql`
      INSERT INTO dados_usuario (usuario_id, chave, valor, atualizado_em)
      VALUES (${usuario.id}, ${chave}, ${texto}::jsonb, now())
      ON CONFLICT (usuario_id, chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = now()
      RETURNING atualizado_em::text AS versao
    `
    return Response.json({ ok: true, versao: String(linha.versao) }, { headers: semCache })
  }

  const gravadas =
    versaoBase === ""
      ? await sql`
          INSERT INTO dados_usuario (usuario_id, chave, valor, atualizado_em)
          VALUES (${usuario.id}, ${chave}, ${texto}::jsonb, now())
          ON CONFLICT (usuario_id, chave) DO NOTHING
          RETURNING atualizado_em::text AS versao
        `
      : await sql`
          UPDATE dados_usuario SET valor = ${texto}::jsonb, atualizado_em = now()
          WHERE usuario_id = ${usuario.id} AND chave = ${chave} AND atualizado_em = ${versaoBase}::timestamptz
          RETURNING atualizado_em::text AS versao
        `
  if (gravadas.length > 0) return Response.json({ ok: true, versao: String(gravadas[0].versao) }, { headers: semCache })

  // Outro aparelho salvou antes: devolve o que está no banco para o app juntar.
  const [atual] = await sql`
    SELECT valor, atualizado_em::text AS versao FROM dados_usuario WHERE usuario_id = ${usuario.id} AND chave = ${chave}
  `
  return Response.json(
    { erro: "conflito", valor: atual?.valor ?? null, versao: atual ? String(atual.versao) : null },
    { status: 409, headers: semCache }
  )
}
