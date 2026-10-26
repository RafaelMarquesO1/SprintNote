// Rafael Marques - 26/10/2026
// Testes do fundo dos quadros (Node): npm run teste:kanban

import assert from "node:assert/strict"

import { ajusteFotoPadrao, brilhoFinalDoTopo, calcularAutomatico, codificarAjusteFoto, estilosDaFoto, lerAjusteFoto, resolverFundoQuadro } from "./fundo.ts"

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

caso("ida e volta do ajuste", () => {
  const ajuste = { desfoque: 6, zoom: 140, x: 30, y: 80 }
  assert.deepEqual(lerAjusteFoto(codificarAjusteFoto(ajuste)), ajuste)
})

caso("valores fora do limite são corrigidos", () => {
  assert.deepEqual(lerAjusteFoto(codificarAjusteFoto({ desfoque: -3, zoom: 10, x: -5, y: 101 })), { desfoque: 0, zoom: 100, x: 0, y: 100 })
})

caso("formatos antigos e lixo", () => {
  assert.equal(lerAjusteFoto('foto:{"v":45,"d":0,"p":"topo"}')?.y, 0)
  assert.equal(lerAjusteFoto('foto:{"v":45,"d":0,"p":"base"}')?.y, 100)
  assert.deepEqual(lerAjusteFoto('foto:{"v":72,"d":6,"b":-20,"z":140,"x":30,"y":80}'), { desfoque: 6, zoom: 140, x: 30, y: 80 })
  assert.deepEqual(lerAjusteFoto("foto:não é json"), null)
  assert.deepEqual(lerAjusteFoto("foto:{}"), ajusteFotoPadrao)
})

caso("foto sem imagem não desenha; modelos antigos viram neutros", () => {
  assert.equal(resolverFundoQuadro(codificarAjusteFoto(ajusteFotoPadrao), null), null)
  assert.equal(resolverFundoQuadro(codificarAjusteFoto(ajusteFotoPadrao), "data:image/jpeg;base64,AA")?.tipo, "foto")
  assert.equal(resolverFundoQuadro("diagonal")?.tipo, "modelo")
  assert.equal(resolverFundoQuadro("aurora"), null)
})

caso("automático: escuro escurece foto clara, claro clareia foto escura, foto agitada aparece menos", () => {
  const clara = { media: 0.8, variacao: 0.1, mediaTopo: 0.8 }
  const escura = { media: 0.15, variacao: 0.1, mediaTopo: 0.15 }
  assert.ok(calcularAutomatico(clara, true).brilho < -0.4)
  assert.ok(calcularAutomatico(escura, false).brilho > 0.4)
  assert.equal(calcularAutomatico({ media: 0.8, variacao: 0.1, mediaTopo: 0.8 }, false).brilho, 0)
  assert.ok(calcularAutomatico({ ...clara, variacao: 0.35 }, false).visibilidade < calcularAutomatico(clara, false).visibilidade)
  for (const medida of [clara, escura, { media: 0.5, variacao: 0.5, mediaTopo: 0.5 }]) {
    for (const escuro of [true, false]) {
      const auto = calcularAutomatico(medida, escuro)
      assert.ok(auto.visibilidade >= 0.3 && auto.visibilidade <= 0.75)
      // O topo final fica do lado do tema: claro no tema claro, escuro no tema escuro.
      const final = brilhoFinalDoTopo(medida, auto, escuro)
      assert.ok(escuro ? final < 0.5 : final > 0.5, `${JSON.stringify(medida)} escuro=${escuro} → ${final}`)
    }
  }
})

caso("estilos: véu só com brilho; desfoque aumenta a escala", () => {
  const sem = estilosDaFoto("x.jpg", ajusteFotoPadrao, { visibilidade: 0.5, brilho: 0 })
  assert.equal(sem.veu, null)
  assert.equal(sem.foto.transform, undefined)
  const com = estilosDaFoto("x.jpg", { ...ajusteFotoPadrao, desfoque: 8 }, { visibilidade: 0.5, brilho: -0.3 })
  assert.equal(com.veu?.background, "black")
  assert.ok(String(com.foto.transform).startsWith("scale("))
})

console.log(`${total - falhas}/${total} casos passaram`)
if (falhas > 0) process.exitCode = 1
