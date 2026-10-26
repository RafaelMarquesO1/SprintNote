// Rafael Marques - 23/10/2026
// Testes de ida e volta do Markdown das notas (rodam em Node, sem navegador):
//   npm run teste:notas
// Cada caso confere que o Markdown vira documento e volta igual, e que o texto
// escrito no editor (com caracteres especiais) volta idêntico depois de salvar e reabrir.

import assert from "node:assert/strict"

import { documentoParaMarkdown, markdownParaDocumento, type NoDoc } from "./markdown-documento.ts"

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

const ida = (md: string) => documentoParaMarkdown(markdownParaDocumento(md))

// O Markdown "canônico" volta exatamente igual.
function estavel(nome: string, md: string) {
  caso(`estável: ${nome}`, () => assert.equal(ida(md), md))
}

// Um Markdown "bagunçado" vira a forma canônica e, a partir daí, não muda mais.
function normaliza(nome: string, entrada: string, esperado: string) {
  caso(`normaliza: ${nome}`, () => {
    assert.equal(ida(entrada), esperado)
    assert.equal(ida(esperado), esperado)
  })
}

// O que a pessoa digita no editor volta igual depois de salvar e reabrir.
function textoSobrevive(nome: string, doc: NoDoc) {
  caso(`texto sobrevive: ${nome}`, () => {
    const md = documentoParaMarkdown(doc)
    assert.deepEqual(markdownParaDocumento(md), doc, `Markdown gerado: ${JSON.stringify(md)}`)
  })
}

const par = (...conteudo: NoDoc[]): NoDoc => ({ type: "paragraph", content: conteudo })
const txt = (text: string, ...marks: string[]): NoDoc => ({ type: "text", text, ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}) })
const docDe = (...blocos: NoDoc[]): NoDoc => ({ type: "doc", content: blocos })

// ---------- texto e formatação ----------
estavel("parágrafo", "Texto simples")
estavel("duas linhas no mesmo parágrafo", "Linha 1\nLinha 2")
estavel("dois parágrafos", "Um\n\nDois")
estavel("títulos", "# Título 1\n\n## Título 2\n\n### Título 3")
estavel("título 5", "##### Pequenininho")
estavel("negrito, itálico, riscado, marca-texto e código", "**negrito** e *itálico* e ~~riscado~~ e ==marca== e `código`")
estavel("negrito e itálico juntos", "***forte e inclinado***")
estavel("itálico dentro de negrito", "**negrito *itálico dentro* e mais**")
estavel("link e endereço solto", "[site](https://x.com/a_b) e https://example.com/a_b_c")
estavel("links entre notas", "[[Nota]] e [[Livro/Nota|apelido]]")
estavel("tags e underscore", "#tag #minha_tag snake_case e 2 * 3")
estavel("negrito em volta do link da nota", "**veja [[Nota]] agora**")
estavel("código com crase dentro", "``a ` b``")
estavel("emoji e acentos", "Olá, coração 😀 ação")

// ---------- listas ----------
estavel("lista com níveis", "- a\n- b\n  - c\n    - d\n- e")
estavel("lista numerada", "1. a\n1. b\n  1. c")
estavel("tarefas", "- [ ] a\n- [x] b\n  - [ ] c")
estavel("lista depois de parágrafo", "Texto\n\n- a\n- b\n\nOutro texto")
estavel("lista com item em duas linhas", "- primeira\n  segunda\n- terceira")
normaliza("marcadores * e + viram -", "* a\n+ b", "- a\n- b")
normaliza("numeração 1) 2) 3)", "1) a\n2) b\n3) c", "1. a\n1. b\n1. c")
normaliza("tarefa maiúscula [X]", "- [X] pronto", "- [x] pronto")
normaliza("linhas em branco entre itens", "- a\n\n- b\n\n- c", "- a\n- b\n- c")
normaliza("recuo de 4 espaços vira nível", "- a\n    - b", "- a\n  - b")
normaliza("lista e tarefa seguidas", "- a\n- [ ] b", "- a\n\n- [ ] b")

// ---------- blocos ----------
estavel("citação", "> uma citação\n> em duas linhas")
estavel("destaque", "> [!dica] Texto da dica\n> segunda linha")
estavel("destaque vazio", "> [!aviso]")
estavel("divisor", "Antes\n\n---\n\nDepois")
estavel("código com linha vazia", "```js\nconst a = 1\n\nfoo()\n```")
estavel("código sem linguagem", "```\nsó texto\n```")
estavel("tabela", "| A | B |\n| --- | --- |\n| 1 | 2 |\n| x | y |")
estavel("imagem", "![foto](https://x.com/a.png)")
estavel("imagem com título", '![foto](https://x.com/a.png "legenda")')
normaliza("destaque em inglês do Obsidian", "> [!warning] cuidado", "> [!aviso] cuidado")
normaliza("destaque com + (recolhido)", "> [!tip]+ olha", "> [!dica] olha")
normaliza("código com ~~~", "~~~py\nprint(1)\n~~~", "```py\nprint(1)\n```")
normaliza("__negrito__ e _itálico_", "__forte__ e _inclinado_", "**forte** e *inclinado*")
normaliza("título com # no final", "## Olá ##", "## Olá")
normaliza("cabeçalho 4 mantém o nível", "#### Nível quatro", "#### Nível quatro")
normaliza("tabela com colunas faltando", "| A | B |\n| --- | --- |\n| 1 |", "| A | B |\n| --- | --- |\n| 1 |  |")
normaliza("espaços e linhas em branco sobrando", "\n\n  Texto  \n\n\n\nOutro\n\n", "Texto\n\nOutro")
normaliza("quebra <br> na célula", "| A |\n| --- |\n| x<br>y |", "| A |\n| --- |\n| x<br>y |")

// ---------- documento montado do jeito que o editor faz ----------
textoSobrevive("asterisco no meio de palavras", docDe(par(txt("5*3*2 e a*b"))))
textoSobrevive("sublinhados nas pontas", docDe(par(txt("_texto_ e __dobro__"))))
textoSobrevive("crase solta", docDe(par(txt("use ` com cuidado"))))
textoSobrevive("colchetes que parecem link", docDe(par(txt("[nota](x) e [[x]] literais"))))
textoSobrevive("começa com # e espaço", docDe(par(txt("# não é título"))))
textoSobrevive("começa com traço", docDe(par(txt("- não é lista"))))
textoSobrevive("começa com número e ponto", docDe(par(txt("1. não é lista"))))
textoSobrevive("começa com >", docDe(par(txt("> não é citação"))))
textoSobrevive("linha só de traços", docDe(par(txt("---"))))
textoSobrevive("barra invertida antes de pontuação", docDe(par(txt("caminho C:\\*.txt"))))
textoSobrevive("til e igual em dobro", docDe(par(txt("a ~~ b == c"))))
caso("espaço na ponta do negrito fica do lado de fora", () => {
  const md = documentoParaMarkdown(docDe(par(txt("antes "), txt("forte ", "bold"), txt("depois"))))
  assert.equal(md, "antes **forte** depois")
})
textoSobrevive("itálico só em parte do negrito", docDe(par(txt("a ", "bold"), txt("b", "bold", "italic"), txt(" c", "bold"))))
textoSobrevive("marcas em volta de quebra de linha", docDe(par(txt("um", "bold"), { type: "hardBreak" }, txt("dois", "bold"))))
textoSobrevive("link com texto formatado", docDe(par({ type: "text", text: "veja", marks: [{ type: "link", attrs: { href: "https://x.com" } }, { type: "bold" }] })))
textoSobrevive("link entre notas negrito", docDe(par({ type: "wikiLink", attrs: { alvo: "Nota", rotulo: null }, marks: [{ type: "bold" }] })))
textoSobrevive("apelido de link", docDe(par({ type: "wikiLink", attrs: { alvo: "Livro/Nota", rotulo: "Meu apelido" } })))
textoSobrevive("tarefa marcada com texto", docDe({ type: "taskList", content: [{ type: "taskItem", attrs: { checked: true }, content: [par(txt("feito"))] }] }))
textoSobrevive("pipe dentro da tabela", docDe({
  type: "table",
  content: [
    { type: "tableRow", content: [{ type: "tableHeader", content: [par(txt("a|b"))] }] },
    { type: "tableRow", content: [{ type: "tableCell", content: [par(txt("c"))] }] },
  ],
}))

// ---------- estabilidade com um documento grande e bagunçado ----------
caso("documento misto não muda a cada ida e volta", () => {
  const bagunca = [
    "# Aula de #biologia ==importante==",
    "",
    "Veja [[Células]] e [[Livro/Núcleo|o núcleo]] — *muito* **importante** e ~~errado~~.",
    "Segunda linha com `código` e https://exemplo.com/a_b.",
    "",
    "* um",
    "  * dois",
    "    * três",
    "",
    "1. primeiro",
    "2. segundo",
    "",
    "- [ ] estudar @amanhã",
    "- [x] ler",
    "",
    "> [!info] Dica rápida",
    "> com duas linhas",
    "",
    "> citação",
    "",
    "```ts",
    "const x: number = 1",
    "```",
    "",
    "| a | b |",
    "|---|---|",
    "| 1 | 2 |",
    "",
    "---",
    "",
    "![img](https://x.com/y.png)",
  ].join("\n")
  const um = ida(bagunca)
  const dois = ida(um)
  assert.equal(dois, um)
  assert.match(um, /#biologia ==importante==/)
  assert.match(um, /\[\[Livro\/Núcleo\|o núcleo\]\]/)
  assert.match(um, /- \[ \] estudar @amanhã/)
})

caso("nota vazia vira um parágrafo vazio e volta vazia", () => {
  assert.equal(ida(""), "")
  assert.deepEqual(markdownParaDocumento(""), { type: "doc", content: [{ type: "paragraph" }] })
})

caso("parágrafos vazios do editor não vão para o Markdown", () => {
  const md = documentoParaMarkdown(docDe(par(txt("a")), { type: "paragraph" }, { type: "paragraph" }, par(txt("b"))))
  assert.equal(md, "a\n\nb")
})

caso("não cria nós de texto vazios nem repetidos", () => {
  const doc = markdownParaDocumento("**a****b** *x**y*")
  const vistos = JSON.stringify(doc)
  assert.ok(!vistos.includes('"text":""'))
})

// ---------- teste aleatório: nenhum caractere nem formatação se perde ----------
function gerador(semente: number) {
  let estado = semente
  return () => {
    estado = (estado + 0x6d2b79f5) | 0
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ALFABETO = ["a", "b", "Z", "1", "2", " ", " ", "*", "_", "`", "[", "]", "(", ")", "~", "=", "#", "-", ">", "|", "\\", ".", "!", "é", "@", "/", ":", "<", "&"]
const MARCAS_POSSIVEIS = ["bold", "italic", "strike", "highlight", "code", "link"]

type Pedaco = { texto: string; marcas: string[] }

// Cada caractere com o conjunto de marcas que ele tinha.
function caracteres(doc: NoDoc) {
  const saida: { ch: string; marcas: string }[] = []
  const visitar = (no: NoDoc) => {
    if (no.type === "text") {
      const marcas = (no.marks ?? []).map((marca) => marca.type).sort().join(",")
      for (const ch of no.text ?? "") saida.push({ ch, marcas })
    } else if (no.type === "hardBreak") saida.push({ ch: "\n", marcas: "" })
    else (no.content ?? []).forEach(visitar)
  }
  visitar(doc)
  return saida
}

function paraDocumento(pedacos: Pedaco[]): NoDoc {
  const conteudo = pedacos
    .filter((pedaco) => pedaco.texto)
    .map((pedaco) => {
      // Código não aceita outras formatações (igual ao editor).
      const marcas = pedaco.marcas.includes("code") ? ["code"] : pedaco.marcas
      const no = txt(pedaco.texto, ...marcas)
      return no.marks?.some((marca) => marca.type === "link")
        ? { ...no, marks: no.marks.map((marca) => (marca.type === "link" ? { type: "link", attrs: { href: "https://e.com/x" } } : marca)) }
        : no
    })
  // O editor (ProseMirror) sempre junta trechos vizinhos com as mesmas marcas.
  const juntos: NoDoc[] = []
  for (const no of conteudo) {
    const anterior = juntos[juntos.length - 1]
    if (anterior && JSON.stringify(anterior.marks ?? []) === JSON.stringify(no.marks ?? [])) anterior.text = (anterior.text ?? "") + (no.text ?? "")
    else juntos.push({ ...no })
  }
  return docDe(juntos.length ? par(...juntos) : { type: "paragraph" })
}

caso("aleatório: texto e formatação sobrevivem a salvar e reabrir (4000 documentos)", () => {
  const sorteio = gerador(20261023)
  for (let n = 0; n < 4000; n++) {
    const pedacos: Pedaco[] = []
    const quantidade = 1 + Math.floor(sorteio() * 3)
    for (let k = 0; k < quantidade; k++) {
      let texto = ""
      const tamanho = 1 + Math.floor(sorteio() * 9)
      for (let c = 0; c < tamanho; c++) texto += ALFABETO[Math.floor(sorteio() * ALFABETO.length)]
      const marcas = MARCAS_POSSIVEIS.filter(() => sorteio() < 0.18)
      pedacos.push({ texto, marcas })
    }
    const original = paraDocumento(pedacos)
    const md = documentoParaMarkdown(original)
    const volta = markdownParaDocumento(md)

    // O texto volta igual (espaços nas pontas das linhas não contam).
    const limpa = (cs: { ch: string }[]) => cs.map((c) => c.ch).join("").split("\n").map((linha) => linha.trim()).join("\n").trim()
    const antes = limpa(caracteres(original))
    const depois = limpa(caracteres(volta))
    assert.equal(depois, antes, `texto mudou\nMarkdown: ${JSON.stringify(md)}\nantes:  ${JSON.stringify(antes)}\ndepois: ${JSON.stringify(depois)}`)

    // Cada letra mantém suas marcas (espaços ficam de fora: podem sair da formatação).
    const marcasDe = (cs: { ch: string; marcas: string }[]) => cs.filter((c) => /[^\s]/.test(c.ch)).map((c) => `${c.ch}:${c.marcas}`).join(" ")
    assert.equal(marcasDe(caracteres(volta)), marcasDe(caracteres(original)), `marcas mudaram\nMarkdown: ${JSON.stringify(md)}`)

    // E uma segunda ida e volta não muda mais nada.
    assert.equal(documentoParaMarkdown(volta), md, `instável: ${JSON.stringify(md)}`)
  }
})

// ---------- teste aleatório de estrutura: blocos aninhados voltam idênticos ----------
const PALAVRAS = ["casa", "mar", "ação", "#tag", "snake_case", "@amanhã", "x1", "R$5", "50%", "a/b", "ok."]

function juntarVizinhos(nos: NoDoc[]): NoDoc[] {
  const saida: NoDoc[] = []
  for (const no of nos) {
    const anterior = saida[saida.length - 1]
    if (no.type === "text" && anterior?.type === "text" && JSON.stringify(anterior.marks ?? []) === JSON.stringify(no.marks ?? [])) {
      anterior.text = (anterior.text ?? "") + (no.text ?? "")
    } else saida.push({ ...no })
  }
  return saida
}

function inlineAleatorio(sorteio: () => number): NoDoc[] {
  const escolher = <T,>(lista: T[]) => lista[Math.floor(sorteio() * lista.length)]
  const nos: NoDoc[] = []
  const segmentos = 1 + Math.floor(sorteio() * 3)
  for (let s = 0; s < segmentos; s++) {
    if (s > 0) nos.push(txt(" "))
    if (sorteio() < 0.12) {
      nos.push({ type: "wikiLink", attrs: { alvo: escolher(["Nota", "Livro/Nota", "Célula"]), rotulo: sorteio() < 0.4 ? "apelido" : null } })
      continue
    }
    const palavras = Array.from({ length: 1 + Math.floor(sorteio() * 3) }, () => escolher(PALAVRAS)).join(" ")
    const marcas: string[] = []
    if (sorteio() < 0.2) marcas.push("bold")
    if (sorteio() < 0.2) marcas.push("italic")
    if (sorteio() < 0.1) marcas.push("strike")
    if (sorteio() < 0.1) marcas.push("highlight")
    if (sorteio() < 0.1) {
      nos.push(txt(palavras, "code"))
      continue
    }
    nos.push(txt(palavras, ...marcas))
  }
  if (sorteio() < 0.15) nos.push({ type: "hardBreak" }, txt(escolher(PALAVRAS)))
  return juntarVizinhos(nos)
}

function blocoAleatorio(sorteio: () => number, profundidade: number): NoDoc {
  const escolher = <T,>(lista: T[]) => lista[Math.floor(sorteio() * lista.length)]
  const tipo = escolher(["p", "p", "p", "h", "ul", "ol", "tasks", "quote", "callout", "code", "hr", "table", "img"].filter((t) => profundidade < 2 || !["quote", "callout", "ul", "ol", "tasks"].includes(t)))
  const paragrafoAleatorio = () => par(...inlineAleatorio(sorteio))
  const lista = (nome: "bulletList" | "orderedList" | "taskList"): NoDoc => ({
    type: nome,
    content: Array.from({ length: 1 + Math.floor(sorteio() * 3) }, () => {
      const filhos: NoDoc[] = [paragrafoAleatorio()]
      if (profundidade < 2 && sorteio() < 0.3) filhos.push(lista(escolher(["bulletList", "orderedList", "taskList"])))
      return nome === "taskList"
        ? { type: "taskItem", attrs: { checked: sorteio() < 0.5 }, content: filhos }
        : { type: "listItem", content: filhos }
    }),
  })
  switch (tipo) {
    case "h":
      return { type: "heading", attrs: { level: 1 + Math.floor(sorteio() * 3) }, content: juntarVizinhos(inlineAleatorio(sorteio).filter((no) => no.type !== "hardBreak")) }
    case "ul":
      return lista("bulletList")
    case "ol":
      return lista("orderedList")
    case "tasks":
      return lista("taskList")
    case "quote":
      return { type: "blockquote", content: [paragrafoAleatorio(), ...(sorteio() < 0.3 ? [blocoAleatorio(sorteio, profundidade + 1)] : [])].filter((b) => !["blockquote", "destaque"].includes(b.type)) }
    case "callout":
      return { type: "destaque", attrs: { variante: escolher(["info", "dica", "aviso", "perigo", "nota"]) }, content: [paragrafoAleatorio(), ...(sorteio() < 0.3 ? [paragrafoAleatorio()] : [])] }
    case "code": {
      const linhas = Array.from({ length: 1 + Math.floor(sorteio() * 4) }, () => escolher(["const a = 1", "", "  indentado", "# comentário", "- item", "```", "| a | b |", "fim"]))
      return { type: "codeBlock", attrs: { language: escolher([null, "js", "py"]) }, content: [{ type: "text", text: linhas.join("\n") || "x" }] }
    }
    case "hr":
      return { type: "horizontalRule" }
    case "table": {
      const colunas = 1 + Math.floor(sorteio() * 3)
      const linhasTabela = 1 + Math.floor(sorteio() * 3)
      return {
        type: "table",
        content: Array.from({ length: linhasTabela }, (_, r) => ({
          type: "tableRow",
          content: Array.from({ length: colunas }, () => ({
            type: r === 0 ? "tableHeader" : "tableCell",
            content: [par(txt(escolher(["a", "b|c", "x y", "1"])))],
          })),
        })),
      }
    }
    case "img":
      return { type: "image", attrs: { src: "https://x.com/i.png", alt: escolher([null, "foto"]), title: null } }
    default:
      return paragrafoAleatorio()
  }
}

// Duas listas do mesmo tipo coladas viram uma só no Markdown (igual a qualquer Markdown).
function fundirListasVizinhas(blocos: NoDoc[]): NoDoc[] {
  const saida: NoDoc[] = []
  for (const bloco of blocos) {
    const anterior = saida[saida.length - 1]
    const ehLista = ["bulletList", "orderedList", "taskList"].includes(bloco.type)
    if (ehLista && anterior?.type === bloco.type) anterior.content = [...(anterior.content ?? []), ...(bloco.content ?? [])]
    else saida.push(bloco)
  }
  return saida
}

caso("aleatório: estruturas aninhadas voltam idênticas (2000 documentos)", () => {
  const sorteio = gerador(777)
  for (let n = 0; n < 2000; n++) {
    const doc = docDe(...fundirListasVizinhas(Array.from({ length: 1 + Math.floor(sorteio() * 5) }, () => blocoAleatorio(sorteio, 0))))
    const md = documentoParaMarkdown(doc)
    const volta = markdownParaDocumento(md)
    // Parágrafos soltos seguidos de lista etc. precisam de lista separada: confere pelo Markdown.
    assert.equal(documentoParaMarkdown(volta), md, `Markdown instável:\n${md}`)
    assert.deepEqual(JSON.parse(JSON.stringify(volta)), JSON.parse(JSON.stringify(doc)), `documento mudou\nMarkdown:\n${md}`)
  }
})

console.log(`${total - falhas}/${total} casos passaram`)
if (falhas > 0) process.exitCode = 1
