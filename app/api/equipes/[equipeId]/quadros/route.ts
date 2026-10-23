// Rafael Marques - 23/10/2026
// Cria um quadro na equipe { id?, titulo, icone } (dono ou editor).

import { criarQuadroEquipe } from "@/lib/servidor/equipes"
import { responder, rota } from "@/lib/servidor/rotas-equipe"

export const POST = rota(async ({ usuario, params, corpo }) => {
  const quadroId = await criarQuadroEquipe(params.equipeId, usuario, await corpo())
  return responder({ quadroId }, 201)
})
