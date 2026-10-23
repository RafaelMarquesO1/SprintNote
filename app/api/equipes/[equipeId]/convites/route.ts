// Rafael Marques - 23/10/2026
// Convites por link (só o dono): GET lista os em aberto, POST cria { papel, email? }.
// O token do link só aparece na resposta do POST.

import { criarConvite, listarConvites } from "@/lib/servidor/equipes"
import { responder, rota } from "@/lib/servidor/rotas-equipe"
import type { PapelConvite } from "@/lib/tipos-equipe"

export const GET = rota(async ({ usuario, params }) => responder({ convites: await listarConvites(params.equipeId, usuario) }))

export const POST = rota(async ({ usuario, params, corpo }) => {
  const { papel, email } = await corpo()
  const criado = await criarConvite(params.equipeId, usuario, papel as PapelConvite, typeof email === "string" ? email : null)
  return responder(criado, 201)
})
