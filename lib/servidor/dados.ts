// Áreas de dados do usuário (tabela "dados_usuario"): leitura e gravação com versão.
// Usado pela rota /api/dados (contrato antigo, mantido) e pelas Server Actions de lib/actions/dados.ts.
// Rafael Marques - 30/10/2026 (proteção entre aparelhos) · redesign v2: lógica extraída da rota.

import "server-only"

import { banco } from "@/lib/servidor/banco"
import { PREFIXO_DADOS } from "@/lib/tipos-conta"

export const TAMANHO_MAXIMO = 20 * 1024 * 1024 // 20 MB por área (notas com imagens)

export type DadosDaConta = { dados: Record<string, unknown>; versoes: Record<string, string> }

export type ResultadoGravacao =
  | { ok: true; versao: string }
  | { ok: false; erro: "conflito"; valor: unknown; versao: string | null }
  | { ok: false; erro: "invalido" | "grande"; mensagem: string }

export function chaveValida(chave: string) {
  return chave.startsWith(PREFIXO_DADOS) && chave.length <= 64
}

export async function lerDadosDaConta(usuarioId: string): Promise<DadosDaConta> {
  const linhas = await banco()`SELECT chave, valor, atualizado_em::text AS versao FROM dados_usuario WHERE usuario_id = ${usuarioId}`
  return {
    dados: Object.fromEntries(linhas.map((linha) => [String(linha.chave), linha.valor])),
    versoes: Object.fromEntries(linhas.map((linha) => [String(linha.chave), String(linha.versao)])),
  }
}

export async function lerVersoesDaConta(usuarioId: string): Promise<Record<string, string>> {
  const linhas = await banco()`SELECT chave, atualizado_em::text AS versao FROM dados_usuario WHERE usuario_id = ${usuarioId}`
  return Object.fromEntries(linhas.map((linha) => [String(linha.chave), String(linha.versao)]))
}

// Grava uma área. versaoBase: versão em que a mudança foi feita ("" = a área ainda não existia;
// null = cliente antigo sem versão, grava por cima). Se outra versão já está no banco, nada é gravado.
export async function gravarArea(usuarioId: string, chave: string, texto: string, versaoBase: string | null): Promise<ResultadoGravacao> {
  if (!chaveValida(chave)) return { ok: false, erro: "invalido", mensagem: "Chave inválida." }
  if (texto.length > TAMANHO_MAXIMO) return { ok: false, erro: "grande", mensagem: "Dados grandes demais." }
  try {
    JSON.parse(texto)
  } catch {
    return { ok: false, erro: "invalido", mensagem: "JSON inválido." }
  }

  const sql = banco()
  if (versaoBase === null) {
    const [linha] = await sql`
      INSERT INTO dados_usuario (usuario_id, chave, valor, atualizado_em)
      VALUES (${usuarioId}, ${chave}, ${texto}::jsonb, now())
      ON CONFLICT (usuario_id, chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = now()
      RETURNING atualizado_em::text AS versao
    `
    return { ok: true, versao: String(linha.versao) }
  }

  const gravadas =
    versaoBase === ""
      ? await sql`
          INSERT INTO dados_usuario (usuario_id, chave, valor, atualizado_em)
          VALUES (${usuarioId}, ${chave}, ${texto}::jsonb, now())
          ON CONFLICT (usuario_id, chave) DO NOTHING
          RETURNING atualizado_em::text AS versao
        `
      : await sql`
          UPDATE dados_usuario SET valor = ${texto}::jsonb, atualizado_em = now()
          WHERE usuario_id = ${usuarioId} AND chave = ${chave} AND atualizado_em = ${versaoBase}::timestamptz
          RETURNING atualizado_em::text AS versao
        `
  if (gravadas.length > 0) return { ok: true, versao: String(gravadas[0].versao) }

  // Outro aparelho salvou antes: devolve o que está no banco para o app juntar.
  const [atual] = await sql`SELECT valor, atualizado_em::text AS versao FROM dados_usuario WHERE usuario_id = ${usuarioId} AND chave = ${chave}`
  return { ok: false, erro: "conflito", valor: atual?.valor ?? null, versao: atual ? String(atual.versao) : null }
}
