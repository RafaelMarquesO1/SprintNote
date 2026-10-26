// Rafael Marques - 23/10/2026
// Importa um cofre (vault) do Obsidian: pasta, .zip ou arquivos .md soltos.
//   • pasta de 1º nível  → livro; pastas mais fundas → nota-pasta com subnotas
//   • .md na raiz         → nota solta
//   • frontmatter tags    → tags da nota
//   • [[Pasta/Nota#Seção]] → [[Nota]];  ![[Nota]] → [[Nota]];  ![[foto.png]] → aviso em texto
// O que já existe na conta é mantido: a importação só acrescenta.

import { gerarId } from "@/lib/gerar-id"
import { useNotas } from "@/lib/estado/notas"
import { normalizar } from "@/lib/links-wiki"
import { normalizarTag } from "@/lib/tags"
import type { Livro, Nota } from "@/lib/tipos"
import { listarZip } from "@/lib/zip-leitura"

export type ArquivoCofre = { caminho: string; ler: () => Promise<string>; modificadoEm?: number }

export type ResumoObsidian = { livros: number; notas: number; repetidas: number; anexos: number }

type NotaLida = { pasta: string[]; titulo: string; conteudo: string; tags: string[]; modificadoEm?: number }

export type CofreLido = { notas: NotaLida[]; resumo: ResumoObsidian }

const TAMANHO_MAXIMO_ARQUIVO = 5 * 1024 * 1024
const REGEX_EMBUTIDO = /!\[\[([^\[\]|]+)(?:\|[^\[\]]*)?\]\]/g
const REGEX_LINK = /\[\[([^\[\]|]+)(?:\|([^\[\]]*))?\]\]/g

function ehMarkdown(caminho: string) {
  return /\.md$/i.test(caminho)
}

function ocultoOuDeSistema(partes: string[]) {
  return partes.some((parte) => parte.startsWith("."))
}

// Separa o bloco "---" do início e devolve as tags que ele declara.
function lerFrontmatter(texto: string) {
  const achado = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(texto)
  if (!achado) return { corpo: texto, tags: [] as string[] }
  const tags: string[] = []
  const linhas = achado[1].split(/\r?\n/)
  for (let i = 0; i < linhas.length; i++) {
    const campo = /^(tags?|tag)\s*:\s*(.*)$/i.exec(linhas[i])
    if (!campo) continue
    const resto = campo[2].trim()
    if (resto) {
      tags.push(...resto.replace(/^\[|\]$/g, "").split(/[,\s]+/))
    } else {
      while (i + 1 < linhas.length && /^\s*-\s+/.test(linhas[i + 1])) tags.push(linhas[++i].replace(/^\s*-\s+/, ""))
    }
  }
  const limpas = tags
    .map((tag) => normalizarTag(tag.replace(/^["'#]+|["']+$/g, "").trim().replace(/\s+/g, "-")))
    .filter(Boolean)
  return { corpo: texto.slice(achado[0].length), tags: [...new Set(limpas)] }
}

// Converte a sintaxe do Obsidian para a que o SprintNote entende.
function converterConteudo(corpo: string) {
  let anexos = 0
  const convertido = corpo
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((trecho, indice) => {
      if (indice % 2 === 1) return trecho
      return trecho
        .replace(/%%[\s\S]*?%%/g, "")
        .replace(REGEX_EMBUTIDO, (_, alvo: string) => {
          const nome = alvo.trim()
          if (/\.[a-z0-9]{2,5}$/i.test(nome) && !ehMarkdown(nome)) {
            anexos++
            return `*[anexo: ${nome.split("/").pop()}]*`
          }
          return `[[${nome}]]`
        })
        .replace(/!\[([^\]]*)\]\((?!https?:|data:)[^)]*\)/g, (_, texto: string) => {
          anexos++
          return `*[imagem${texto ? `: ${texto}` : ""}]*`
        })
        .replace(REGEX_LINK, (_, alvo: string, rotulo?: string) => {
          // Tira "#Seção" e "^bloco"; a pasta some: o SprintNote acha a nota pelo título.
          const limpo = alvo.split(/[#^]/)[0].trim().replace(/\.md$/i, "")
          if (!limpo) return rotulo ?? alvo
          const titulo = limpo.split("/").pop() as string
          return rotulo ? `[[${titulo}|${rotulo}]]` : `[[${titulo}]]`
        })
    })
    .join("")
  return { conteudo: convertido.replace(/^\s*\n/, "").replace(/\s+$/, ""), anexos }
}

export async function lerCofre(arquivos: ArquivoCofre[], removerRaiz: boolean): Promise<CofreLido> {
  const notas: NotaLida[] = []
  let anexos = 0
  let ignorados = 0

  for (const arquivo of arquivos) {
    const partes = arquivo.caminho.split("/").filter(Boolean)
    if (removerRaiz && partes.length > 1) partes.shift()
    if (partes.length === 0) continue
    if (ocultoOuDeSistema(partes)) continue
    const nomeArquivo = partes[partes.length - 1]
    if (!ehMarkdown(nomeArquivo)) {
      if (!/\.canvas$/i.test(nomeArquivo)) anexos++
      continue
    }
    const texto = await arquivo.ler()
    if (texto.length > TAMANHO_MAXIMO_ARQUIVO) {
      ignorados++
      continue
    }
    const { corpo, tags } = lerFrontmatter(texto.replace(/^﻿/, ""))
    const convertido = converterConteudo(corpo)
    anexos += convertido.anexos
    notas.push({
      pasta: partes.slice(0, -1),
      titulo: nomeArquivo.replace(/\.md$/i, "").trim() || "Sem título",
      conteudo: convertido.conteudo,
      tags,
      modificadoEm: arquivo.modificadoEm,
    })
  }

  if (notas.length === 0) {
    throw new Error(ignorados ? "Os arquivos .md encontrados passam de 5 MB cada." : "Não encontrei nenhuma nota .md nessa seleção.")
  }
  const livros = new Set(notas.filter((nota) => nota.pasta.length > 0).map((nota) => nota.pasta[0]))
  return { notas, resumo: { livros: livros.size, notas: notas.length, repetidas: 0, anexos } }
}

// Cofre vindo de uma pasta escolhida (webkitdirectory) ou de arquivos .md soltos.
export async function lerCofreDeArquivos(lista: FileList) {
  const arquivos: ArquivoCofre[] = Array.from(lista).map((arquivo) => ({
    caminho: arquivo.webkitRelativePath || arquivo.name,
    ler: () => arquivo.text(),
    modificadoEm: arquivo.lastModified,
  }))
  const daPasta = arquivos.length > 0 && Array.from(lista).every((arquivo) => arquivo.webkitRelativePath)
  return lerCofre(arquivos, daPasta)
}

export async function lerCofreDeZip(arquivo: File) {
  const entradas = listarZip(await arquivo.arrayBuffer(), () => true)
  return lerCofre(entradas, false)
}

// Acrescenta as notas lidas à biblioteca (livros de mesmo nome são reaproveitados).
export function importarCofre(cofre: CofreLido): ResumoObsidian {
  const { livros: livrosAtuais, notas: notasAtuais } = useNotas.getState()
  const livros = [...livrosAtuais]
  const notas = [...notasAtuais]
  const agora = Date.now()
  let repetidas = 0
  let criadas = 0
  const livrosNovos = new Set<string>()

  function livroDe(titulo: string) {
    const existente = livros.find((livro) => normalizar(livro.titulo) === normalizar(titulo))
    if (existente) return existente
    const livro: Livro = { id: gerarId(), titulo, descricao: "", icone: "livro", criadoEm: agora, atualizadoEm: agora }
    livros.push(livro)
    livrosNovos.add(livro.id)
    return livro
  }

  function achar(livroId: string | null, paiId: string | null, titulo: string) {
    return notas.find((nota) => nota.livroId === livroId && nota.paiId === paiId && normalizar(nota.titulo) === normalizar(titulo))
  }

  function criar(livroId: string | null, paiId: string | null, titulo: string, conteudo: string, tags: string[], modificadoEm?: number) {
    const momento = modificadoEm ?? agora
    const nota: Nota = {
      id: gerarId(),
      titulo,
      conteudo,
      livroId,
      paiId,
      icone: "arquivo",
      criadoEm: momento,
      atualizadoEm: momento,
      ...(tags.length ? { tags } : {}),
    }
    notas.push(nota)
    criadas++
    return nota
  }

  // Notas mais rasas primeiro: a "nota-pasta" (ex.: Aulas.md ao lado da pasta Aulas/) existe antes das filhas.
  const ordenadas = [...cofre.notas].sort((a, b) => a.pasta.length - b.pasta.length)
  for (const lida of ordenadas) {
    const livro = lida.pasta.length > 0 ? livroDe(lida.pasta[0]) : null
    let paiId: string | null = null
    // Pastas a partir do 2º nível viram notas-pasta (reaproveita a nota de mesmo nome, se houver).
    for (const nomePasta of lida.pasta.slice(1)) {
      const pai: Nota = achar(livro?.id ?? null, paiId, nomePasta) ?? criar(livro?.id ?? null, paiId, nomePasta, "", [])
      paiId = pai.id
    }
    const existente = achar(livro?.id ?? null, paiId, lida.titulo)
    if (existente) {
      // Nota-pasta vazia criada por este import: preenche em vez de duplicar.
      if (!existente.conteudo && lida.conteudo) {
        notas[notas.indexOf(existente)] = { ...existente, conteudo: lida.conteudo, ...(lida.tags.length ? { tags: lida.tags } : {}) }
      } else {
        repetidas++
      }
      continue
    }
    criar(livro?.id ?? null, paiId, lida.titulo, lida.conteudo, lida.tags, lida.modificadoEm)
  }

  useNotas.setState({ livros, notas })
  return { livros: livrosNovos.size, notas: criadas, repetidas, anexos: cofre.resumo.anexos }
}
