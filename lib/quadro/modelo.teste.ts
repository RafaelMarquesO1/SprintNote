// Rafael Marques - 23/10/2026
// Testes do modelo do quadro (Node): npm run teste:quadro

import assert from "node:assert/strict"

import { duplicarNos, escreverQuadro, lerQuadro, novaForma, novoCartaoNota, novoGrupo, quadroVazio, removerNos, textoDoQuadro } from "./modelo.ts"

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

caso("vazio e lixo viram quadro vazio", () => {
  for (const entrada of ["", "   ", "não é json", "123", "null", "[]", '{"nos":5}']) assert.deepEqual(lerQuadro(entrada), quadroVazio(), entrada)
})

caso("ida e volta mantém tudo", () => {
  let q = quadroVazio()
  const a = novaForma("retangulo", { x: 0, y: 0 }, "Início")
  const b = { ...novaForma("losango", { x: 300, y: 0 }, "Decide?"), cor: "azul" }
  const c = novoCartaoNota("nota1", { x: 0, y: 200 })
  const g = novoGrupo({ x: 0, y: 0 })
  q = { ...q, nos: [g, a, b, c], setas: [{ id: "s1", de: a.id, para: b.id, deLado: "direita", paraLado: "esquerda", rotulo: "sim", tracejada: true, ponta: "ambos", cor: "verde" }] }
  assert.deepEqual(lerQuadro(escreverQuadro(q)), q)
})

caso("dados inválidos são corrigidos sem quebrar", () => {
  const q = lerQuadro(JSON.stringify({ nos: [{ id: "a", forma: "estranha", largura: -5, x: "zz" }, { semId: 1 }, { id: "b", tipo: "grupo" }], setas: [{ id: "s", de: "a", para: "b", ponta: "x" }, { id: "t", de: "a", para: "fantasma" }] }))
  assert.equal(q.nos.length, 2)
  assert.equal(q.nos[0].forma, "retangulo")
  assert.ok(q.nos[0].largura >= 40)
  assert.equal(q.nos[0].x, 0)
  assert.equal(q.nos[1].tipo, "grupo")
  assert.equal(q.setas.length, 1)
  assert.equal(q.setas[0].ponta, "fim")
})

caso("remover caixa leva as setas junto", () => {
  const a = novaForma("circulo", { x: 0, y: 0 })
  const b = novaForma("circulo", { x: 200, y: 0 })
  const c = novaForma("circulo", { x: 400, y: 0 })
  const q = { ...quadroVazio(), nos: [a, b, c], setas: [{ id: "1", de: a.id, para: b.id, rotulo: "", tracejada: false, ponta: "fim" as const }, { id: "2", de: b.id, para: c.id, rotulo: "", tracejada: false, ponta: "fim" as const }] }
  const r = removerNos(q, [b.id])
  assert.equal(r.nos.length, 2)
  assert.equal(r.setas.length, 0)
})

caso("duplicar copia as setas internas e desloca", () => {
  const a = novaForma("retangulo", { x: 0, y: 0 }, "A")
  const b = novaForma("retangulo", { x: 200, y: 0 }, "B")
  const c = novaForma("retangulo", { x: 400, y: 0 }, "C")
  const q = { ...quadroVazio(), nos: [a, b, c], setas: [{ id: "1", de: a.id, para: b.id, rotulo: "", tracejada: false, ponta: "fim" as const }, { id: "2", de: b.id, para: c.id, rotulo: "", tracejada: false, ponta: "fim" as const }] }
  const { quadro, novosIds } = duplicarNos(q, [a.id, b.id])
  assert.equal(novosIds.length, 2)
  assert.equal(quadro.nos.length, 5)
  assert.equal(quadro.setas.length, 3)
  const copia = quadro.nos.find((no) => no.id === novosIds[0])!
  assert.equal(copia.x, a.x + 32)
})

caso("texto do quadro para busca", () => {
  const q = { ...quadroVazio(), nos: [novaForma("retangulo", { x: 0, y: 0 }, "Alfa"), novaForma("retangulo", { x: 0, y: 0 }, ""), novaForma("retangulo", { x: 0, y: 0 }, "Beta")] }
  assert.equal(textoDoQuadro(escreverQuadro(q)), "Alfa · Beta")
})

console.log(`${total - falhas}/${total} casos passaram`)
if (falhas > 0) process.exitCode = 1
