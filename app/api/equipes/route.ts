// Rafael Marques - 23/10/2026
// Equipes da pessoa logada.
//   GET  → minhas equipes (com membros e quadros)
//   POST → cria uma equipe { nome }

import { criarEquipe, listarEquipes } from "@/lib/servidor/equipes"
import { responder, rota } from "@/lib/servidor/rotas-equipe"

export const GET = rota(async ({ usuario }) => responder({ equipes: await listarEquipes(usuario.id) }))

export const POST = rota(async ({ usuario, corpo }) => {
  const { nome } = await corpo()
  const equipeId = await criarEquipe(usuario, typeof nome === "string" ? nome : "")
  return responder({ equipeId }, 201)
})
