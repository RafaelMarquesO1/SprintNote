// Rafael Marques - 23/10/2026
// Compara o quadro de equipe da tela com a última versão que o servidor
// confirmou e monta só as operações do que mudou (veja OperacoesQuadro).
// Funções puras: não mexem em estado nem na rede.

import type { CartaoKanban, ColunaKanban, QuadroKanban } from "@/lib/tipos"
import type { CartaoGravar, OperacoesQuadro } from "@/lib/tipos-equipe"

// Tudo o que pertence a um quadro, na ordem em que aparece.
export type FotoQuadro = { quadro: QuadroKanban; colunas: ColunaKanban[]; cartoes: CartaoKanban[] }

type Estado = { quadros: QuadroKanban[]; colunas: ColunaKanban[]; cartoes: CartaoKanban[] }

export function fotografarQuadro(quadroId: string, estado: Estado): FotoQuadro | null {
  const quadro = estado.quadros.find((item) => item.id === quadroId)
  if (!quadro) return null
  const colunas = estado.colunas.filter((coluna) => coluna.quadroId === quadroId)
  const ids = new Set(colunas.map((coluna) => coluna.id))
  return { quadro, colunas, cartoes: estado.cartoes.filter((cartao) => ids.has(cartao.colunaId)) }
}

export const clonarFoto = (foto: FotoQuadro): FotoQuadro => structuredClone(foto)

const chaveColuna = (coluna: ColunaKanban, ordem: number) =>
  JSON.stringify([coluna.titulo, coluna.cor, coluna.limite, coluna.concluida, coluna.recolhida, ordem])

const chaveCartao = (cartao: CartaoKanban, ordem: number) =>
  JSON.stringify([
    cartao.titulo,
    cartao.descricao,
    cartao.colunaId,
    cartao.etiquetas,
    cartao.prazo,
    cartao.cor,
    cartao.checklist,
    cartao.prioridade,
    cartao.arquivado,
    cartao.responsavelId,
    // Rafael Marques - 26/10/2026: anexos (pelos ids), repetição, bloqueios e estimativa.
    cartao.anexos.map((anexo) => anexo.id),
    cartao.recorrencia,
    cartao.bloqueadoPor,
    cartao.estimativa,
    ordem,
  ])

function paraGravar(cartao: CartaoKanban, ordem: number): CartaoGravar & { ordem: number } {
  return {
    id: cartao.id,
    titulo: cartao.titulo,
    descricao: cartao.descricao,
    colunaId: cartao.colunaId,
    etiquetas: cartao.etiquetas,
    prazo: cartao.prazo,
    cor: cartao.cor,
    checklist: cartao.checklist,
    prioridade: cartao.prioridade,
    arquivado: cartao.arquivado,
    responsavelId: cartao.responsavelId,
    anexos: cartao.anexos,
    recorrencia: cartao.recorrencia,
    bloqueadoPor: cartao.bloqueadoPor,
    estimativa: cartao.estimativa,
    ordem,
  }
}

// null = nada mudou.
export function calcularOperacoes(base: FotoQuadro, atual: FotoQuadro): OperacoesQuadro | null {
  const ops: OperacoesQuadro = {}

  // Quadro: título, ícone, fundo e aparência dos cartões.
  const q: NonNullable<OperacoesQuadro["quadro"]> = {}
  if (atual.quadro.titulo !== base.quadro.titulo) q.titulo = atual.quadro.titulo
  if (atual.quadro.icone !== base.quadro.icone) q.icone = atual.quadro.icone
  if (atual.quadro.fundo !== base.quadro.fundo) q.fundo = atual.quadro.fundo
  // Foto de fundo: só vai quando é nova (data URL) ou foi removida; o endereço que vem do servidor não volta.
  const imagemAtual = atual.quadro.imagemFundo ?? null
  if (imagemAtual !== (base.quadro.imagemFundo ?? null) && (imagemAtual === null || imagemAtual.startsWith("data:"))) q.imagemFundo = imagemAtual
  if (JSON.stringify(atual.quadro.exibicao ?? {}) !== JSON.stringify(base.quadro.exibicao ?? {})) q.exibicao = atual.quadro.exibicao ?? {}
  if (Object.keys(q).length > 0) ops.quadro = q

  // Colunas
  const colunasBase = new Map(base.colunas.map((coluna, indice) => [coluna.id, chaveColuna(coluna, indice)]))
  const colunasGravar = atual.colunas
    .map((coluna, indice) => ({ ...coluna, ordem: indice }))
    .filter((coluna) => colunasBase.get(coluna.id) !== chaveColuna(coluna, coluna.ordem))
  const colunasAtuais = new Set(atual.colunas.map((coluna) => coluna.id))
  const colunasExcluir = base.colunas.filter((coluna) => !colunasAtuais.has(coluna.id)).map((coluna) => coluna.id)
  if (colunasGravar.length > 0 || colunasExcluir.length > 0) ops.colunas = { gravar: colunasGravar, excluir: colunasExcluir }

  // Etiquetas
  const etiquetasBase = new Map(base.quadro.etiquetas.map((etiqueta, indice) => [etiqueta.id, JSON.stringify([etiqueta.nome, etiqueta.cor, indice])]))
  const etiquetasGravar = atual.quadro.etiquetas
    .map((etiqueta, indice) => ({ ...etiqueta, ordem: indice }))
    .filter((etiqueta) => etiquetasBase.get(etiqueta.id) !== JSON.stringify([etiqueta.nome, etiqueta.cor, etiqueta.ordem]))
  const etiquetasAtuais = new Set(atual.quadro.etiquetas.map((etiqueta) => etiqueta.id))
  const etiquetasExcluir = base.quadro.etiquetas.filter((etiqueta) => !etiquetasAtuais.has(etiqueta.id)).map((etiqueta) => etiqueta.id)
  if (etiquetasGravar.length > 0 || etiquetasExcluir.length > 0) ops.etiquetas = { gravar: etiquetasGravar, excluir: etiquetasExcluir }

  // Cartões
  const cartoesBase = new Map(base.cartoes.map((cartao, indice) => [cartao.id, chaveCartao(cartao, indice)]))
  const cartoesGravar = atual.cartoes
    .map((cartao, indice) => ({ cartao, indice }))
    .filter(({ cartao, indice }) => cartoesBase.get(cartao.id) !== chaveCartao(cartao, indice))
    .map(({ cartao, indice }) => paraGravar(cartao, indice))
  const cartoesAtuais = new Set(atual.cartoes.map((cartao) => cartao.id))
  const cartoesExcluir = base.cartoes.filter((cartao) => !cartoesAtuais.has(cartao.id)).map((cartao) => cartao.id)
  if (cartoesGravar.length > 0 || cartoesExcluir.length > 0) ops.cartoes = { gravar: cartoesGravar, excluir: cartoesExcluir }

  // Comentários e histórico: só entram coisas novas (o histórico nunca é apagado pela tela).
  const baseDoCartao = new Map(base.cartoes.map((cartao) => [cartao.id, cartao]))
  const comentariosInserir: { id: string; cartaoId: string; texto: string }[] = []
  const comentariosExcluir: string[] = []
  const atividadeInserir: { id: string; cartaoId: string; texto: string }[] = []
  for (const cartao of atual.cartoes) {
    const anterior = baseDoCartao.get(cartao.id)
    const comentariosAntes = new Set(anterior?.comentarios.map((comentario) => comentario.id))
    const atividadeAntes = new Set(anterior?.atividade.map((item) => item.id))
    const comentariosAgora = new Set(cartao.comentarios.map((comentario) => comentario.id))
    for (const comentario of cartao.comentarios) {
      if (!comentariosAntes.has(comentario.id)) comentariosInserir.push({ id: comentario.id, cartaoId: cartao.id, texto: comentario.texto })
    }
    for (const comentario of anterior?.comentarios ?? []) if (!comentariosAgora.has(comentario.id)) comentariosExcluir.push(comentario.id)
    for (const item of cartao.atividade) {
      if (!atividadeAntes.has(item.id)) atividadeInserir.push({ id: item.id, cartaoId: cartao.id, texto: item.texto })
    }
  }
  if (comentariosInserir.length > 0 || comentariosExcluir.length > 0) ops.comentarios = { inserir: comentariosInserir, excluir: comentariosExcluir }
  if (atividadeInserir.length > 0) ops.atividade = { inserir: atividadeInserir }

  return Object.keys(ops).length > 0 ? ops : null
}
