"use server"

// Server Actions dos dados do usuário (redesign v2, seção 4.5).
// O app guarda cada área (notas, tarefas, hábitos…) como JSON em "dados_usuario", com versão.
// Mesma lógica e mesma tabela da rota /api/dados; nada muda no banco.

import { gravarArea, lerDadosDaConta, lerVersoesDaConta, type DadosDaConta, type ResultadoGravacao } from "@/lib/servidor/dados"
import { usuarioAtual } from "@/lib/servidor/sessao"

type SemConta = { ok: false; erro: "sem-conta" }

export async function lerMeusDados(): Promise<DadosDaConta | SemConta> {
  const usuario = await usuarioAtual()
  if (!usuario) return { ok: false, erro: "sem-conta" }
  return lerDadosDaConta(usuario.id)
}

export async function lerMinhasVersoes(): Promise<Record<string, string> | SemConta> {
  const usuario = await usuarioAtual()
  if (!usuario) return { ok: false, erro: "sem-conta" }
  return lerVersoesDaConta(usuario.id)
}

export async function salvarArea(chave: string, texto: string, versaoBase: string | null): Promise<ResultadoGravacao | SemConta> {
  const usuario = await usuarioAtual()
  if (!usuario) return { ok: false, erro: "sem-conta" }
  return gravarArea(usuario.id, chave, texto, versaoBase)
}
