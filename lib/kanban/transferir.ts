// Rafael Marques - 26/10/2026
// Levar um quadro do Kanban para outro lugar (arquivo .json ou planilha .csv) e trazer de volta.
// Ao importar nada é confiado: tudo é conferido, limitado e ganha ids novos (nunca sobrescreve
// quadros existentes). Funções puras (rodam em Node: veja transferir.teste.ts).

import type { AnexoCartao, CartaoKanban, ColunaKanban, EtiquetaKanban, ItemChecklist, Prioridade, QuadroKanban } from "@/lib/tipos"

export const FORMATO_QUADRO = "sprintnote-quadro"

export type ArquivoQuadro = {
  formato: typeof FORMATO_QUADRO
  versao: 1
  exportadoEm: string
  quadro: { titulo: string; icone: string; fundo: string | null; etiquetas: EtiquetaKanban[]; exibicao?: QuadroKanban["exibicao"] }
  colunas: Omit<ColunaKanban, "quadroId">[]
  cartoes: Partial<CartaoKanban>[]
}

const LIMITES = { colunas: 40, cartoes: 3000, etiquetas: 60, texto: 20000, titulo: 300, checklist: 200, anexos: 12 }

// Cópia do objeto sem as chaves indicadas.
function omitir<T extends object>(objeto: T, chaves: string[]): Partial<T> {
  return Object.fromEntries(Object.entries(objeto).filter(([chave]) => !chaves.includes(chave))) as Partial<T>
}

export function exportarQuadro(quadro: QuadroKanban, colunas: ColunaKanban[], cartoes: CartaoKanban[], agora = new Date()): ArquivoQuadro {
  const idsColunas = new Set(colunas.map((coluna) => coluna.id))
  return {
    formato: FORMATO_QUADRO,
    versao: 1,
    exportadoEm: agora.toISOString(),
    quadro: { titulo: quadro.titulo, icone: quadro.icone, fundo: quadro.fundo, etiquetas: quadro.etiquetas, exibicao: quadro.exibicao },
    colunas: colunas.map((coluna) => omitir(coluna, ["quadroId"]) as Omit<ColunaKanban, "quadroId">),
    // Comentários e histórico ficam de fora: citam pessoas (dados pessoais) que não vão junto com o quadro.
    cartoes: cartoes
      .filter((cartao) => idsColunas.has(cartao.colunaId))
      .map((cartao) => omitir(cartao, ["comentarios", "atividade", "responsavelId", "notaId"])),
  }
}

const aspas = (valor: string) => `"${valor.replace(/"/g, '""')}"`

// Planilha para abrir no Excel/Sheets: uma linha por cartão (com BOM para os acentos aparecerem certos).
export function quadroParaCsv(colunas: ColunaKanban[], cartoes: CartaoKanban[], etiquetas: EtiquetaKanban[]) {
  const cabecalho = ["Título", "Coluna", "Prioridade", "Prazo", "Etiquetas", "Estimativa", "Checklist", "Descrição", "Arquivado"]
  const linhas = cartoes.map((cartao) => {
    const coluna = colunas.find((item) => item.id === cartao.colunaId)?.titulo ?? ""
    const nomes = cartao.etiquetas.map((id) => etiquetas.find((etiqueta) => etiqueta.id === id)?.nome).filter(Boolean).join("; ")
    const feitos = cartao.checklist.filter((item) => item.feito).length
    return [
      cartao.titulo,
      coluna,
      cartao.prioridade ?? "",
      cartao.prazo ?? "",
      nomes,
      cartao.estimativa === null || cartao.estimativa === undefined ? "" : String(cartao.estimativa),
      cartao.checklist.length ? `${feitos}/${cartao.checklist.length}` : "",
      cartao.descricao,
      cartao.arquivado ? "sim" : "não",
    ]
      // Texto que começa com = + - @ vira fórmula na planilha: o apóstrofo evita isso.
      .map((valor) => aspas(/^[=+\-@]/.test(valor) ? `'${valor}` : valor))
      .join(",")
  })
  return `﻿${[cabecalho.map(aspas).join(","), ...linhas].join("\r\n")}`
}

const texto = (valor: unknown, maximo: number, padrao = "") => (typeof valor === "string" ? valor.slice(0, maximo) : padrao)
const prioridades: Prioridade[] = ["baixa", "media", "alta"]
const ehPrazo = (valor: unknown): valor is string => typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)

export type QuadroLido = { quadro: QuadroKanban; colunas: ColunaKanban[]; cartoes: CartaoKanban[] }

// Lê o texto de um arquivo .json de quadro. Devolve o quadro pronto (ids novos) ou o motivo do erro.
export function lerQuadroImportado(
  conteudo: string,
  novoId: () => string,
  completarCartao: (cartao: Pick<CartaoKanban, "id" | "titulo" | "colunaId"> & Partial<CartaoKanban>) => CartaoKanban,
  agora = Date.now()
): QuadroLido | { erro: string } {
  let bruto: unknown
  try {
    bruto = JSON.parse(conteudo)
  } catch {
    return { erro: "O arquivo não é um quadro do SprintNote (não consegui ler)." }
  }
  const arquivo = bruto as Partial<ArquivoQuadro> | null
  if (!arquivo || typeof arquivo !== "object" || arquivo.formato !== FORMATO_QUADRO || !arquivo.quadro || !Array.isArray(arquivo.colunas)) {
    return { erro: "Este arquivo não parece um quadro exportado pelo SprintNote." }
  }
  if (arquivo.colunas.length === 0) return { erro: "O quadro do arquivo não tem colunas." }

  const mapaEtiquetas = new Map<string, string>()
  const etiquetas: EtiquetaKanban[] = (Array.isArray(arquivo.quadro.etiquetas) ? arquivo.quadro.etiquetas : []).slice(0, LIMITES.etiquetas).flatMap((etiqueta) => {
    if (!etiqueta || typeof etiqueta.id !== "string") return []
    const id = novoId()
    mapaEtiquetas.set(etiqueta.id, id)
    return [{ id, nome: texto(etiqueta.nome, 60, "Etiqueta"), cor: texto(etiqueta.cor, 80, "oklch(0.6 0.01 260)") }]
  })

  const quadro: QuadroKanban = {
    id: novoId(),
    titulo: texto(arquivo.quadro.titulo, 120, "Quadro importado") || "Quadro importado",
    icone: texto(arquivo.quadro.icone, 40, "lista") || "lista",
    fundo: typeof arquivo.quadro.fundo === "string" ? arquivo.quadro.fundo.slice(0, 600) : null,
    etiquetas,
    criadoEm: agora,
    ...(arquivo.quadro.exibicao && typeof arquivo.quadro.exibicao === "object" ? { exibicao: arquivo.quadro.exibicao } : {}),
  }

  const mapaColunas = new Map<string, string>()
  const colunas: ColunaKanban[] = arquivo.colunas.slice(0, LIMITES.colunas).flatMap((coluna) => {
    if (!coluna || typeof coluna.id !== "string") return []
    const id = novoId()
    mapaColunas.set(coluna.id, id)
    return [
      {
        id,
        quadroId: quadro.id,
        titulo: texto(coluna.titulo, 120, "Coluna") || "Coluna",
        cor: typeof coluna.cor === "string" ? coluna.cor.slice(0, 80) : null,
        limite: typeof coluna.limite === "number" && coluna.limite > 0 && coluna.limite < 1000 ? Math.round(coluna.limite) : null,
        concluida: coluna.concluida === true,
        recolhida: coluna.recolhida === true,
      },
    ]
  })
  if (colunas.length === 0) return { erro: "O quadro do arquivo não tem colunas válidas." }

  const cartoes: CartaoKanban[] = []
  for (const bruta of (Array.isArray(arquivo.cartoes) ? arquivo.cartoes : []).slice(0, LIMITES.cartoes)) {
    if (!bruta || typeof bruta !== "object") continue
    const colunaId = typeof bruta.colunaId === "string" ? mapaColunas.get(bruta.colunaId) : undefined
    if (!colunaId) continue
    const checklist: ItemChecklist[] = (Array.isArray(bruta.checklist) ? bruta.checklist : []).slice(0, LIMITES.checklist).map((item) => ({
      id: novoId(),
      texto: texto(item?.texto, 300),
      feito: item?.feito === true,
    }))
    const anexos: AnexoCartao[] = (Array.isArray(bruta.anexos) ? bruta.anexos : []).slice(0, LIMITES.anexos).flatMap((anexo) => {
      if (!anexo || (anexo.tipo !== "imagem" && anexo.tipo !== "link") || typeof anexo.url !== "string") return []
      // Só imagens em data:image e links http(s): nada que execute código.
      const seguro = anexo.tipo === "imagem" ? /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(anexo.url) : /^https?:\/\//i.test(anexo.url)
      return seguro ? [{ id: novoId(), tipo: anexo.tipo, nome: texto(anexo.nome, 120, "Anexo"), url: anexo.url.slice(0, 700_000), criadoEm: agora }] : []
    })
    cartoes.push(
      completarCartao({
        id: novoId(),
        titulo: texto(bruta.titulo, LIMITES.titulo, "Cartão") || "Cartão",
        descricao: texto(bruta.descricao, LIMITES.texto),
        colunaId,
        criadoEm: agora,
        etiquetas: (Array.isArray(bruta.etiquetas) ? bruta.etiquetas : []).map((id) => mapaEtiquetas.get(String(id))).filter((id): id is string => Boolean(id)),
        prazo: ehPrazo(bruta.prazo) ? bruta.prazo : null,
        cor: typeof bruta.cor === "string" ? bruta.cor.slice(0, 80) : null,
        checklist,
        prioridade: prioridades.includes(bruta.prioridade as Prioridade) ? (bruta.prioridade as Prioridade) : null,
        arquivado: bruta.arquivado === true,
        anexos,
        recorrencia:
          bruta.recorrencia && ["diaria", "semanal", "mensal", "anual"].includes(String(bruta.recorrencia.frequencia)) && typeof bruta.recorrencia.intervalo === "number"
            ? { frequencia: bruta.recorrencia.frequencia, intervalo: Math.min(365, Math.max(1, Math.round(bruta.recorrencia.intervalo))) }
            : null,
        estimativa: typeof bruta.estimativa === "number" && bruta.estimativa >= 0 && bruta.estimativa < 10000 ? bruta.estimativa : null,
      })
    )
  }
  return { quadro, colunas, cartoes }
}
