// Rafael Marques - 26/10/2026
// Testes das datas dos cartões recorrentes (Node): npm run teste:kanban

import assert from "node:assert/strict"

import { descreverRecorrencia, prazoDaProxima, proximoPrazo } from "./recorrencia.ts"

let falhas = 0
let total = 0
function caso(nome: string, corpo: () => void) {
  total++
  try {
    corpo()
  } catch (erro) {
    falhas++
    console.log(`FALHA  ${nome}\n${erro instanceof Error ? erro.message : erro}\n`)
  }
}

caso("diária e semanal", () => {
  assert.equal(proximoPrazo("2026-10-26", { frequencia: "diaria", intervalo: 1 }), "2026-10-27")
  assert.equal(proximoPrazo("2026-10-31", { frequencia: "diaria", intervalo: 1 }), "2026-11-01")
  assert.equal(proximoPrazo("2026-12-30", { frequencia: "diaria", intervalo: 3 }), "2027-01-02")
  assert.equal(proximoPrazo("2026-10-26", { frequencia: "semanal", intervalo: 2 }), "2026-11-09")
})

caso("mensal respeita o fim do mês", () => {
  assert.equal(proximoPrazo("2026-01-31", { frequencia: "mensal", intervalo: 1 }), "2026-02-28")
  assert.equal(proximoPrazo("2028-01-31", { frequencia: "mensal", intervalo: 1 }), "2028-02-29")
  assert.equal(proximoPrazo("2026-11-30", { frequencia: "mensal", intervalo: 3 }), "2027-02-28")
  assert.equal(proximoPrazo("2026-12-15", { frequencia: "mensal", intervalo: 1 }), "2027-01-15")
})

caso("anual (inclui 29/02)", () => {
  assert.equal(proximoPrazo("2026-10-26", { frequencia: "anual", intervalo: 1 }), "2027-10-26")
  assert.equal(proximoPrazo("2028-02-29", { frequencia: "anual", intervalo: 1 }), "2029-02-28")
})

caso("intervalo inválido vira 1", () => {
  assert.equal(proximoPrazo("2026-10-26", { frequencia: "diaria", intervalo: 0 }), "2026-10-27")
  assert.equal(proximoPrazo("2026-10-26", { frequencia: "diaria", intervalo: -4 }), "2026-10-27")
})

caso("sem prazo conta a partir de hoje; prazo no passado segue a série", () => {
  assert.equal(prazoDaProxima(null, { frequencia: "semanal", intervalo: 1 }, "2026-10-26"), "2026-11-02")
  assert.equal(prazoDaProxima("2026-10-20", { frequencia: "semanal", intervalo: 1 }, "2026-10-26"), "2026-10-27")
  assert.equal(prazoDaProxima("2026-11-05", { frequencia: "semanal", intervalo: 1 }, "2026-10-26"), "2026-11-12")
})

caso("descrição em português", () => {
  assert.equal(descreverRecorrencia({ frequencia: "diaria", intervalo: 1 }), "Todo dia")
  assert.equal(descreverRecorrencia({ frequencia: "mensal", intervalo: 1 }), "Todo mês")
  assert.equal(descreverRecorrencia({ frequencia: "semanal", intervalo: 2 }), "A cada 2 semanas")
})

console.log(`${total - falhas}/${total} casos passaram`)
if (falhas > 0) process.exitCode = 1
