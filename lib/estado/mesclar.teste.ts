// Rafael Marques - 30/10/2026
// Testes da junção de dados entre aparelhos (Node): npm run teste:sincronizacao

import assert from "node:assert/strict"

import { iguais, mesclarEstado, mesclarSemBase } from "./mesclar.ts"

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

const nota = (id: string, conteudo: string, atualizadoEm = 1) => ({ id, titulo: id, conteudo, atualizadoEm })
const area = (notas: unknown[]) => ({ state: { livros: [], notas }, version: 3 })

caso("só um lado mudou: fica a mudança", () => {
  const base = area([nota("a", "x")])
  const remoto = area([nota("a", "y", 2)])
  assert.deepEqual(mesclarEstado(base, base, remoto), remoto)
  assert.deepEqual(mesclarEstado(base, remoto, base), remoto)
})

caso("nota criada em cada aparelho: ficam as duas", () => {
  const base = area([nota("a", "x")])
  const local = area([nota("a", "x"), nota("b", "do celular")])
  const remoto = area([nota("a", "x"), nota("c", "do computador")])
  const ids = (mesclarEstado(base, local, remoto) as ReturnType<typeof area>).state.notas.map((n) => (n as { id: string }).id)
  assert.deepEqual(ids, ["a", "c", "b"])
})

caso("notas diferentes editadas em cada aparelho: as duas edições ficam", () => {
  const base = area([nota("a", "1"), nota("b", "1")])
  const local = area([nota("a", "local", 5), nota("b", "1")])
  const remoto = area([nota("a", "1"), nota("b", "remoto", 6)])
  assert.deepEqual(mesclarEstado(base, local, remoto), area([nota("a", "local", 5), nota("b", "remoto", 6)]))
})

caso("mesma nota editada nos dois: vence a mais nova", () => {
  const base = area([nota("a", "1", 1)])
  const local = area([nota("a", "local", 5)])
  const remoto = area([nota("a", "remoto", 9)])
  assert.deepEqual(mesclarEstado(base, local, remoto), remoto)
  assert.deepEqual(mesclarEstado(base, remoto, local), remoto)
})

caso("excluída em um lado e intocada no outro: some", () => {
  const base = area([nota("a", "1"), nota("b", "1")])
  const local = area([nota("a", "1")])
  assert.deepEqual(mesclarEstado(base, local, base), local)
  assert.deepEqual(mesclarEstado(base, base, local), local)
})

caso("excluída em um lado mas editada no outro: fica", () => {
  const base = area([nota("a", "1")])
  const local = area([])
  const remoto = area([nota("a", "editada", 3)])
  assert.deepEqual(mesclarEstado(base, local, remoto), remoto)
})

caso("tags como conjunto", () => {
  const base = { tags: ["a", "b"] }
  assert.deepEqual(mesclarEstado(base, { tags: ["a", "b", "c"] }, { tags: ["b", "d"] }), { tags: ["b", "c", "d"] })
})

caso("campos diferentes do mesmo objeto", () => {
  const base = { tema: "claro", fonte: 14 }
  assert.deepEqual(mesclarEstado(base, { tema: "escuro", fonte: 14 }, { tema: "claro", fonte: 16 }), { tema: "escuro", fonte: 16 })
})

caso("sem base: junta tudo e não exclui nada", () => {
  const local = area([nota("a", "1"), nota("b", "1")])
  const remoto = area([nota("a", "1"), nota("c", "1")])
  const ids = (mesclarSemBase(local, remoto) as ReturnType<typeof area>).state.notas.map((n) => (n as { id: string }).id)
  assert.deepEqual(ids, ["a", "c", "b"])
})

caso("iguais ignora a ordem das chaves", () => {
  assert.ok(iguais({ a: 1, b: { c: [1, 2] } }, { b: { c: [1, 2] }, a: 1 }))
  assert.ok(!iguais({ a: [1, 2] }, { a: [2, 1] }))
})

console.log(`${total - falhas}/${total} casos passaram`)
if (falhas > 0) process.exit(1)
