// Rafael Marques - 23/10/2026
// Conversão entre o Markdown da nota e o documento do editor (ProseMirror/TipTap).
// A nota continua guardada como Markdown puro (tags, links, tarefas, grafo e exportação
// seguem funcionando); o editor só mostra o texto já formatado. Sem dependências: dá para
// testar em Node (veja markdown-documento.teste.ts).
//
// Sintaxes do SprintNote entendidas aqui:
//   **negrito**  *itálico*  ~~riscado~~  ==marca-texto==  `código`  [texto](url)
//   [[Nota]]  [[Livro/Nota|texto]]   (link entre notas)
//   > [!dica] texto                  (destaque / callout)
//   - item  1. item  - [ ] tarefa  (com recuo de 2 espaços por nível)
//   # Título  > citação  ---  ```código  | tabela |  ![alt](imagem)

export type MarcaDoc = { type: string; attrs?: Record<string, unknown> }
export type NoDoc = { type: string; attrs?: Record<string, unknown>; content?: NoDoc[]; marks?: MarcaDoc[]; text?: string }

export type VarianteDestaque = "info" | "dica" | "aviso" | "perigo" | "nota"
export const variantesDestaque: VarianteDestaque[] = ["info", "dica", "aviso", "perigo", "nota"]

// Nomes aceitos na hora de ler (inclui os do Obsidian em inglês).
const apelidosVariante: Record<string, VarianteDestaque> = {
  info: "info", note: "nota", nota: "nota", abstract: "info", summary: "info",
  tip: "dica", dica: "dica", hint: "dica", success: "dica", check: "dica",
  warning: "aviso", aviso: "aviso", caution: "aviso", attention: "aviso", question: "aviso",
  danger: "perigo", perigo: "perigo", error: "perigo", bug: "perigo", failure: "perigo",
}

// Nome digitado em "> [!nome]" → tipo de destaque (desconhecidos viram "nota").
export const variantePorApelido = (nome: string): VarianteDestaque => apelidosVariante[nome.toLowerCase()] ?? "nota"

const PONTUACAO = /[!-/:-@[-`{-~]/
const REGEX_WIKI = /^\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]/
const REGEX_URL_SOLTA = /^https?:\/\/[^\s<>]+/

// ---------------------------------------------------------------------------
// Markdown → documento
// ---------------------------------------------------------------------------

const texto = (valor: string, marcas: MarcaDoc[]): NoDoc =>
  marcas.length > 0 ? { type: "text", text: valor, marks: marcas } : { type: "text", text: valor }

function contarSequencia(fonte: string, inicio: number, caractere: string) {
  let fim = inicio
  while (fonte[fim] === caractere) fim++
  return fim - inicio
}

// Fim de um trecho `código` que começou em "inicio" (sequência de "tamanho" crases).
function acharFimCodigo(fonte: string, depoisDaAbertura: number, tamanho: number) {
  let i = depoisDaAbertura
  while (i < fonte.length) {
    if (fonte[i] === "`") {
      const sequencia = contarSequencia(fonte, i, "`")
      if (sequencia === tamanho) return i
      i += sequencia
    } else i++
  }
  return -1
}

const temLetraOuNumero = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c)

// Quantos delimitadores soltos (sem barra, fora de código) existem entre dois pontos.
function contarDelimitadores(fonte: string, de: number, ate: number, caractere: string) {
  let total = 0
  for (let i = de; i < ate; i++) {
    const c = fonte[i]
    if (c === "\\") i++
    else if (c === "`") {
      const sequencia = contarSequencia(fonte, i, "`")
      const fim = acharFimCodigo(fonte, i + sequencia, sequencia)
      i = (fim >= 0 && fim < ate ? fim + sequencia : i + sequencia) - 1
    } else if (c === caractere) total++
  }
  return total
}

// Procura o fechamento de um delimitador (*, _, ~) que abriu em "de".
function acharFechamento(fonte: string, de: number, caractere: string, tamanho: number) {
  let i = de
  while (i < fonte.length) {
    const c = fonte[i]
    if (c === "\\") {
      i += 2
      continue
    }
    if (c === "`") {
      const sequencia = contarSequencia(fonte, i, "`")
      const fim = acharFimCodigo(fonte, i + sequencia, sequencia)
      i = fim >= 0 ? fim + sequencia : i + sequencia
      continue
    }
    if (c === "[" && fonte[i + 1] === "[") {
      const wiki = REGEX_WIKI.exec(fonte.slice(i))
      if (wiki) {
        i += wiki[0].length
        continue
      }
    }
    if (c === caractere) {
      const sequencia = contarSequencia(fonte, i, caractere)
      const depois = fonte[i + sequencia]
      const valido = i > de && !/\s/.test(fonte[i - 1]) && (caractere !== "_" || !temLetraOuNumero(depois))
      if (valido && sequencia === tamanho) return i
      if (valido && sequencia > tamanho && caractere !== "~") {
        // Sequência maior que o delimitador (***): se sobrou um delimitador aberto lá dentro
        // (**a *b***), o fechamento fica no fim da sequência; senão, no começo (*a***b**).
        const extra = sequencia - tamanho
        return contarDelimitadores(fonte, de, i, caractere) % 2 === 1 ? i + extra : i
      }
      i += sequencia
      continue
    }
    i++
  }
  return -1
}

// Fim do rótulo "[...]" de um link (aceita colchetes aninhados).
function acharColcheteFinal(fonte: string, abertura: number) {
  let nivel = 0
  for (let i = abertura; i < fonte.length; i++) {
    if (fonte[i] === "\\") i++
    else if (fonte[i] === "[") nivel++
    else if (fonte[i] === "]" && --nivel === 0) return i
  }
  return -1
}

// "(url)" ou "(url "título")" depois do rótulo. Aceita parênteses balanceados na url.
function lerDestinoLink(fonte: string, abertura: number): { href: string; titulo: string | null; fim: number } | null {
  if (fonte[abertura] !== "(") return null
  let i = abertura + 1
  let nivel = 0
  const inicio = i
  while (i < fonte.length) {
    const c = fonte[i]
    if (c === "\\") i++
    else if (c === "(") nivel++
    else if (c === ")") {
      if (nivel === 0) break
      nivel--
    } else if (/\s/.test(c) && nivel === 0) break
    i++
  }
  const href = fonte.slice(inicio, i)
  let titulo: string | null = null
  if (/\s/.test(fonte[i] ?? "")) {
    const m = /^\s+"([^"]*)"\s*/.exec(fonte.slice(i))
    if (m) {
      titulo = m[1]
      i += m[0].length
    } else {
      while (/\s/.test(fonte[i] ?? "")) i++
    }
  }
  if (fonte[i] !== ")" || !href) return null
  return { href: href.replace(/\\([()])/g, "$1"), titulo, fim: i + 1 }
}

function juntarTextos(nos: NoDoc[]): NoDoc[] {
  const saida: NoDoc[] = []
  for (const no of nos) {
    const anterior = saida[saida.length - 1]
    if (no.type === "text" && anterior?.type === "text" && JSON.stringify(anterior.marks ?? []) === JSON.stringify(no.marks ?? [])) {
      anterior.text = (anterior.text ?? "") + (no.text ?? "")
    } else if (no.type !== "text" || no.text) saida.push(no)
  }
  return saida
}

function comMarca(marcas: MarcaDoc[], nova: MarcaDoc) {
  return marcas.some((marca) => marca.type === nova.type) ? marcas : [...marcas, nova]
}

// Texto corrido de um parágrafo (já com as quebras de linha como "\n").
function lerInline(fonte: string, marcas: MarcaDoc[] = []): NoDoc[] {
  const saida: NoDoc[] = []
  let buffer = ""
  const soltar = () => {
    if (buffer) saida.push(texto(buffer, marcas))
    buffer = ""
  }
  let i = 0

  ESTILO: while (i < fonte.length) {
    const c = fonte[i]

    if (c === "\\" && i + 1 < fonte.length && PONTUACAO.test(fonte[i + 1])) {
      buffer += fonte[i + 1]
      i += 2
      continue
    }
    if (c === "\n") {
      soltar()
      saida.push({ type: "hardBreak" })
      i++
      continue
    }
    if (c === "<" && /^<br\s*\/?>/i.test(fonte.slice(i, i + 6))) {
      soltar()
      saida.push({ type: "hardBreak" })
      i += /^<br\s*\/?>/i.exec(fonte.slice(i))![0].length
      continue
    }

    if (c === "`") {
      const tamanho = contarSequencia(fonte, i, "`")
      const fim = acharFimCodigo(fonte, i + tamanho, tamanho)
      if (fim > i + tamanho) {
        let codigo = fonte.slice(i + tamanho, fim)
        if (codigo.length > 2 && codigo.startsWith(" ") && codigo.endsWith(" ") && codigo.trim()) codigo = codigo.slice(1, -1)
        soltar()
        saida.push(texto(codigo, [{ type: "code" }]))
        i = fim + tamanho
        continue
      }
      buffer += "`".repeat(tamanho)
      i += tamanho
      continue
    }

    if (c === "[") {
      const wiki = fonte[i + 1] === "[" ? REGEX_WIKI.exec(fonte.slice(i)) : null
      if (wiki) {
        soltar()
        saida.push({
          type: "wikiLink",
          attrs: { alvo: wiki[1].trim(), rotulo: wiki[2]?.trim() || null },
          ...(marcas.length > 0 ? { marks: marcas.filter((marca) => marca.type !== "link") } : {}),
        })
        i += wiki[0].length
        continue
      }
      const fimRotulo = acharColcheteFinal(fonte, i)
      const destino = fimRotulo > 0 ? lerDestinoLink(fonte, fimRotulo + 1) : null
      if (destino && fimRotulo > i + 1) {
        soltar()
        const interno = fonte.slice(i + 1, fimRotulo)
        const marca: MarcaDoc = { type: "link", attrs: { href: destino.href, ...(destino.titulo ? { title: destino.titulo } : {}) } }
        saida.push(...lerInline(interno, comMarca(marcas, marca)))
        i = destino.fim
        continue
      }
      buffer += c
      i++
      continue
    }

    if (c === "h" && (i === 0 || !temLetraOuNumero(fonte[i - 1])) && /^https?:\/\//.test(fonte.slice(i, i + 8))) {
      const url = REGEX_URL_SOLTA.exec(fonte.slice(i))
      if (url) {
        // Pontuação no fim da frase não faz parte do endereço.
        const limpa = url[0].replace(/[.,;:!?)\]'"]+$/, "")
        if (limpa.length > 8) {
          soltar()
          saida.push(texto(limpa, comMarca(marcas, { type: "link", attrs: { href: limpa } })))
          i += limpa.length
          continue
        }
      }
    }

    if (c === "=" && fonte[i + 1] === "=") {
      const m = /^==((?:\\.|[^=\n\\]|=(?!=))+)==/.exec(fonte.slice(i))
      if (m && !/^\s|\s$/.test(m[1])) {
        soltar()
        saida.push(...lerInline(m[1], comMarca(marcas, { type: "highlight" })))
        i += m[0].length
        continue
      }
    }

    if (c === "*" || c === "_" || c === "~") {
      const sequencia = contarSequencia(fonte, i, c)
      const maximo = c === "~" ? (sequencia >= 2 ? 2 : 0) : sequencia > 3 ? 0 : sequencia
      // Tenta a sequência inteira e, se não houver fechamento, delimitadores menores:
      //  ***a*b**  → negrito com itálico dentro (a estrela que sobra fica dentro do miolo);
      //  **a*      → uma estrela solta e depois itálico (a estrela que sobra é texto).
      for (let tamanho = maximo; tamanho >= (c === "~" ? 2 : 1); tamanho--) {
        const literais = maximo === 3 ? 0 : sequencia - tamanho
        const inicio = i + literais + tamanho
        const abre = !/\s/.test(fonte[inicio] ?? " ") && (c !== "_" || i === 0 || !temLetraOuNumero(fonte[i - 1]))
        if (!abre) continue
        const fecha = acharFechamento(fonte, inicio, c, tamanho)
        if (fecha <= inicio) continue
        const interno = fonte.slice(inicio, fecha)
        const novas: MarcaDoc[] =
          c === "~" ? [{ type: "strike" }] : tamanho === 1 ? [{ type: "italic" }] : tamanho === 2 ? [{ type: "bold" }] : [{ type: "bold" }, { type: "italic" }]
        let proximas = marcas
        for (const nova of novas) proximas = comMarca(proximas, nova)
        buffer += c.repeat(literais)
        soltar()
        saida.push(...lerInline(interno, proximas))
        i = fecha + tamanho
        continue ESTILO
      }
      buffer += c.repeat(sequencia)
      i += sequencia
      continue
    }

    buffer += c
    i++
  }
  soltar()
  return juntarTextos(saida)
}

const REGEX_TAREFA = /^(\s*)[-*+] \[( |x|X)\] ?(.*)$/
const REGEX_ITEM = /^(\s*)([-*+]|\d{1,9}[.)]) (.*)$/
const REGEX_TITULO = /^(#{1,6}) (.*)$/
const REGEX_DIVISOR = /^(---|\*\*\*|___)\s*$/
// Cerca de código: ``` ou ~~~ no começo da linha; a linguagem (depois dela) não pode ter crase,
// senão a linha é só um trecho `de código` em linha.
const REGEX_CERCA = /^(`{3,}|~{3,})([^`]*)$/
const REGEX_IMAGEM = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/
const REGEX_DELIMITADOR_TABELA = /^\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/

const recuoDe = (linha: string) => linha.length - linha.trimStart().length + (linha.slice(0, linha.length - linha.trimStart().length).match(/\t/g)?.length ?? 0)

const ehItem = (linha: string) => REGEX_ITEM.test(linha) || REGEX_TAREFA.test(linha)

function iniciaBloco(linha: string) {
  return (
    ehItem(linha) ||
    REGEX_TITULO.test(linha) ||
    REGEX_DIVISOR.test(linha) ||
    REGEX_CERCA.test(linha) ||
    linha.startsWith(">") ||
    linha.startsWith("|")
  )
}

function dividirCelulas(linha: string) {
  let corpo = linha.trim()
  if (corpo.startsWith("|")) corpo = corpo.slice(1)
  if (corpo.endsWith("|") && !corpo.endsWith("\\|")) corpo = corpo.slice(0, -1)
  const celulas: string[] = []
  let atual = ""
  let emCodigo = false
  for (let i = 0; i < corpo.length; i++) {
    const c = corpo[i]
    if (c === "\\" && corpo[i + 1] === "|") {
      atual += "|"
      i++
    } else if (c === "`") {
      emCodigo = !emCodigo
      atual += c
    } else if (c === "|" && !emCodigo) {
      celulas.push(atual.trim())
      atual = ""
    } else atual += c
  }
  celulas.push(atual.trim())
  return celulas
}

function paragrafo(fonte: string): NoDoc {
  const conteudo = lerInline(fonte)
  return conteudo.length > 0 ? { type: "paragraph", content: conteudo } : { type: "paragraph" }
}

function lerTabela(linhas: string[]): NoDoc {
  const cabecalho = dividirCelulas(linhas[0])
  const colunas = cabecalho.length
  const celula = (tipo: "tableHeader" | "tableCell", conteudo: string): NoDoc => ({ type: tipo, content: [paragrafo(conteudo)] })
  const corpo = linhas.slice(2).map((linha) => {
    const celulas = dividirCelulas(linha)
    while (celulas.length < colunas) celulas.push("")
    return { type: "tableRow", content: celulas.slice(0, colunas).map((c) => celula("tableCell", c)) }
  })
  return { type: "table", content: [{ type: "tableRow", content: cabecalho.map((c) => celula("tableHeader", c)) }, ...corpo] }
}

type ListaAberta = { recuo: number; tipo: "bulletList" | "orderedList" | "taskList"; no: NoDoc }

function lerLista(linhas: string[], inicio: number): { no: NoDoc[]; proximo: number } {
  const raizes: NoDoc[] = []
  const pilha: ListaAberta[] = []
  let i = inicio

  const adicionarItem = (lista: NoDoc, item: NoDoc) => {
    ;(lista.content ??= []).push(item)
  }

  while (i < linhas.length) {
    const linha = linhas[i]
    if (!linha.trim()) {
      let j = i
      while (j < linhas.length && !linhas[j].trim()) j++
      if (j < linhas.length && ehItem(linhas[j])) {
        i = j
        continue
      }
      break
    }
    const tarefa = REGEX_TAREFA.exec(linha)
    const comum = tarefa ? null : REGEX_ITEM.exec(linha)
    if (!tarefa && !comum) break

    const espacos = (tarefa ?? comum)![1]
    const recuo = espacos.replace(/\t/g, "  ").length
    const tipo = tarefa ? "taskList" : /^\d/.test(comum![2]) ? "orderedList" : "bulletList"
    const textoItem = tarefa ? tarefa[3] : comum![3]
    const item: NoDoc = tarefa
      ? { type: "taskItem", attrs: { checked: tarefa[2] !== " " }, content: [paragrafo(textoItem)] }
      : { type: "listItem", content: [paragrafo(textoItem)] }

    while (pilha.length > 0 && recuo < pilha[pilha.length - 1].recuo) pilha.pop()
    const topo = pilha[pilha.length - 1]
    const novaLista = (): NoDoc => ({ type: tipo, content: [] })

    if (topo && recuo === topo.recuo && topo.tipo === tipo) {
      adicionarItem(topo.no, item)
    } else if (topo && recuo > topo.recuo) {
      const lista = novaLista()
      adicionarItem(lista, item)
      const pai = topo.no.content![topo.no.content!.length - 1]
      ;(pai.content ??= []).push(lista)
      pilha.push({ recuo, tipo, no: lista })
    } else {
      // Mesmo nível com outro tipo de lista (ou primeira lista): abre uma lista nova ao lado.
      if (topo) pilha.pop()
      const lista = novaLista()
      adicionarItem(lista, item)
      const pai = pilha[pilha.length - 1]
      if (pai) (pai.no.content![pai.no.content!.length - 1].content ??= []).push(lista)
      else raizes.push(lista)
      pilha.push({ recuo, tipo, no: lista })
    }
    i++

    // Linhas coladas logo abaixo e mais recuadas continuam o mesmo item (quebra de linha).
    while (i < linhas.length && linhas[i].trim() && !iniciaBloco(linhas[i]) && recuoDe(linhas[i]) > recuo) {
      const paragrafoItem = item.content![0]
      paragrafoItem.content = juntarTextos([...(paragrafoItem.content ?? []), { type: "hardBreak" }, ...lerInline(linhas[i].trim())])
      i++
    }
  }
  return { no: raizes, proximo: i }
}

// Linha que fecha um bloco de código aberto com "cerca" (``` ou ~~~, no mínimo do mesmo tamanho).
function fechaCerca(linha: string, cerca: string) {
  const aparada = linha.trim()
  return aparada.length >= cerca.length && aparada === cerca[0].repeat(aparada.length)
}

function lerBlocos(linhas: string[]): NoDoc[] {
  const blocos: NoDoc[] = []
  let i = 0

  while (i < linhas.length) {
    const linha = linhas[i]
    let m: RegExpExecArray | null

    if (!linha.trim()) {
      i++
      continue
    }

    if ((m = REGEX_CERCA.exec(linha))) {
      const cerca = m[1]
      const linguagem = m[2].trim().split(/\s+/)[0] ?? ""
      const conteudo: string[] = []
      i++
      while (i < linhas.length && !fechaCerca(linhas[i], cerca)) conteudo.push(linhas[i++])
      i++
      const bloco: NoDoc = { type: "codeBlock", attrs: { language: linguagem || null } }
      if (conteudo.length > 0 && conteudo.join("\n")) bloco.content = [{ type: "text", text: conteudo.join("\n") }]
      blocos.push(bloco)
      continue
    }

    if ((m = REGEX_TITULO.exec(linha))) {
      const conteudo = lerInline(m[2].replace(/\s+#+\s*$/, ""))
      blocos.push({ type: "heading", attrs: { level: m[1].length }, ...(conteudo.length > 0 ? { content: conteudo } : {}) })
      i++
      continue
    }

    if (REGEX_DIVISOR.test(linha)) {
      blocos.push({ type: "horizontalRule" })
      i++
      continue
    }

    if (ehItem(linha)) {
      const { no, proximo } = lerLista(linhas, i)
      blocos.push(...no)
      i = proximo
      continue
    }

    if (linha.startsWith(">")) {
      const conteudo: string[] = []
      while (i < linhas.length && linhas[i].startsWith(">")) conteudo.push(linhas[i++].replace(/^> ?/, ""))
      const chamada = /^\[!([\p{L}]+)\][+-]? ?(.*)$/u.exec(conteudo[0] ?? "")
      if (chamada) {
        const variante = apelidosVariante[chamada[1].toLowerCase()] ?? "nota"
        const interno = lerBlocos([chamada[2], ...conteudo.slice(1)])
        blocos.push({ type: "destaque", attrs: { variante }, content: interno.length > 0 ? interno : [{ type: "paragraph" }] })
      } else {
        const interno = lerBlocos(conteudo)
        blocos.push({ type: "blockquote", content: interno.length > 0 ? interno : [{ type: "paragraph" }] })
      }
      continue
    }

    if (linha.startsWith("|") && i + 1 < linhas.length && linhas[i + 1].startsWith("|") && REGEX_DELIMITADOR_TABELA.test(linhas[i + 1])) {
      const tabela: string[] = []
      while (i < linhas.length && linhas[i].startsWith("|")) tabela.push(linhas[i++])
      blocos.push(lerTabela(tabela))
      continue
    }

    if ((m = REGEX_IMAGEM.exec(linha.trim()))) {
      blocos.push({ type: "image", attrs: { src: m[2], alt: m[1] || null, title: m[3] || null } })
      i++
      continue
    }

    // Parágrafo: linhas seguidas até uma linha vazia ou o começo de outro bloco.
    const conteudo: string[] = [linha]
    i++
    while (i < linhas.length && linhas[i].trim() && !iniciaBloco(linhas[i])) conteudo.push(linhas[i++])
    // Espaços nas pontas das linhas não contam (a quebra de linha já é uma quebra).
    blocos.push(paragrafo(conteudo.map((linhaDoParagrafo) => linhaDoParagrafo.trim()).join("\n")))
  }
  return blocos
}

export function markdownParaDocumento(markdown: string): NoDoc {
  const linhas = markdown.replace(/\r\n?/g, "\n").split("\n")
  const blocos = lerBlocos(linhas)
  return { type: "doc", content: blocos.length > 0 ? blocos : [{ type: "paragraph" }] }
}

// ---------------------------------------------------------------------------
// Documento → Markdown
// ---------------------------------------------------------------------------

// Escapa só o necessário para o texto voltar igual (mantém #tags, snake_case e URLs).
// "dentroDeLink": dentro do texto de um link, colchetes sempre são escapados.
// "comMarcas": o texto está entre delimitadores (**, ==...), então as pontas dele são sensíveis.
function escaparTexto(valor: string, dentroDeLink = false, comMarcas = false) {
  let saida = ""
  for (let i = 0; i < valor.length; i++) {
    const c = valor[i]
    const antes = valor[i - 1]
    const depois = valor[i + 1]
    // No fim do trecho a barra poderia "escapar" o delimitador que vem logo depois.
    if (c === "\\") saida += depois === undefined || PONTUACAO.test(depois) ? "\\\\" : c
    else if (c === "`") saida += "\\`"
    else if (c === "*") {
      const soltoAntes = antes === undefined ? !comMarcas : /\s/.test(antes)
      const soltoDepois = depois === undefined ? !comMarcas : /\s/.test(depois)
      saida += soltoAntes && soltoDepois ? c : "\\*"
    }
    else if (c === "_") saida += temLetraOuNumero(antes) && temLetraOuNumero(depois) ? c : "\\_"
    else if (c === "~" || c === "=") {
      const naPonta = comMarcas && (antes === undefined || depois === undefined)
      saida += antes === c || depois === c || naPonta ? `\\${c}` : c
    }
    else if ((c === "[" || c === "]") && dentroDeLink) saida += "\\" + c
    else if (c === "[") saida += depois === "[" || /^\[[^\]\n]*\]\(/.test(valor.slice(i)) ? "\\[" : c
    else if (c === "<") saida += /^<br\s*\/?>/i.test(valor.slice(i, i + 6)) ? "\\<" : c
    else saida += c
  }
  return saida
}

// Linhas que virariam outro bloco se começassem assim.
function protegerInicioDeLinha(linha: string) {
  if (/^#{1,6} /.test(linha) || /^>/.test(linha) || /^[-+*] /.test(linha) || /^\|/.test(linha)) return `\\${linha}`
  if (/^\d{1,9}[.)] /.test(linha)) return linha.replace(/^(\d{1,9})([.)])/, "$1\\$2")
  if (REGEX_DIVISOR.test(linha) || REGEX_CERCA.test(linha)) return `\\${linha}`
  return linha
}

const ORDEM_MARCAS = ["link", "bold", "italic", "strike", "highlight"]

const abertura: Record<string, string> = { bold: "**", italic: "*", strike: "~~", highlight: "==" }

function mesmaMarca(a: MarcaDoc, b: MarcaDoc) {
  return a.type === b.type && JSON.stringify(a.attrs ?? {}) === JSON.stringify(b.attrs ?? {})
}

function fechaMarca(marca: MarcaDoc) {
  if (marca.type === "link") {
    const href = String(marca.attrs?.href ?? "").replace(/([()])/g, "\\$1")
    const titulo = marca.attrs?.title ? ` "${String(marca.attrs.title).replace(/"/g, "'")}"` : ""
    return `](${href}${titulo})`
  }
  return abertura[marca.type]
}

function textoDoNo(no: NoDoc): string {
  if (no.type === "text") return no.text ?? ""
  if (no.type === "hardBreak") return "\n"
  return (no.content ?? []).map(textoDoNo).join("")
}

function codigoInline(valor: string) {
  const maior = Math.max(0, ...(valor.match(/`+/g) ?? []).map((sequencia) => sequencia.length))
  const cerca = "`".repeat(maior + 1)
  const precisaEspaco = valor.startsWith("`") || valor.endsWith("`") || (valor.startsWith(" ") && valor.endsWith(" ") && valor.trim())
  return precisaEspaco ? `${cerca} ${valor} ${cerca}` : `${cerca}${valor}${cerca}`
}

// Texto corrido de um parágrafo/título/célula. "celula": quebra de linha vira <br> e "|" é escapado.
function inlineParaMarkdown(nos: NoDoc[] = [], celula = false): string {
  let saida = ""
  let ativas: MarcaDoc[] = []
  let sobraFinal = ""

  const fechar = (ate: number) => {
    while (ativas.length > ate) saida += fechaMarca(ativas.pop()!)
  }
  const ordenar = (marcas: MarcaDoc[]) =>
    [...marcas].filter((marca) => marca.type !== "code").sort((a, b) => ORDEM_MARCAS.indexOf(a.type) - ORDEM_MARCAS.indexOf(b.type))

  // Marcas (sem código) de um vizinho, para um espaço solto herdar só o que os dois lados têm em comum.
  const marcasDoVizinho = (vizinho: NoDoc | undefined) =>
    vizinho && vizinho.type !== "hardBreak" && !vizinho.marks?.some((marca) => marca.type === "code") ? ordenar(vizinho.marks ?? []) : []

  nos.forEach((no, posicao) => {
    if (no.type === "hardBreak") {
      fechar(0)
      saida += sobraFinal + (celula ? "<br>" : "\n")
      sobraFinal = ""
      return
    }

    const ehCodigo = no.marks?.some((marca) => marca.type === "code")
    let desejadas = ehCodigo ? [] : ordenar(no.marks ?? [])
    let miolo: string
    let inicioBranco = ""
    let fimBranco = ""

    if (no.type === "text") {
      const bruto = no.text ?? ""
      if (ehCodigo) {
        miolo = codigoInline(bruto)
      } else {
        const aparado = bruto.trim()
        if (!aparado) {
          // Só espaços: ficam dentro só das formatações que os vizinhos dos dois lados também têm
          // (assim um link com formatações diferentes por dentro continua sendo um link só).
          const antes = marcasDoVizinho(nos[posicao - 1])
          const depois = marcasDoVizinho(nos[posicao + 1])
          desejadas = ordenar(no.marks ?? []).filter(
            (marca) => antes.some((outra) => mesmaMarca(outra, marca)) && depois.some((outra) => mesmaMarca(outra, marca))
          )
          inicioBranco = bruto
          miolo = ""
        } else {
          inicioBranco = bruto.slice(0, bruto.length - bruto.trimStart().length)
          fimBranco = bruto.slice(bruto.trimEnd().length)
          const link = desejadas.find((marca) => marca.type === "link")
          const href = link ? String(link.attrs?.href ?? "") : ""
          // Link cujo texto é o próprio endereço: escreve o endereço solto.
          if (link && aparado === href && desejadas.length === 1) {
            desejadas = []
            miolo = aparado
          } else {
            // As pontas do texto encostam em delimitadores quando há marcas ou vizinhos.
            miolo = escaparTexto(aparado, Boolean(link), desejadas.length > 0 || posicao > 0 || posicao < nos.length - 1)
          }
        }
      }
    } else if (no.type === "wikiLink") {
      const alvo = String(no.attrs?.alvo ?? "")
      const rotulo = no.attrs?.rotulo ? String(no.attrs.rotulo) : ""
      miolo = rotulo ? `[[${alvo}|${rotulo}]]` : `[[${alvo}]]`
      desejadas = desejadas.filter((marca) => marca.type !== "link")
    } else {
      miolo = escaparTexto(textoDoNo(no))
    }

    // Fecha o que não vale mais (a partir da primeira diferença) e emite os espaços que sobraram.
    let comum = 0
    while (comum < ativas.length && comum < desejadas.length && mesmaMarca(ativas[comum], desejadas[comum])) comum++
    fechar(comum)
    saida += sobraFinal + inicioBranco
    sobraFinal = ""
    for (let k = comum; k < desejadas.length; k++) {
      const marca = desejadas[k]
      saida += marca.type === "link" ? "[" : abertura[marca.type]
      ativas.push(marca)
    }
    saida += celula ? miolo.replace(/\|/g, "\\|") : miolo
    sobraFinal = fimBranco
  })

  fechar(0)
  saida += sobraFinal
  ativas = []
  return saida
}

const prefixar = (conteudo: string, prefixo: string) =>
  conteudo
    .split("\n")
    .map((linha) => (linha ? `${prefixo}${linha}` : prefixo.trimEnd()))
    .join("\n")

function paragrafoParaMarkdown(no: NoDoc) {
  return inlineParaMarkdown(no.content)
    .split("\n")
    // Espaços nas pontas da linha não significam nada no Markdown (e sumiriam ao reabrir).
    .map((linha) => protegerInicioDeLinha(linha.trim()))
    .join("\n")
}

function listaParaMarkdown(lista: NoDoc, nivel: number): string {
  const recuo = "  ".repeat(nivel)
  const linhas: string[] = []
  ;(lista.content ?? []).forEach((item) => {
    const filhos = item.content ?? []
    const primeiro = filhos.find((filho) => filho.type === "paragraph")
    const marcador = lista.type === "orderedList" ? "1." : "-"
    const caixa = lista.type === "taskList" ? (item.attrs?.checked ? "[x] " : "[ ] ") : ""
    const texto = primeiro ? paragrafoParaMarkdown(primeiro).split("\n") : [""]
    linhas.push(`${recuo}${marcador} ${caixa}${texto[0]}`.trimEnd() + (texto[0] ? "" : " "))
    texto.slice(1).forEach((linha) => linhas.push(`${recuo}  ${linha}`))
    for (const filho of filhos) {
      if (filho === primeiro) continue
      if (filho.type === "bulletList" || filho.type === "orderedList" || filho.type === "taskList") {
        linhas.push(listaParaMarkdown(filho, nivel + 1))
      } else if (filho.type === "paragraph") {
        paragrafoParaMarkdown(filho).split("\n").forEach((linha) => linhas.push(`${recuo}  ${linha}`))
      } else {
        textoDoNo(filho).split("\n").forEach((linha) => linhas.push(`${recuo}  ${linha}`))
      }
    }
  })
  return linhas.join("\n")
}

function tabelaParaMarkdown(tabela: NoDoc): string {
  const linhas = (tabela.content ?? []).map((linha) =>
    (linha.content ?? []).map((celula) =>
      (celula.content ?? [])
        .map((bloco) => inlineParaMarkdown(bloco.type === "paragraph" ? bloco.content : [{ type: "text", text: textoDoNo(bloco) }], true))
        .join("<br>")
        .trim()
    )
  )
  if (linhas.length === 0) return ""
  const colunas = Math.max(...linhas.map((linha) => linha.length))
  const normal = linhas.map((linha) => [...linha, ...Array(colunas - linha.length).fill("")])
  const formatar = (celulas: string[]) => `| ${celulas.join(" | ")} |`
  return [formatar(normal[0]), formatar(Array(colunas).fill("---")), ...normal.slice(1).map(formatar)].join("\n")
}

function blocoParaMarkdown(no: NoDoc): string | null {
  switch (no.type) {
    case "paragraph": {
      const texto = paragrafoParaMarkdown(no)
      return texto.trim() ? texto : null
    }
    case "heading":
      return `${"#".repeat(Math.min(6, Math.max(1, Number(no.attrs?.level ?? 1))))} ${inlineParaMarkdown(no.content).replace(/\n/g, " ")}`.trimEnd()
    case "bulletList":
    case "orderedList":
    case "taskList":
      return listaParaMarkdown(no, 0)
    case "blockquote": {
      const interno = blocosParaMarkdown(no.content ?? [])
      return interno ? prefixar(interno, "> ") : ">"
    }
    case "destaque": {
      const variante = String(no.attrs?.variante ?? "info")
      const filhos = no.content ?? []
      const [primeiro, ...resto] = filhos
      const marca = `[!${variante}]`
      if (primeiro?.type === "paragraph") {
        const linhas = paragrafoParaMarkdown(primeiro).split("\n")
        const restante = blocosParaMarkdown(resto)
        const corpo = [`${marca} ${linhas[0]}`.trimEnd(), ...linhas.slice(1)].join("\n")
        return prefixar(restante ? `${corpo}\n\n${restante}` : corpo, "> ")
      }
      const todos = blocosParaMarkdown(filhos)
      return prefixar(todos ? `${marca}\n${todos}` : marca, "> ")
    }
    case "codeBlock": {
      const codigo = (no.content ?? []).map((filho) => filho.text ?? "").join("")
      const maior = Math.max(2, ...(codigo.match(/^`{3,}/gm) ?? []).map((cerca) => cerca.length))
      const cerca = "`".repeat(maior + 1)
      return `${cerca}${no.attrs?.language ?? ""}\n${codigo}\n${cerca}`
    }
    case "horizontalRule":
      return "---"
    case "table":
      return tabelaParaMarkdown(no)
    case "image": {
      const src = String(no.attrs?.src ?? "")
      if (!src) return null
      const alt = String(no.attrs?.alt ?? "").replace(/[\[\]]/g, "")
      const titulo = no.attrs?.title ? ` "${String(no.attrs.title).replace(/"/g, "'")}"` : ""
      return `![${alt}](${src}${titulo})`
    }
    default: {
      const texto = textoDoNo(no).trim()
      return texto || null
    }
  }
}

function blocosParaMarkdown(nos: NoDoc[]): string {
  return nos
    .map(blocoParaMarkdown)
    .filter((bloco): bloco is string => bloco !== null)
    .join("\n\n")
}

export function documentoParaMarkdown(doc: NoDoc): string {
  return blocosParaMarkdown(doc.content ?? [])
}
