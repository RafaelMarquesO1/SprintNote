// Rafael Marques - 23/10/2026
// Um membro da equipe: PATCH muda o papel { papel } (dono) e DELETE remove a pessoa
// ou faz a própria pessoa sair. "?anonimizar=1" troca o nome nos comentários por "Ex-membro".

import { alterarPapel, removerMembro } from "@/lib/servidor/equipes"
import { responder, rota } from "@/lib/servidor/rotas-equipe"
import type { PapelEquipe } from "@/lib/tipos-equipe"

export const PATCH = rota(async ({ usuario, params, corpo }) => {
  const { papel } = await corpo()
  await alterarPapel(params.equipeId, usuario, params.usuarioId, papel as PapelEquipe)
  return responder({ ok: true })
})

export const DELETE = rota(async ({ requisicao, usuario, params }) => {
  const anonimizar = new URL(requisicao.url).searchParams.get("anonimizar") === "1"
  return responder(await removerMembro(params.equipeId, usuario, params.usuarioId, anonimizar))
})
