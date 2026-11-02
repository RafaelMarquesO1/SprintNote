import { describe, expect, it } from "vitest"

import { formaDaColuna, progressoQuadro, resumoProgresso } from "@/lib/domain/quadros"
import type { CartaoKanban, ColunaKanban } from "@/lib/tipos"

const coluna = (id: string, titulo: string, concluida = false) =>
  ({ id, quadroId: "q", titulo, cor: null, limite: null, concluida, recolhida: false }) as ColunaKanban
let seq = 0
const cartao = (colunaId: string, arquivado = false) => ({ id: String(seq++), colunaId, arquivado }) as unknown as CartaoKanban

describe("quadros", () => {
  it("deduz a forma do status pelo nome", () => {
    expect(formaDaColuna(coluna("a", "Backlog"))).toBe("backlog")
    expect(formaDaColuna(coluna("a", "Pausado"))).toBe("paused")
    expect(formaDaColuna(coluna("a", "Em andamento"))).toBe("doing")
    expect(formaDaColuna(coluna("a", "Qualquer", true))).toBe("done")
    expect(formaDaColuna(coluna("a", "A fazer"))).toBe("todo")
    expect(formaDaColuna({ titulo: "Backlog", concluida: false, forma: "doing" })).toBe("doing")
  })

  it("calcula percentual sem arquivados", () => {
    const colunas = [coluna("b", "Backlog"), coluna("c", "Concluído", true)]
    const progresso = progressoQuadro(colunas, [cartao("b"), cartao("c"), cartao("c"), cartao("c"), cartao("c", true)])
    expect(progresso).toMatchObject({ total: 4, concluidos: 3, percentual: 75 })
    expect(resumoProgresso(progresso)).toBe("3 de 4 concluídos, 1 no backlog")
  })

  it("quadro vazio", () => {
    expect(progressoQuadro([], []).percentual).toBe(0)
    expect(resumoProgresso(progressoQuadro([], []))).toBe("Nenhum cartão ainda")
  })
})
