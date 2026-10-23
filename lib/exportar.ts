// Rafael Marques - 21/10/2026
// Backup e exportação: JSON com tudo (para restaurar no SprintNote) e
// Markdown em .zip (para ler em qualquer editor, inclusive no Obsidian).

import { chaveData } from "@/lib/datas"
import { useHabitos } from "@/lib/estado/habitos"
import { dadosPessoais, normalizarKanban, useKanban, type DadosKanban } from "@/lib/estado/kanban"
import { useNotas } from "@/lib/estado/notas"
import { useRotina } from "@/lib/estado/rotina"
import { useTarefas } from "@/lib/estado/tarefas"
import { tagsDaNota } from "@/lib/tags"
import type { Livro, Nota } from "@/lib/tipos"
import { gerarZip } from "@/lib/zip"

export function baixarArquivo(nome: string, conteudo: Blob | string, tipo = "text/plain;charset=utf-8") {
  const blob = typeof conteudo === "string" ? new Blob([conteudo], { type: tipo }) : conteudo
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function nomeSeguro(texto: string) {
  return texto.replace(/[\\/:*?"<>|#^[\]]/g, "-").replace(/\s+/g, " ").trim().slice(0, 80) || "Sem título"
}

function hojeArquivo() {
  return chaveData(new Date())
}

// ---------- Markdown ----------

export function notaParaMarkdown(nota: Nota) {
  const tags = tagsDaNota(nota)
  const cabecalho = [
    "---",
    `criado: ${chaveData(new Date(nota.criadoEm))}`,
    `atualizado: ${chaveData(new Date(nota.atualizadoEm))}`,
    ...(tags.length ? [`tags: [${tags.join(", ")}]`] : []),
    "---",
    "",
  ].join("\n")
  return `${cabecalho}${nota.conteudo}\n`
}

export function exportarNotaMarkdown(nota: Nota) {
  baixarArquivo(`${nomeSeguro(nota.titulo)}.md`, notaParaMarkdown(nota), "text/markdown;charset=utf-8")
}

// Livros viram pastas; subnotas ficam numa pasta com o nome da nota pai.
export function exportarMarkdownZip(livros: Livro[], notas: Nota[], nomeZip: string) {
  const arquivos: { caminho: string; conteudo: string }[] = []
  const usados = new Set<string>()

  function caminhoLivre(base: string) {
    let caminho = `${base}.md`
    let numero = 2
    while (usados.has(caminho.toLowerCase())) caminho = `${base} (${numero++}).md`
    usados.add(caminho.toLowerCase())
    return caminho
  }

  function adicionar(pasta: string, livroId: string | null, paiId: string | null) {
    for (const nota of notas.filter((item) => item.livroId === livroId && item.paiId === paiId)) {
      const nome = nomeSeguro(nota.titulo)
      arquivos.push({ caminho: caminhoLivre(`${pasta}/${nome}`), conteudo: notaParaMarkdown(nota) })
      adicionar(`${pasta}/${nome}`, livroId, nota.id)
    }
  }

  for (const livro of livros) {
    const pasta = nomeSeguro(livro.titulo)
    if (livro.descricao.trim()) arquivos.push({ caminho: caminhoLivre(`${pasta}/_Sobre o livro`), conteudo: `${livro.descricao}\n` })
    adicionar(pasta, livro.id, null)
  }
  if (notas.some((nota) => nota.livroId === null)) adicionar("Notas soltas", null, null)

  baixarArquivo(`${nomeZip}.zip`, gerarZip(arquivos))
  return arquivos.length
}

export function exportarLivroZip(livro: Livro, notas: Nota[]) {
  return exportarMarkdownZip([livro], notas.filter((nota) => nota.livroId === livro.id), nomeSeguro(livro.titulo))
}

// ---------- Backup completo (JSON) ----------

const VERSAO_BACKUP = 1

export function gerarBackup() {
  const notas = useNotas.getState()
  const rotina = useRotina.getState()
  return {
    app: "SprintNote",
    versao: VERSAO_BACKUP,
    exportadoEm: new Date().toISOString(),
    dados: {
      livros: notas.livros,
      notas: notas.notas,
      tarefas: useTarefas.getState().tarefas,
      habitos: useHabitos.getState().habitos,
      rotina: { itens: rotina.itens, feitosPorDia: rotina.feitosPorDia },
      // Rafael Marques - 23/10/2026: o backup leva só os quadros pessoais (os de equipe ficam no servidor).
      kanban: {
        ...dadosPessoais(useKanban.getState()),
        quadroAtivoId: useKanban.getState().quadroAtivoId,
      } as DadosKanban,
    },
  }
}

export function baixarBackup() {
  baixarArquivo(`sprintnote-backup-${hojeArquivo()}.json`, JSON.stringify(gerarBackup(), null, 2), "application/json")
}

export function baixarTudoEmMarkdown() {
  const { livros, notas } = useNotas.getState()
  const total = exportarMarkdownZip(livros, notas, `sprintnote-notas-${hojeArquivo()}`)
  return total
}

export type ResumoBackup = { livros: number; notas: number; tarefas: number; habitos: number; rotina: number; cartoes: number; data: string }

type Backup = ReturnType<typeof gerarBackup>

// Confere se o arquivo é um backup do SprintNote e devolve um resumo dele.
export function lerBackup(texto: string): { backup: Backup; resumo: ResumoBackup } {
  let dados: unknown
  try {
    dados = JSON.parse(texto)
  } catch {
    throw new Error("O arquivo não é um JSON válido.")
  }
  const backup = dados as Backup
  if (!backup || backup.app !== "SprintNote" || typeof backup.dados !== "object") {
    throw new Error("Esse arquivo não é um backup do SprintNote.")
  }
  const d = backup.dados
  const listas = [d.livros, d.notas, d.tarefas, d.habitos, d.rotina?.itens, d.kanban?.cartoes]
  if (!listas.every(Array.isArray)) throw new Error("O backup está incompleto ou corrompido.")
  return {
    backup,
    resumo: {
      livros: d.livros.length,
      notas: d.notas.length,
      tarefas: d.tarefas.length,
      habitos: d.habitos.length,
      rotina: d.rotina.itens.length,
      cartoes: d.kanban.cartoes?.length ?? 0,
      data: new Date(backup.exportadoEm).toLocaleString("pt-BR"),
    },
  }
}

// Substitui todos os dados atuais pelos do backup.
export function restaurarBackup(backup: Backup) {
  const d = backup.dados
  useNotas.setState({ livros: d.livros, notas: d.notas })
  useTarefas.setState({ tarefas: d.tarefas })
  useHabitos.setState({ habitos: d.habitos })
  useRotina.setState({ itens: d.rotina.itens, feitosPorDia: d.rotina.feitosPorDia ?? {} })
  // Backups antigos só tinham cartões: o quadro padrão é recriado.
  // Rafael Marques - 23/10/2026: importar um backup troca só os quadros pessoais; os de equipe continuam.
  const atual = useKanban.getState()
  const pessoais = dadosPessoais(atual)
  const novo = normalizarKanban(d.kanban)
  useKanban.setState({
    ...novo,
    quadros: [...novo.quadros, ...atual.quadros.filter((quadro) => !pessoais.quadros.includes(quadro))],
    colunas: [...novo.colunas, ...atual.colunas.filter((coluna) => !pessoais.colunas.includes(coluna))],
    cartoes: [...novo.cartoes, ...atual.cartoes.filter((cartao) => !pessoais.cartoes.includes(cartao))],
  })
}
