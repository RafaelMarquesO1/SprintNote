// Rafael Marques - 29/10/2026
// Número do cartão dentro do quadro (#1, #2…), para aparecer no cartão e na URL.
// Quadros pessoais guardam o número no próprio cartão. Os de equipe ainda não têm onde guardar no
// servidor: o número sai da ordem de criação (muda só se um cartão mais antigo for excluído).

import type { CartaoKanban } from "@/lib/tipos"

const porCriacao = (a: CartaoKanban, b: CartaoKanban) => a.criadoEm - b.criadoEm || (a.id < b.id ? -1 : 1)

// Número de cada cartão do quadro (passe todos, inclusive os arquivados).
export function numerarCartoes(cartoes: CartaoKanban[]): Map<string, number> {
  const mapa = new Map<string, number>()
  let maior = 0
  for (const cartao of cartoes) {
    if (cartao.numero) {
      mapa.set(cartao.id, cartao.numero)
      maior = Math.max(maior, cartao.numero)
    }
  }
  for (const cartao of cartoes.filter((item) => !item.numero).sort(porCriacao)) mapa.set(cartao.id, ++maior)
  return mapa
}
