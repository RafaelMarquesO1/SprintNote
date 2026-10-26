// Rafael Marques - 26/10/2026
// Testes dos modelos de quadro e da importação/exportação (Node): npm run teste:kanban

import assert from "node:assert/strict"

import { modelosKanban, montarQuadroDoModelo } from "./modelos.ts"
import { exportarQuadro, lerQuadroImportado, quadroParaCsv } from "./transferir.ts"

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

let contador = 0
const novoId = () => `id${++contador}`
// Versão enxuta do completarCartao do app, só para o teste.
const completar = (parcial: Record<string, unknown>) =>
  ({
    descricao: "", notaId: null, criadoEm: 0, etiquetas: [], prazo: null, cor: null, checklist: [], prioridade: null, arquivado: false,
    comentarios: [], atividade: [], responsavelId: null, anexos: [], recorrencia: null, bloqueadoPor: [], estimativa: null, ...parcial,
  }) as never

caso("todos os modelos montam um quadro coerente", () => {
  for (const modelo of modelosKanban) {
    const { quadro, colunas, cartoes } = montarQuadroDoModelo(modelo, novoId, completar, true)
    assert.ok(colunas.length >= 3, modelo.id)
    assert.ok(colunas.some((coluna) => coluna.concluida), `${modelo.id} sem coluna de concluídos`)
    assert.equal(new Set([quadro.id, ...colunas.map((c) => c.id), ...quadro.etiquetas.map((e) => e.id), ...cartoes.map((c) => c.id)]).size, 1 + colunas.length + quadro.etiquetas.length + cartoes.length, `${modelo.id}: ids repetidos`)
    for (const cartao of cartoes) {
      assert.ok(colunas.some((coluna) => coluna.id === cartao.colunaId), modelo.id)
      for (const etiqueta of cartao.etiquetas) assert.ok(quadro.etiquetas.some((item) => item.id === etiqueta), modelo.id)
    }
    assert.equal(montarQuadroDoModelo(modelo, novoId, completar, false).cartoes.length, 0)
  }
})

caso("exportar e importar devolve o mesmo quadro com ids novos", () => {
  const { quadro, colunas, cartoes } = montarQuadroDoModelo(modelosKanban[0], novoId, completar, true)
  const arquivo = JSON.stringify(exportarQuadro(quadro, colunas, cartoes))
  const lido = lerQuadroImportado(arquivo, novoId, completar)
  assert.ok(!("erro" in lido), "erro" in lido ? lido.erro : "")
  if ("erro" in lido) return
  assert.equal(lido.quadro.titulo, quadro.titulo)
  assert.deepEqual(lido.colunas.map((c) => [c.titulo, c.limite, c.concluida]), colunas.map((c) => [c.titulo, c.limite, c.concluida]))
  assert.equal(lido.cartoes.length, cartoes.length)
  assert.notEqual(lido.quadro.id, quadro.id)
  assert.ok(lido.cartoes.every((cartao) => lido.colunas.some((coluna) => coluna.id === cartao.colunaId)))
  assert.deepEqual(lido.cartoes.map((c) => c.checklist.length), cartoes.map((c) => c.checklist.length))
})

caso("a exportação não leva comentários, histórico nem responsável", () => {
  const { quadro, colunas } = montarQuadroDoModelo(modelosKanban[0], novoId, completar, false)
  const cartao = completar({ id: "x", titulo: "T", colunaId: colunas[0].id, comentarios: [{ texto: "oi" }], atividade: [{ texto: "a" }], responsavelId: "uuid-da-pessoa" })
  const texto = JSON.stringify(exportarQuadro(quadro, colunas, [cartao]))
  assert.ok(!texto.includes("uuid-da-pessoa") && !texto.includes('"comentarios"') && !texto.includes('"atividade"'))
})

caso("arquivos inválidos ou perigosos são recusados ou limpos", () => {
  assert.ok("erro" in lerQuadroImportado("não é json", novoId, completar))
  assert.ok("erro" in lerQuadroImportado("{}", novoId, completar))
  assert.ok("erro" in lerQuadroImportado(JSON.stringify({ formato: "sprintnote-quadro", versao: 1, quadro: { titulo: "x" }, colunas: [] }), novoId, completar))
  const arquivo = {
    formato: "sprintnote-quadro", versao: 1, exportadoEm: "", quadro: { titulo: "<b>x</b>", icone: "lista", fundo: null, etiquetas: [] },
    colunas: [{ id: "c1", titulo: "A", cor: null, limite: -5, concluida: false, recolhida: false }],
    cartoes: [
      { id: "k1", titulo: "ok", colunaId: "c1", prazo: "amanhã", prioridade: "urgentíssima", anexos: [{ tipo: "link", nome: "x", url: "javascript:alert(1)" }, { tipo: "link", nome: "y", url: "https://exemplo.com" }, { tipo: "imagem", nome: "z", url: "http://x/y.png" }] },
      { id: "k2", titulo: "sem coluna", colunaId: "fantasma" },
    ],
  }
  const lido = lerQuadroImportado(JSON.stringify(arquivo), novoId, completar)
  assert.ok(!("erro" in lido))
  if ("erro" in lido) return
  assert.equal(lido.cartoes.length, 1)
  assert.equal(lido.cartoes[0].prazo, null)
  assert.equal(lido.cartoes[0].prioridade, null)
  assert.deepEqual(lido.cartoes[0].anexos.map((a) => a.url), ["https://exemplo.com"])
  assert.equal(lido.colunas[0].limite, null)
})

caso("CSV escapa aspas e neutraliza fórmulas", () => {
  const { quadro, colunas } = montarQuadroDoModelo(modelosKanban[0], novoId, completar, false)
  const cartoes = [completar({ id: "a", titulo: '=SOMA(A1) "oi"', colunaId: colunas[0].id, descricao: "linha1\nlinha2" })]
  const csv = quadroParaCsv(colunas, cartoes, quadro.etiquetas)
  assert.ok(csv.startsWith("﻿"))
  assert.ok(csv.includes(`"'=SOMA(A1) ""oi"""`))
  assert.equal(csv.split("\r\n").length, 2)
})

console.log(`${total - falhas}/${total} casos passaram`)
if (falhas > 0) process.exitCode = 1
