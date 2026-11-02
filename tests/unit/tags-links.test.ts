import { describe, expect, it } from "vitest"

import { extrairLinksWiki, resolverLink } from "@/lib/links-wiki"
import { contarTags, extrairTags, limparTagDigitada, removerTagDoConteudo, tagsPais } from "@/lib/tags"
import type { Livro, Nota } from "@/lib/tipos"

const nota = (id: string, titulo: string, conteudo = "", livroId: string | null = null) =>
  ({ id, titulo, conteudo, livroId, tags: [] }) as unknown as Nota
const livro = (id: string, titulo: string) => ({ id, titulo }) as unknown as Livro

describe("tags", () => {
  it("extrai tags e ignora títulos, código e links", () => {
    const texto = "# Título\nVer #biologia e #projeto/fase-1\n`#codigo` [[#nao]] site.com/#ancora"
    expect(extrairTags(texto).sort()).toEqual(["biologia", "projeto/fase-1"])
  })
  it("tags pais", () => {
    expect(tagsPais("projeto/fase-1/revisao")).toEqual(["projeto", "projeto/fase-1"])
  })
  it("limpa a tag digitada", () => {
    expect(limparTagDigitada("  #Minha Tag! ")).toBe("minha-tag")
  })
  it("conta tags junto com as tags pais", () => {
    const contagem = contarTags([nota("a", "A", "#projeto/fase-1"), nota("b", "B", "#projeto")])
    expect(contagem.find((item) => item.tag === "projeto")?.total).toBe(2)
  })
  it("remove tag sem mexer em código", () => {
    expect(removerTagDoConteudo("Texto #a e `#a`", "a")).toBe("Texto e `#a`")
  })
})

describe("[[links]]", () => {
  it("extrai alvos fora de código", () => {
    expect(extrairLinksWiki("[[Nota A]] e [[Livro/Nota B|texto]] `[[não]]`")).toEqual(["Nota A", "Livro/Nota B"])
  })
  it("resolve nota, nota de caderno e caderno", () => {
    const biblioteca = {
      notas: [nota("1", "AWS", "", "l1"), nota("2", "AWS", "", "l2")],
      livros: [livro("l1", "Estudos"), livro("l2", "Trabalho")],
    }
    expect(resolverLink("Trabalho/AWS", biblioteca)).toMatchObject({ tipo: "nota", nota: { id: "2" } })
    expect(resolverLink("aws", biblioteca, "l2")).toMatchObject({ tipo: "nota", nota: { id: "2" } })
    expect(resolverLink("Estudos", biblioteca)).toMatchObject({ tipo: "livro", livro: { id: "l1" } })
    expect(resolverLink("nada", biblioteca)).toBeNull()
  })
})
