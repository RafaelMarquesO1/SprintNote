// Rafael Marques - 26/10/2026
// Complexidade do cartão: baixa, média ou alta. Fica guardada no campo `estimativa` do cartão
// (1, 2 ou 3), que também existe no banco dos quadros de equipe.

export type Complexidade = "baixa" | "media" | "alta"

export const complexidades: { id: Complexidade; valor: number; rotulo: string }[] = [
  { id: "baixa", valor: 1, rotulo: "Baixa" },
  { id: "media", valor: 2, rotulo: "Média" },
  { id: "alta", valor: 3, rotulo: "Alta" },
]

// Número guardado → complexidade (valores antigos maiores que 3 contam como alta).
export function complexidadeDe(estimativa: number | null | undefined): Complexidade | null {
  if (estimativa === null || estimativa === undefined || !Number.isFinite(estimativa) || estimativa <= 0) return null
  if (estimativa <= 1) return "baixa"
  if (estimativa <= 2) return "media"
  return "alta"
}

export const rotuloComplexidade = (estimativa: number | null | undefined) => {
  const id = complexidadeDe(estimativa)
  return id ? complexidades.find((item) => item.id === id)!.rotulo : null
}
