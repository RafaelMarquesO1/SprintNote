// Rafael Marques - 23/10/2026
// Uma equipe: PATCH renomeia { nome } e DELETE exclui (só o dono).

import { excluirEquipe, renomearEquipe } from "@/lib/servidor/equipes"
import { responder, rota } from "@/lib/servidor/rotas-equipe"

export const PATCH = rota(async ({ usuario, params, corpo }) => {
  const { nome } = await corpo()
  await renomearEquipe(params.equipeId, usuario, typeof nome === "string" ? nome : "")
  return responder({ ok: true })
})

export const DELETE = rota(async ({ usuario, params }) => {
  await excluirEquipe(params.equipeId, usuario)
  return responder({ ok: true })
})
