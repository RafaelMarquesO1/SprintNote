import { describe, expect, it } from "vitest"

import { interpretarCaptura } from "@/lib/domain/captura"
import { fraseResumo, saudacao } from "@/lib/domain/hoje"

const HOJE = "2026-11-01"
const vazio = { tarefas: 0, atrasadas: 0, habitosRestantes: 0, proximaRotina: null, cartoesAbertos: 0, quadroDosCartoes: null }

describe("captura rápida", () => {
  it("entende prazo, prioridade e lista", () => {
    expect(interpretarCaptura("Estudar AWS @amanhã !alta #estudos", HOJE)).toEqual({
      titulo: "Estudar AWS",
      prazo: "2026-11-02",
      prazoEscrito: "amanhã",
      prioridade: "alta",
      lista: "estudos",
    })
  })
  it("texto sem marcações fica igual", () => {
    expect(interpretarCaptura("  Ligar para a Ana  ", HOJE)).toMatchObject({ titulo: "Ligar para a Ana", prazo: null, prioridade: null, lista: null })
  })
  it("!média com e sem acento", () => {
    expect(interpretarCaptura("x !media", HOJE).prioridade).toBe("media")
    expect(interpretarCaptura("x !média", HOJE).prioridade).toBe("media")
  })
})

describe("saudação", () => {
  it("segue os horários do guia", () => {
    expect(saudacao(5)).toBe("Bom dia")
    expect(saudacao(11)).toBe("Bom dia")
    expect(saudacao(12)).toBe("Boa tarde")
    expect(saudacao(17)).toBe("Boa tarde")
    expect(saudacao(18)).toBe("Boa noite")
    expect(saudacao(4)).toBe("Boa noite")
  })
})

describe("frase-resumo", () => {
  it("dia vazio com cartão em aberto", () => {
    expect(fraseResumo({ ...vazio, cartoesAbertos: 1, quadroDosCartoes: "Equipe Delta" })).toBe(
      "Nada marcado para o resto de hoje. Um cartão segue em aberto em Equipe Delta."
    )
  })
  it("uma tarefa no feminino", () => {
    expect(fraseResumo({ ...vazio, tarefas: 1 })).toBe("Uma tarefa para hoje.")
  })
  it("tarefas, hábitos e rotina", () => {
    expect(fraseResumo({ ...vazio, tarefas: 2, atrasadas: 1, habitosRestantes: 1, proximaRotina: { titulo: "Academia", horario: "19:00" } })).toBe(
      "2 tarefas e um hábito para hoje, uma atrasada. Próximo na rotina: Academia, às 19:00."
    )
  })
})
