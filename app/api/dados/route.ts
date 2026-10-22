// Rafael Marques - 21/10/2026
// Dados do usuário logado: cada área do app (notas, tarefas, hábitos…)
// é guardada como um JSON numa linha de "dados_usuario".
//   GET              → todas as áreas  { dados: { "sprintnote-notas": {...}, ... } }
//   PUT ?chave=nome  → grava uma área (corpo = o JSON da área)

import { banco } from "@/lib/servidor/banco"
import { usuarioAtual } from "@/lib/servidor/sessao"
import { PREFIXO_DADOS } from "@/lib/tipos-conta"

const TAMANHO_MAXIMO = 20 * 1024 * 1024 // 20 MB por área (notas com imagens)
const semCache = { "Cache-Control": "no-store" }

const naoAutorizado = () => Response.json({ erro: "Entre na sua conta." }, { status: 401, headers: semCache })

export async function GET() {
  const usuario = await usuarioAtual()
  if (!usuario) return naoAutorizado()
  const linhas = await banco()`SELECT chave, valor FROM dados_usuario WHERE usuario_id = ${usuario.id}`
  const dados = Object.fromEntries(linhas.map((linha) => [String(linha.chave), linha.valor]))
  return Response.json({ dados }, { headers: semCache })
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

  await banco()`
    INSERT INTO dados_usuario (usuario_id, chave, valor, atualizado_em)
    VALUES (${usuario.id}, ${chave}, ${texto}::jsonb, now())
    ON CONFLICT (usuario_id, chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = now()
  `
  return Response.json({ ok: true }, { headers: semCache })
}
