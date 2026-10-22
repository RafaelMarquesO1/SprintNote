// Rafael Marques - 21/10/2026
// Sessão do usuário: token aleatório num cookie httpOnly; no banco fica só
// o hash do token (quem vê o banco não consegue usar a sessão).

import "server-only"
import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"

import { banco } from "@/lib/servidor/banco"
import type { Usuario } from "@/lib/tipos-conta"

const COOKIE = "sprintnote_sessao"
const DURACAO_DIAS = 30

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")

export async function criarSessao(usuarioId: string) {
  const token = randomBytes(32).toString("base64url")
  const expiraEm = new Date(Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000)
  const sql = banco()
  await sql`DELETE FROM sessoes WHERE usuario_id = ${usuarioId} AND expira_em < now()`
  await sql`INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES (${hashToken(token)}, ${usuarioId}, ${expiraEm.toISOString()})`
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEm,
  })
}

export async function usuarioAtual(): Promise<Usuario | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const linhas = await banco()`
    SELECT u.id, u.nome, u.email FROM sessoes s
    JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expira_em > now()
  `
  const linha = linhas[0]
  return linha ? { id: String(linha.id), nome: String(linha.nome), email: String(linha.email) } : null
}

// Encerra as sessões do usuário em todos os aparelhos, menos (opcionalmente) a atual.
export async function encerrarOutrasSessoes(usuarioId: string, manterAtual: boolean) {
  const token = (await cookies()).get(COOKIE)?.value
  if (manterAtual && token) await banco()`DELETE FROM sessoes WHERE usuario_id = ${usuarioId} AND token_hash <> ${hashToken(token)}`
  else await banco()`DELETE FROM sessoes WHERE usuario_id = ${usuarioId}`
}

export async function apagarCookieSessao() {
  ;(await cookies()).delete(COOKIE)
}

export async function encerrarSessao() {
  const loja = await cookies()
  const token = loja.get(COOKIE)?.value
  if (token) await banco()`DELETE FROM sessoes WHERE token_hash = ${hashToken(token)}`
  loja.delete(COOKIE)
}
