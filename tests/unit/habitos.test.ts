import { describe, expect, it } from "vitest"

import { calcularSequencia, maiorSequencia, percentualRecente, resumoDias, semanaDe, valeNoDia } from "@/lib/domain/habitos"
import type { Habito } from "@/lib/tipos"

// 2026-11-01 é domingo.
const HOJE = "2026-11-01"
const TODOS = [0, 1, 2, 3, 4, 5, 6]
const habito = (dias: number[], feitos: string[]): Habito => ({ id: "h", nome: "Leitura", icone: "feito", dias, feitos, criadoEm: 0 })

describe("hábitos", () => {
  it("vale só nos dias programados", () => {
    const h = habito([1, 3, 5], [])
    expect(valeNoDia(h, "2026-10-26")).toBe(true)
    expect(valeNoDia(h, "2026-10-27")).toBe(false)
  })

  it("sequência conta dias programados seguidos e pula os não programados", () => {
    const h = habito([1, 3, 5], ["2026-10-26", "2026-10-28", "2026-10-30"])
    expect(calcularSequencia(h, HOJE)).toBe(3)
  })

  it("hoje sem marcar não quebra a sequência", () => {
    expect(calcularSequencia(habito(TODOS, ["2026-10-31", "2026-10-30"]), HOJE)).toBe(2)
  })

  it("um dia programado perdido quebra a sequência", () => {
    expect(calcularSequencia(habito(TODOS, ["2026-10-31", "2026-10-29"]), HOJE)).toBe(1)
  })

  it("percentual recente considera só dias programados", () => {
    expect(percentualRecente(habito(TODOS, []), HOJE)).toBe(0)
    expect(percentualRecente(habito(TODOS, ["2026-11-01", "2026-10-31", "2026-10-30"]), HOJE, 10)).toBe(30)
  })

  it("maior sequência", () => {
    const h = habito(TODOS, ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-30", "2026-10-31"])
    expect(maiorSequencia(h, HOJE, 30)).toBe(4)
  })

  it("resumo dos dias em texto", () => {
    expect(resumoDias([5, 1, 3])).toBe("Seg, Qua e Sex")
    expect(resumoDias(TODOS)).toBe("Todos os dias")
    expect(resumoDias([1, 2, 3, 4, 5])).toBe("Dias úteis")
    expect(resumoDias([0])).toBe("Dom")
  })

  it("semana começa na segunda", () => {
    expect(semanaDe(HOJE)).toEqual(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"])
  })
})
