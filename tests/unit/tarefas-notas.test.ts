import { describe, expect, it } from "vitest"

import { alternarTarefaNoConteudo, extrairTarefasDaNota, interpretarPrazo, rotuloPrazo } from "@/lib/tarefas-notas"
import type { Nota } from "@/lib/tipos"

const HOJE = "2026-11-01" // domingo
const nota = (conteudo: string) => ({ id: "n1", titulo: "Nota", conteudo, livroId: null }) as unknown as Nota

describe("tarefas dentro de notas", () => {
  it("interpreta prazos", () => {
    expect(interpretarPrazo("hoje", HOJE)).toBe(HOJE)
    expect(interpretarPrazo("amanhã", HOJE)).toBe("2026-11-02")
    expect(interpretarPrazo("amanha", HOJE)).toBe("2026-11-02")
    expect(interpretarPrazo("sex", HOJE)).toBe("2026-11-06")
    expect(interpretarPrazo("dom", HOJE)).toBe(HOJE)
    expect(interpretarPrazo("25/12", HOJE)).toBe("2026-12-25")
    expect(interpretarPrazo("10/10", HOJE)).toBe("2027-10-10")
    expect(interpretarPrazo("2026-11-20", HOJE)).toBe("2026-11-20")
  })

  it("extrai tarefa com prazo e tag, sem levar o @ e o # no texto", () => {
    const [tarefa] = extrairTarefasDaNota(nota("- [ ] Estudar @amanhã #prova"), [], HOJE)
    expect(tarefa.texto).toBe("Estudar")
    expect(tarefa.prazo).toBe("2026-11-02")
    expect(tarefa.tags).toEqual(["prova"])
    expect(tarefa.marcada).toBe(false)
  })

  it("ignora caixas vazias e blocos de código", () => {
    const tarefas = extrairTarefasDaNota(nota("- [ ] \n```\n- [ ] não é tarefa\n```\n- [x] Feita"), [], HOJE)
    expect(tarefas).toHaveLength(1)
    expect(tarefas[0].texto).toBe("Feita")
    expect(tarefas[0].marcada).toBe(true)
    expect(tarefas[0].indice).toBe(1)
  })

  it("alterna a tarefa certa no Markdown", () => {
    expect(alternarTarefaNoConteudo("- [ ] Um\n- [ ] Dois", 1)).toBe("- [ ] Um\n- [x] Dois")
  })

  it("rótulo do prazo", () => {
    expect(rotuloPrazo(HOJE, HOJE)).toBe("hoje")
    expect(rotuloPrazo("2026-11-02", HOJE)).toBe("amanhã")
  })
})
