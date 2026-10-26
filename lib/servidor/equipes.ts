// Rafael Marques - 23/10/2026
// Equipes, convites e quadros compartilhados do Kanban (só roda no servidor).
// Toda função confere no servidor se a pessoa é membro e qual é o papel dela:
// a tela esconde botões, mas quem manda aqui é este arquivo.

import "server-only"
import { createHash, randomBytes, randomUUID } from "node:crypto"

import { banco } from "@/lib/servidor/banco"
import type { CartaoKanban, ColunaKanban, ExibicaoCartao, Prioridade } from "@/lib/tipos"
import {
  LIMITES_EQUIPE,
  type ConviteEquipe,
  type Equipe,
  type MembroEquipe,
  type OperacoesQuadro,
  type PapelConvite,
  type PapelEquipe,
  type PrevisaoConvite,
  type QuadroEquipeBaixado,
} from "@/lib/tipos-equipe"
import type { Usuario } from "@/lib/tipos-conta"

// ---------- Erros e validações ----------

export class ErroEquipe extends Error {
  constructor(
    public status: number,
    mensagem: string
  ) {
    super(mensagem)
  }
}

const formatoUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const formatoId = /^[A-Za-z0-9_-]{1,64}$/
const formatoData = /^\d{4}-\d{2}-\d{2}$/

export const ehUuid = (valor: unknown): valor is string => typeof valor === "string" && formatoUuid.test(valor)

function exigirUuid(valor: string, mensagem = "Não encontrado.") {
  if (!ehUuid(valor)) throw new ErroEquipe(404, mensagem)
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")
const nomeDe = (usuario: Usuario) => usuario.nome || usuario.email

function texto(valor: unknown, maximo: number, obrigatorio = false) {
  const limpo = typeof valor === "string" ? valor.slice(0, maximo) : ""
  if (obrigatorio && !limpo.trim()) throw new ErroEquipe(400, "Dados inválidos.")
  return limpo
}

function id(valor: unknown) {
  if (typeof valor !== "string" || !formatoId.test(valor)) throw new ErroEquipe(400, "Identificador inválido.")
  return valor
}

const lista = (valor: unknown, maximo: number) => {
  if (valor === undefined || valor === null) return []
  if (!Array.isArray(valor) || valor.length > maximo) throw new ErroEquipe(413, "Dados grandes demais.")
  return valor as unknown[]
}

const objeto = (valor: unknown) => (valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {})
const numero = (valor: unknown) => (typeof valor === "number" && Number.isFinite(valor) ? valor : 0)
const corOuNulo = (valor: unknown) => (typeof valor === "string" && valor ? valor.slice(0, 80) : null)

// ---------- Papéis ----------

export async function papelNaEquipe(equipeId: string, usuarioId: string): Promise<PapelEquipe | null> {
  if (!ehUuid(equipeId)) return null
  const [linha] = await banco()`SELECT papel FROM membros_equipe WHERE equipe_id = ${equipeId} AND usuario_id = ${usuarioId}`
  return linha ? (String(linha.papel) as PapelEquipe) : null
}

// Quem não é da equipe recebe "não encontrado" (não revela que ela existe).
export async function exigirPapel(equipeId: string, usuarioId: string, permitidos: PapelEquipe[]) {
  const papel = await papelNaEquipe(equipeId, usuarioId)
  if (!papel) throw new ErroEquipe(404, "Equipe não encontrada.")
  if (!permitidos.includes(papel)) throw new ErroEquipe(403, "Você não tem permissão para isso.")
  return papel
}

// ---------- Equipes ----------

export async function listarEquipes(usuarioId: string): Promise<Equipe[]> {
  const sql = banco()
  const minhas = await sql`
    SELECT e.id, e.nome, m.papel FROM equipes e
    JOIN membros_equipe m ON m.equipe_id = e.id
    WHERE m.usuario_id = ${usuarioId}
    ORDER BY e.criada_em
  `
  if (minhas.length === 0) return []
  const ids = minhas.map((linha) => String(linha.id))
  const [membros, quadros] = await Promise.all([
    sql`
      SELECT m.equipe_id, u.id, u.nome, u.email, u.foto, m.papel, m.entrou_em FROM membros_equipe m
      JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.equipe_id = ANY(${ids}::uuid[])
      ORDER BY m.entrou_em
    `,
    sql`SELECT id, equipe_id, titulo, icone FROM quadros_equipe WHERE equipe_id = ANY(${ids}::uuid[]) ORDER BY criado_em`,
  ])
  return minhas.map((equipe) => ({
    id: String(equipe.id),
    nome: String(equipe.nome),
    meuPapel: String(equipe.papel) as PapelEquipe,
    membros: membros
      .filter((linha) => String(linha.equipe_id) === String(equipe.id))
      .map(
        (linha): MembroEquipe => ({
          id: String(linha.id),
          nome: String(linha.nome),
          email: String(linha.email),
          foto: linha.foto ? String(linha.foto) : null,
          papel: String(linha.papel) as PapelEquipe,
          entrouEm: new Date(linha.entrou_em).toISOString(),
        })
      ),
    quadros: quadros
      .filter((linha) => String(linha.equipe_id) === String(equipe.id))
      .map((linha) => ({ id: String(linha.id), titulo: String(linha.titulo), icone: String(linha.icone) })),
  }))
}

export async function criarEquipe(usuario: Usuario, nome: string) {
  const limpo = nome.trim().replace(/\s+/g, " ")
  if (limpo.length < 1 || limpo.length > 80) throw new ErroEquipe(400, "O nome da equipe precisa ter de 1 a 80 letras.")
  const sql = banco()
  const [{ total }] = await sql`SELECT count(*)::int AS total FROM membros_equipe WHERE usuario_id = ${usuario.id} AND papel = 'dono'`
  if (Number(total) >= LIMITES_EQUIPE.equipesPorPessoa) {
    throw new ErroEquipe(409, `Você já é dono de ${LIMITES_EQUIPE.equipesPorPessoa} equipes (o máximo).`)
  }
  const [nova] = await sql`
    WITH nova AS (INSERT INTO equipes (nome, criada_por) VALUES (${limpo}, ${usuario.id}) RETURNING id),
    membro AS (INSERT INTO membros_equipe (equipe_id, usuario_id, papel) SELECT id, ${usuario.id}, 'dono' FROM nova)
    SELECT id FROM nova
  `
  return String(nova.id)
}

export async function renomearEquipe(equipeId: string, usuario: Usuario, nome: string) {
  await exigirPapel(equipeId, usuario.id, ["dono"])
  const limpo = nome.trim().replace(/\s+/g, " ")
  if (limpo.length < 1 || limpo.length > 80) throw new ErroEquipe(400, "O nome da equipe precisa ter de 1 a 80 letras.")
  await banco()`UPDATE equipes SET nome = ${limpo} WHERE id = ${equipeId}`
}

export async function excluirEquipe(equipeId: string, usuario: Usuario) {
  await exigirPapel(equipeId, usuario.id, ["dono"])
  await banco()`DELETE FROM equipes WHERE id = ${equipeId}`
}

// ---------- Membros ----------

export async function alterarPapel(equipeId: string, solicitante: Usuario, alvoId: string, papel: PapelEquipe) {
  await exigirPapel(equipeId, solicitante.id, ["dono"])
  if (!["dono", "editor", "leitor"].includes(papel)) throw new ErroEquipe(400, "Papel inválido.")
  exigirUuid(alvoId, "Pessoa não encontrada.")
  const alvo = await papelNaEquipe(equipeId, alvoId)
  if (!alvo) throw new ErroEquipe(404, "Essa pessoa não está na equipe.")
  if (alvo === "dono" && papel !== "dono") {
    const [{ donos }] = await banco()`SELECT count(*)::int AS donos FROM membros_equipe WHERE equipe_id = ${equipeId} AND papel = 'dono'`
    if (Number(donos) <= 1) throw new ErroEquipe(409, "A equipe precisa de pelo menos um dono. Torne outra pessoa dona antes.")
  }
  await banco()`UPDATE membros_equipe SET papel = ${papel} WHERE equipe_id = ${equipeId} AND usuario_id = ${alvoId}`
}

// Sair da equipe (a própria pessoa) ou remover alguém (dono).
// "anonimizar": os comentários da pessoa nesta equipe passam a mostrar "Ex-membro".
export async function removerMembro(equipeId: string, solicitante: Usuario, alvoId: string, anonimizar = false) {
  const meuPapel = await exigirPapel(equipeId, solicitante.id, ["dono", "editor", "leitor"])
  exigirUuid(alvoId, "Pessoa não encontrada.")
  if (alvoId !== solicitante.id && meuPapel !== "dono") throw new ErroEquipe(403, "Só o dono pode remover pessoas.")
  const alvo = await papelNaEquipe(equipeId, alvoId)
  if (!alvo) throw new ErroEquipe(404, "Essa pessoa não está na equipe.")
  const sql = banco()

  if (alvo === "dono") {
    const [{ donos, total }] = await sql`
      SELECT count(*) FILTER (WHERE papel = 'dono')::int AS donos, count(*)::int AS total FROM membros_equipe WHERE equipe_id = ${equipeId}
    `
    if (Number(donos) <= 1) {
      if (Number(total) > 1) throw new ErroEquipe(409, "Você é o único dono. Torne outra pessoa dona antes de sair.")
      await sql`DELETE FROM equipes WHERE id = ${equipeId}` // era a última pessoa: a equipe some
      return { equipeExcluida: true }
    }
  }

  const consultas = [
    sql`DELETE FROM membros_equipe WHERE equipe_id = ${equipeId} AND usuario_id = ${alvoId}`,
    sql`
      UPDATE cartoes_equipe SET responsavel_id = NULL
      WHERE responsavel_id = ${alvoId} AND quadro_id IN (SELECT id FROM quadros_equipe WHERE equipe_id = ${equipeId})
    `,
  ]
  if (anonimizar) {
    consultas.push(
      sql`
        UPDATE comentarios_cartao SET autor_nome = 'Ex-membro', autor_id = NULL
        WHERE autor_id = ${alvoId} AND quadro_id IN (SELECT id FROM quadros_equipe WHERE equipe_id = ${equipeId})
      `,
      sql`
        UPDATE atividade_cartao SET autor_nome = 'Ex-membro', autor_id = NULL
        WHERE autor_id = ${alvoId} AND quadro_id IN (SELECT id FROM quadros_equipe WHERE equipe_id = ${equipeId})
      `
    )
  }
  await sql.transaction(consultas)
  return { equipeExcluida: false }
}

// ---------- Convites ----------

export async function criarConvite(equipeId: string, usuario: Usuario, papel: PapelConvite, email: string | null) {
  await exigirPapel(equipeId, usuario.id, ["dono"])
  if (papel !== "editor" && papel !== "leitor") throw new ErroEquipe(400, "Papel inválido.")
  const emailLimpo = email?.trim().toLowerCase() || null
  if (emailLimpo && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo) || emailLimpo.length > 254)) {
    throw new ErroEquipe(400, "Digite um e-mail válido (ou deixe em branco).")
  }
  const sql = banco()
  const [{ pendentes }] = await sql`
    SELECT count(*)::int AS pendentes FROM convites_equipe WHERE equipe_id = ${equipeId} AND aceito_em IS NULL AND expira_em > now()
  `
  if (Number(pendentes) >= LIMITES_EQUIPE.convitesPendentes) throw new ErroEquipe(409, "Há convites demais em aberto. Cancele alguns.")

  const token = randomBytes(24).toString("base64url")
  const expira = new Date(Date.now() + LIMITES_EQUIPE.convitesDias * 24 * 60 * 60 * 1000)
  const [linha] = await sql`
    INSERT INTO convites_equipe (equipe_id, token_hash, papel, email, criado_por, expira_em)
    VALUES (${equipeId}, ${hashToken(token)}, ${papel}, ${emailLimpo}, ${usuario.id}, ${expira.toISOString()})
    RETURNING id, criado_em, expira_em
  `
  // O token aparece uma única vez, aqui: no banco fica só o hash.
  return {
    token,
    convite: {
      id: String(linha.id),
      papel,
      email: emailLimpo,
      criadoEm: new Date(linha.criado_em).toISOString(),
      expiraEm: new Date(linha.expira_em).toISOString(),
    } satisfies ConviteEquipe,
  }
}

export async function listarConvites(equipeId: string, usuario: Usuario): Promise<ConviteEquipe[]> {
  await exigirPapel(equipeId, usuario.id, ["dono"])
  const linhas = await banco()`
    SELECT id, papel, email, criado_em, expira_em FROM convites_equipe
    WHERE equipe_id = ${equipeId} AND aceito_em IS NULL AND expira_em > now()
    ORDER BY criado_em DESC
  `
  return linhas.map((linha) => ({
    id: String(linha.id),
    papel: String(linha.papel) as PapelConvite,
    email: linha.email ? String(linha.email) : null,
    criadoEm: new Date(linha.criado_em).toISOString(),
    expiraEm: new Date(linha.expira_em).toISOString(),
  }))
}

export async function revogarConvite(equipeId: string, usuario: Usuario, conviteId: string) {
  await exigirPapel(equipeId, usuario.id, ["dono"])
  exigirUuid(conviteId)
  await banco()`DELETE FROM convites_equipe WHERE id = ${conviteId} AND equipe_id = ${equipeId}`
}

export async function lerConvite(token: string): Promise<PrevisaoConvite> {
  if (!token || token.length > 100) throw new ErroEquipe(404, "Convite não encontrado.")
  const [linha] = await banco()`
    SELECT c.papel, c.email, e.nome AS equipe_nome, u.nome AS convidado_por
    FROM convites_equipe c
    JOIN equipes e ON e.id = c.equipe_id
    LEFT JOIN usuarios u ON u.id = c.criado_por
    WHERE c.token_hash = ${hashToken(token)} AND c.aceito_em IS NULL AND c.expira_em > now()
  `
  if (!linha) throw new ErroEquipe(404, "Este convite não existe, já foi usado ou expirou.")
  return {
    equipeNome: String(linha.equipe_nome),
    papel: String(linha.papel) as PapelConvite,
    convidadoPor: linha.convidado_por ? String(linha.convidado_por) : null,
    restritoAoEmail: Boolean(linha.email),
  }
}

export async function aceitarConvite(token: string, usuario: Usuario) {
  if (!token || token.length > 100) throw new ErroEquipe(404, "Convite não encontrado.")
  const sql = banco()
  const hash = hashToken(token)
  const [convite] = await sql`
    SELECT equipe_id, email FROM convites_equipe WHERE token_hash = ${hash} AND aceito_em IS NULL AND expira_em > now()
  `
  if (!convite) throw new ErroEquipe(404, "Este convite não existe, já foi usado ou expirou.")
  if (convite.email && String(convite.email) !== usuario.email.toLowerCase()) {
    throw new ErroEquipe(403, "Este convite foi feito para outro e-mail.")
  }
  const equipeId = String(convite.equipe_id)
  if (await papelNaEquipe(equipeId, usuario.id)) return { equipeId, jaEraMembro: true }

  const [{ total }] = await sql`SELECT count(*)::int AS total FROM membros_equipe WHERE equipe_id = ${equipeId}`
  if (Number(total) >= LIMITES_EQUIPE.membros) throw new ErroEquipe(409, "A equipe já está cheia.")

  // Uma instrução só: marca o convite como usado e entra na equipe (ou nada acontece).
  const [aceito] = await sql`
    WITH usado AS (
      UPDATE convites_equipe SET aceito_em = now(), aceito_por = ${usuario.id}
      WHERE token_hash = ${hash} AND aceito_em IS NULL AND expira_em > now()
      RETURNING equipe_id, papel
    ),
    entrada AS (
      INSERT INTO membros_equipe (equipe_id, usuario_id, papel)
      SELECT equipe_id, ${usuario.id}, papel FROM usado
      ON CONFLICT DO NOTHING
    )
    SELECT equipe_id FROM usado
  `
  if (!aceito) throw new ErroEquipe(404, "Este convite acabou de ser usado por outra pessoa.")
  return { equipeId, jaEraMembro: false }
}

// ---------- Quadros de equipe ----------

type LinhaQuadro = { id: string; equipe_id: string; versao: string | number; papel: string }

async function quadroDaPessoa(quadroId: string, usuarioId: string): Promise<LinhaQuadro & Record<string, unknown>> {
  if (typeof quadroId !== "string" || !formatoId.test(quadroId)) throw new ErroEquipe(404, "Quadro não encontrado.")
  const [linha] = await banco()`
    SELECT q.id, q.equipe_id, q.titulo, q.icone, q.fundo, q.exibicao, q.versao, q.criado_por, q.criado_em, q.atualizado_em,
           q.imagem_fundo_versao, (q.imagem_fundo IS NOT NULL) AS tem_imagem_fundo, m.papel
    FROM quadros_equipe q
    JOIN membros_equipe m ON m.equipe_id = q.equipe_id AND m.usuario_id = ${usuarioId}
    WHERE q.id = ${quadroId}
  `
  if (!linha) throw new ErroEquipe(404, "Quadro não encontrado.")
  return linha as LinhaQuadro & Record<string, unknown>
}

export async function criarQuadroEquipe(equipeId: string, usuario: Usuario, dados: { id?: unknown; titulo?: unknown; icone?: unknown }) {
  await exigirPapel(equipeId, usuario.id, ["dono", "editor"])
  const sql = banco()
  const [{ total }] = await sql`SELECT count(*)::int AS total FROM quadros_equipe WHERE equipe_id = ${equipeId}`
  if (Number(total) >= LIMITES_EQUIPE.quadrosPorEquipe) throw new ErroEquipe(409, "A equipe já tem quadros demais.")
  const quadroId = typeof dados.id === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(dados.id) ? dados.id : randomUUID()
  const titulo = texto(dados.titulo, 120).trim() || "Novo quadro"
  const icone = texto(dados.icone, 40).trim() || "lista"
  const criado = await sql`
    INSERT INTO quadros_equipe (id, equipe_id, titulo, icone, criado_por) VALUES (${quadroId}, ${equipeId}, ${titulo}, ${icone}, ${usuario.id})
    ON CONFLICT (id) DO NOTHING RETURNING id
  `
  if (!criado[0]) throw new ErroEquipe(409, "Já existe um quadro com esse identificador.")
  return quadroId
}

export async function excluirQuadroEquipe(quadroId: string, usuario: Usuario) {
  const quadro = await quadroDaPessoa(quadroId, usuario.id)
  if (quadro.papel !== "dono") throw new ErroEquipe(403, "Só o dono da equipe pode excluir quadros.")
  await banco()`DELETE FROM quadros_equipe WHERE id = ${quadroId}`
}

function converterCartao(
  linha: Record<string, unknown>,
  comentarios: Map<string, CartaoKanban["comentarios"]>,
  atividade: Map<string, CartaoKanban["atividade"]>
): CartaoKanban {
  const cartaoId = String(linha.id)
  return {
    id: cartaoId,
    titulo: String(linha.titulo),
    descricao: String(linha.descricao),
    colunaId: String(linha.coluna_id),
    notaId: null,
    criadoEm: new Date(linha.criado_em as string).getTime(),
    etiquetas: (linha.etiquetas as string[]) ?? [],
    prazo: linha.prazo ? String(linha.prazo) : null,
    cor: linha.cor ? String(linha.cor) : null,
    checklist: (linha.checklist as CartaoKanban["checklist"]) ?? [],
    prioridade: (linha.prioridade as Prioridade | null) ?? null,
    arquivado: Boolean(linha.arquivado),
    comentarios: comentarios.get(cartaoId) ?? [],
    atividade: atividade.get(cartaoId) ?? [],
    responsavelId: linha.responsavel_id ? String(linha.responsavel_id) : null,
    // Rafael Marques - 26/10/2026: anexos, repetição, bloqueios e estimativa.
    anexos: (linha.anexos as CartaoKanban["anexos"]) ?? [],
    recorrencia: (linha.recorrencia as CartaoKanban["recorrencia"]) ?? null,
    bloqueadoPor: (linha.bloqueado_por as string[]) ?? [],
    estimativa: linha.estimativa === null || linha.estimativa === undefined ? null : Number(linha.estimativa),
  }
}

// Quadro inteiro. Com "desde" igual à versão atual, devolve só { semMudancas } (resposta leve).
export async function baixarQuadro(
  quadroId: string,
  usuarioId: string,
  desde?: number
): Promise<QuadroEquipeBaixado | { semMudancas: true; versao: number }> {
  const quadro = await quadroDaPessoa(quadroId, usuarioId)
  const versao = Number(quadro.versao)
  if (desde !== undefined && desde === versao) return { semMudancas: true, versao }

  const sql = banco()
  const [colunas, etiquetas, cartoes, comentarios, atividade] = await Promise.all([
    sql`SELECT id, titulo, cor, limite, concluida, recolhida FROM colunas_equipe WHERE quadro_id = ${quadroId} ORDER BY ordem, id`,
    sql`SELECT id, nome, cor FROM etiquetas_equipe WHERE quadro_id = ${quadroId} ORDER BY ordem, id`,
    sql`SELECT * FROM cartoes_equipe WHERE quadro_id = ${quadroId} ORDER BY ordem, criado_em, id`,
    sql`SELECT id, cartao_id, autor_id, autor_nome, texto, criado_em FROM comentarios_cartao WHERE quadro_id = ${quadroId} ORDER BY criado_em, id`,
    sql`SELECT id, cartao_id, texto, criado_em FROM atividade_cartao WHERE quadro_id = ${quadroId} ORDER BY criado_em, id`,
  ])

  const porCartao = <T,>(linhas: Record<string, unknown>[], converter: (linha: Record<string, unknown>) => T) => {
    const mapa = new Map<string, T[]>()
    for (const linha of linhas) {
      const chave = String(linha.cartao_id)
      mapa.set(chave, [...(mapa.get(chave) ?? []), converter(linha)])
    }
    return mapa
  }
  const mapaComentarios = porCartao(comentarios, (linha) => ({
    id: String(linha.id),
    texto: String(linha.texto),
    criadoEm: new Date(linha.criado_em as string).getTime(),
    autorId: linha.autor_id ? String(linha.autor_id) : "",
    autorNome: linha.autor_id ? String(linha.autor_nome) : "Ex-membro",
  }))
  const mapaAtividade = porCartao(atividade, (linha) => ({
    id: String(linha.id),
    texto: String(linha.texto),
    criadoEm: new Date(linha.criado_em as string).getTime(),
  }))

  return {
    versao,
    meuPapel: String(quadro.papel) as PapelEquipe,
    quadro: {
      id: quadroId,
      titulo: String(quadro.titulo),
      icone: String(quadro.icone),
      fundo: quadro.fundo ? String(quadro.fundo) : null,
      // A foto vem por outro endereço (com a versão no fim, fica no cache do navegador).
      imagemFundo: quadro.tem_imagem_fundo ? `/api/quadros-equipe/${quadroId}/fundo?v=${Number(quadro.imagem_fundo_versao)}` : null,
      etiquetas: etiquetas.map((linha) => ({ id: String(linha.id), nome: String(linha.nome), cor: String(linha.cor) })),
      criadoEm: new Date(quadro.criado_em as string).getTime(),
      exibicao: (quadro.exibicao as Partial<ExibicaoCartao>) ?? {},
      equipeId: String(quadro.equipe_id),
    },
    colunas: colunas.map(
      (linha): ColunaKanban => ({
        id: String(linha.id),
        quadroId,
        titulo: String(linha.titulo),
        cor: linha.cor ? String(linha.cor) : null,
        limite: linha.limite === null ? null : Number(linha.limite),
        concluida: Boolean(linha.concluida),
        recolhida: Boolean(linha.recolhida),
      })
    ),
    cartoes: cartoes.map((linha) => converterCartao(linha, mapaComentarios, mapaAtividade)),
  }
}

// Rafael Marques - 26/10/2026: validação dos campos novos do cartão e da foto de fundo.
const formatoImagem = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/
const TAMANHO_MAXIMO_FUNDO = 650_000
const TAMANHO_MAXIMO_ANEXO = 400_000
const MAXIMO_ANEXOS = 6

function limparAnexos(valor: unknown) {
  return lista(valor, MAXIMO_ANEXOS).flatMap((item) => {
    const a = objeto(item)
    const url = typeof a.url === "string" ? a.url : ""
    const valido =
      a.tipo === "imagem" ? formatoImagem.test(url) && url.length <= TAMANHO_MAXIMO_ANEXO : a.tipo === "link" ? /^https?:\/\/[^\s]+$/i.test(url) && url.length <= 2000 : false
    if (!valido) return []
    return [{ id: texto(a.id, 64) || "anexo", tipo: a.tipo, nome: texto(a.nome, 120) || "Anexo", url, criadoEm: numero(a.criadoEm) }]
  })
}

function limparRecorrencia(valor: unknown) {
  const r = objeto(valor)
  if (r.frequencia !== "diaria" && r.frequencia !== "semanal" && r.frequencia !== "mensal" && r.frequencia !== "anual") return null
  return { frequencia: r.frequencia, intervalo: Math.min(365, Math.max(1, Math.round(numero(r.intervalo)) || 1)) }
}

// Foto de fundo de um quadro (só para quem é da equipe). Devolve o tipo e os bytes.
export async function lerFundoQuadro(quadroId: string, usuarioId: string) {
  await quadroDaPessoa(quadroId, usuarioId)
  const [linha] = await banco()`SELECT imagem_fundo FROM quadros_equipe WHERE id = ${quadroId}`
  const imagem = linha?.imagem_fundo ? String(linha.imagem_fundo) : null
  const partes = imagem ? /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(imagem) : null
  if (!partes) throw new ErroEquipe(404, "Este quadro não tem foto de fundo.")
  return { tipo: partes[1], bytes: Buffer.from(partes[2], "base64") }
}

const chavesExibicao = ["etiquetas", "prazo", "descricao", "nota", "faixaCor", "concluir", "prioridade", "comentarios"] as const

function limparExibicao(valor: unknown) {
  const origem = objeto(valor)
  const limpo: Record<string, unknown> = {}
  for (const chave of chavesExibicao) if (typeof origem[chave] === "boolean") limpo[chave] = origem[chave]
  if (origem.checklist === "oculto" || origem.checklist === "progresso" || origem.checklist === "itens") limpo.checklist = origem.checklist
  return limpo
}

// Valida e grava as mudanças do quadro numa transação só. Devolve a nova versão.
export async function aplicarOperacoes(quadroId: string, usuario: Usuario, bruto: unknown) {
  const quadro = await quadroDaPessoa(quadroId, usuario.id)
  if (quadro.papel === "leitor") throw new ErroEquipe(403, "Leitores não podem editar este quadro.")
  const ops = objeto(bruto) as OperacoesQuadro & Record<string, unknown>
  const sql = banco()
  const autor = nomeDe(usuario)
  const consultas = []

  // Só membros da equipe podem ser responsáveis por um cartão.
  const membros = await sql`SELECT usuario_id FROM membros_equipe WHERE equipe_id = ${String(quadro.equipe_id)}`
  const idsMembros = new Set(membros.map((linha) => String(linha.usuario_id)))

  // Quadro (título, ícone, fundo, aparência)
  const q = objeto(ops.quadro)
  if (Object.keys(q).length > 0) {
    const titulo = "titulo" in q ? texto(q.titulo, 120).trim() || null : null
    const icone = "icone" in q ? texto(q.icone, 40).trim() || null : null
    const mudaFundo = "fundo" in q
    const fundo = mudaFundo && typeof q.fundo === "string" && q.fundo ? q.fundo.slice(0, 600) : null
    const exibicao = "exibicao" in q ? JSON.stringify(limparExibicao(q.exibicao)) : null
    // Rafael Marques - 26/10/2026: foto de fundo (só imagem em data URL, com tamanho limitado).
    if ("imagemFundo" in q) {
      const imagem = q.imagemFundo
      if (imagem !== null && !(typeof imagem === "string" && formatoImagem.test(imagem) && imagem.length <= TAMANHO_MAXIMO_FUNDO)) {
        throw new ErroEquipe(400, "A foto de fundo é inválida ou grande demais.")
      }
      consultas.push(sql`UPDATE quadros_equipe SET imagem_fundo = ${imagem}, imagem_fundo_versao = imagem_fundo_versao + 1 WHERE id = ${quadroId}`)
    }
    consultas.push(sql`
      UPDATE quadros_equipe SET
        titulo = COALESCE(${titulo}, titulo),
        icone = COALESCE(${icone}, icone),
        fundo = CASE WHEN ${mudaFundo} THEN ${fundo} ELSE fundo END,
        exibicao = COALESCE(${exibicao}::jsonb, exibicao)
      WHERE id = ${quadroId}
    `)
  }

  // Cartões excluídos
  const cartoes = objeto(ops.cartoes)
  const cartoesExcluir = lista(cartoes.excluir, LIMITES_EQUIPE.cartoesPorQuadro).map(id)
  if (cartoesExcluir.length > 0) {
    consultas.push(sql`DELETE FROM cartoes_equipe WHERE quadro_id = ${quadroId} AND id = ANY(${cartoesExcluir}::text[])`)
  }

  // Colunas e etiquetas (gravar)
  const colunas = objeto(ops.colunas)
  const colunasGravar = lista(colunas.gravar, LIMITES_EQUIPE.colunasPorQuadro).map((item) => {
    const c = objeto(item)
    return {
      id: id(c.id),
      titulo: texto(c.titulo, 120),
      cor: corOuNulo(c.cor),
      limite: typeof c.limite === "number" && Number.isFinite(c.limite) ? Math.max(0, Math.min(999, Math.round(c.limite))) : null,
      concluida: c.concluida === true,
      recolhida: c.recolhida === true,
      ordem: numero(c.ordem),
    }
  })
  if (colunasGravar.length > 0) {
    consultas.push(sql`
      INSERT INTO colunas_equipe (quadro_id, id, titulo, cor, limite, concluida, recolhida, ordem)
      SELECT ${quadroId}, c.id, c.titulo, c.cor, c.limite, c.concluida, c.recolhida, c.ordem
      FROM jsonb_to_recordset(${JSON.stringify(colunasGravar)}::jsonb)
        AS c(id text, titulo text, cor text, limite integer, concluida boolean, recolhida boolean, ordem double precision)
      ON CONFLICT (quadro_id, id) DO UPDATE SET
        titulo = EXCLUDED.titulo, cor = EXCLUDED.cor, limite = EXCLUDED.limite,
        concluida = EXCLUDED.concluida, recolhida = EXCLUDED.recolhida, ordem = EXCLUDED.ordem
    `)
  }

  const etiquetas = objeto(ops.etiquetas)
  const etiquetasGravar = lista(etiquetas.gravar, LIMITES_EQUIPE.etiquetasPorQuadro).map((item) => {
    const e = objeto(item)
    return { id: id(e.id), nome: texto(e.nome, 60), cor: texto(e.cor, 80), ordem: numero(e.ordem) }
  })
  if (etiquetasGravar.length > 0) {
    consultas.push(sql`
      INSERT INTO etiquetas_equipe (quadro_id, id, nome, cor, ordem)
      SELECT ${quadroId}, e.id, e.nome, e.cor, e.ordem
      FROM jsonb_to_recordset(${JSON.stringify(etiquetasGravar)}::jsonb) AS e(id text, nome text, cor text, ordem double precision)
      ON CONFLICT (quadro_id, id) DO UPDATE SET nome = EXCLUDED.nome, cor = EXCLUDED.cor, ordem = EXCLUDED.ordem
    `)
  }

  // Cartões (gravar) — depois das colunas, que eles referenciam
  const cartoesGravar = lista(cartoes.gravar, LIMITES_EQUIPE.cartoesPorQuadro).map((item) => {
    const c = objeto(item)
    const prioridade = c.prioridade === "baixa" || c.prioridade === "media" || c.prioridade === "alta" ? c.prioridade : null
    const responsavel = typeof c.responsavelId === "string" && idsMembros.has(c.responsavelId) ? c.responsavelId : null
    const checklist = lista(c.checklist, 200).map((entrada) => {
      const i = objeto(entrada)
      return { id: texto(i.id, 64), texto: texto(i.texto, 300), feito: i.feito === true }
    })
    const etiquetasDoCartao = lista(c.etiquetas, LIMITES_EQUIPE.etiquetasPorQuadro).filter(
      (valor): valor is string => typeof valor === "string" && formatoId.test(valor)
    )
    return {
      id: id(c.id),
      coluna_id: id(c.colunaId),
      titulo: texto(c.titulo, 300),
      descricao: texto(c.descricao, 20000),
      ordem: numero(c.ordem),
      etiquetas: etiquetasDoCartao,
      prazo: typeof c.prazo === "string" && formatoData.test(c.prazo) ? c.prazo : null,
      cor: corOuNulo(c.cor),
      prioridade,
      arquivado: c.arquivado === true,
      checklist,
      responsavel_id: responsavel,
      // Rafael Marques - 26/10/2026
      anexos: limparAnexos(c.anexos),
      recorrencia: limparRecorrencia(c.recorrencia),
      bloqueado_por: lista(c.bloqueadoPor, 50).filter((valor): valor is string => typeof valor === "string" && formatoId.test(valor)),
      estimativa: typeof c.estimativa === "number" && Number.isFinite(c.estimativa) && c.estimativa >= 0 && c.estimativa < 1000 ? c.estimativa : null,
    }
  })
  if (cartoesGravar.length > 0) {
    consultas.push(sql`
      INSERT INTO cartoes_equipe
        (quadro_id, id, coluna_id, titulo, descricao, ordem, etiquetas, prazo, cor, prioridade, arquivado, checklist, responsavel_id, criado_por,
         anexos, recorrencia, bloqueado_por, estimativa)
      SELECT ${quadroId}, c.id, c.coluna_id, c.titulo, c.descricao, c.ordem, c.etiquetas, c.prazo, c.cor, c.prioridade,
             c.arquivado, c.checklist, c.responsavel_id, ${usuario.id}::uuid,
             COALESCE(c.anexos, '[]'::jsonb), c.recorrencia, COALESCE(c.bloqueado_por, '[]'::jsonb), c.estimativa
      FROM jsonb_to_recordset(${JSON.stringify(cartoesGravar)}::jsonb)
        AS c(id text, coluna_id text, titulo text, descricao text, ordem double precision, etiquetas jsonb, prazo text, cor text,
             prioridade text, arquivado boolean, checklist jsonb, responsavel_id uuid,
             anexos jsonb, recorrencia jsonb, bloqueado_por jsonb, estimativa double precision)
      ON CONFLICT (quadro_id, id) DO UPDATE SET
        coluna_id = EXCLUDED.coluna_id, titulo = EXCLUDED.titulo, descricao = EXCLUDED.descricao, ordem = EXCLUDED.ordem,
        etiquetas = EXCLUDED.etiquetas, prazo = EXCLUDED.prazo, cor = EXCLUDED.cor, prioridade = EXCLUDED.prioridade,
        arquivado = EXCLUDED.arquivado, checklist = EXCLUDED.checklist, responsavel_id = EXCLUDED.responsavel_id,
        anexos = EXCLUDED.anexos, recorrencia = EXCLUDED.recorrencia, bloqueado_por = EXCLUDED.bloqueado_por, estimativa = EXCLUDED.estimativa,
        atualizado_em = now()
    `)
  }

  // Comentários e histórico: o autor é sempre quem está logado, nunca o que veio no pedido.
  const comentarios = objeto(ops.comentarios)
  const comentariosInserir = lista(comentarios.inserir, 200).map((item) => {
    const c = objeto(item)
    return { id: id(c.id), cartao_id: id(c.cartaoId), texto: texto(c.texto, 4000, true).trim() }
  })
  if (comentariosInserir.length > 0) {
    consultas.push(sql`
      INSERT INTO comentarios_cartao (quadro_id, id, cartao_id, autor_id, autor_nome, texto)
      SELECT ${quadroId}, c.id, c.cartao_id, ${usuario.id}::uuid, ${autor}, c.texto
      FROM jsonb_to_recordset(${JSON.stringify(comentariosInserir)}::jsonb) AS c(id text, cartao_id text, texto text)
      WHERE EXISTS (SELECT 1 FROM cartoes_equipe k WHERE k.quadro_id = ${quadroId} AND k.id = c.cartao_id)
      ON CONFLICT DO NOTHING
    `)
  }
  const comentariosExcluir = lista(comentarios.excluir, 200).map(id)
  if (comentariosExcluir.length > 0) {
    // Cada pessoa apaga o que escreveu; o dono da equipe apaga qualquer um.
    consultas.push(sql`
      DELETE FROM comentarios_cartao WHERE quadro_id = ${quadroId} AND id = ANY(${comentariosExcluir}::text[])
        AND (autor_id = ${usuario.id} OR ${quadro.papel === "dono"})
    `)
  }
  const atividade = objeto(ops.atividade)
  const atividadeInserir = lista(atividade.inserir, 500).map((item) => {
    const a = objeto(item)
    return { id: id(a.id), cartao_id: id(a.cartaoId), texto: texto(a.texto, 300, true).trim() }
  })
  if (atividadeInserir.length > 0) {
    consultas.push(sql`
      INSERT INTO atividade_cartao (quadro_id, id, cartao_id, autor_id, autor_nome, texto)
      SELECT ${quadroId}, a.id, a.cartao_id, ${usuario.id}::uuid, ${autor}, a.texto
      FROM jsonb_to_recordset(${JSON.stringify(atividadeInserir)}::jsonb) AS a(id text, cartao_id text, texto text)
      WHERE EXISTS (SELECT 1 FROM cartoes_equipe k WHERE k.quadro_id = ${quadroId} AND k.id = a.cartao_id)
      ON CONFLICT DO NOTHING
    `)
  }

  // Etiquetas e colunas excluídas (por último: os cartões já foram movidos)
  const etiquetasExcluir = lista(etiquetas.excluir, LIMITES_EQUIPE.etiquetasPorQuadro).map(id)
  if (etiquetasExcluir.length > 0) {
    consultas.push(sql`DELETE FROM etiquetas_equipe WHERE quadro_id = ${quadroId} AND id = ANY(${etiquetasExcluir}::text[])`)
  }
  const colunasExcluir = lista(colunas.excluir, LIMITES_EQUIPE.colunasPorQuadro).map(id)
  if (colunasExcluir.length > 0) {
    consultas.push(sql`DELETE FROM colunas_equipe WHERE quadro_id = ${quadroId} AND id = ANY(${colunasExcluir}::text[])`)
  }

  if (consultas.length === 0) return { versao: Number(quadro.versao) }
  consultas.push(sql`UPDATE quadros_equipe SET versao = versao + 1, atualizado_em = now() WHERE id = ${quadroId} RETURNING versao`)

  try {
    const resultados = await sql.transaction(consultas)
    const ultimo = resultados[resultados.length - 1] as Record<string, unknown>[]
    return { versao: Number(ultimo[0].versao) }
  } catch (erro) {
    // Violação de chave (ex.: coluna apagada por outra pessoa no meio tempo): o navegador recarrega o quadro.
    console.error("Erro ao gravar o quadro de equipe:", erro)
    throw new ErroEquipe(409, "O quadro mudou enquanto você editava. Recarregamos a versão mais recente.")
  }
}

// ---------- Foto de perfil ----------

const formatoFoto = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/
const TAMANHO_MAXIMO_FOTO = 80_000

export async function salvarFoto(usuarioId: string, foto: unknown) {
  if (foto === null) {
    await banco()`UPDATE usuarios SET foto = NULL WHERE id = ${usuarioId}`
    return
  }
  if (typeof foto !== "string" || foto.length > TAMANHO_MAXIMO_FOTO || !formatoFoto.test(foto)) {
    throw new ErroEquipe(400, "Imagem inválida ou grande demais.")
  }
  await banco()`UPDATE usuarios SET foto = ${foto} WHERE id = ${usuarioId}`
}

export async function lerFoto(usuarioId: string) {
  const [linha] = await banco()`SELECT foto FROM usuarios WHERE id = ${usuarioId}`
  return linha?.foto ? String(linha.foto) : null
}

// ---------- LGPD: exclusão da conta e exportação ----------

// Enquanto a migração das equipes (db/002-equipes.sql) não foi aplicada, as tabelas não
// existem: a exclusão de conta e a exportação continuam funcionando sem elas.
function semTabelasDeEquipe(erro: unknown) {
  const codigo = (erro as { code?: string } | null)?.code
  return codigo === "42P01" || codigo === "42703"
}

// Antes de apagar a conta: passa a propriedade das equipes para outra pessoa
// (ou apaga a equipe, se a pessoa era a única) e anonimiza os comentários.
export async function prepararExclusaoDaConta(usuarioId: string) {
  try {
    await passarPropriedadeEAnonimizar(usuarioId)
  } catch (erro) {
    if (!semTabelasDeEquipe(erro)) throw erro
  }
}

async function passarPropriedadeEAnonimizar(usuarioId: string) {
  const sql = banco()
  const donas = await sql`
    SELECT m.equipe_id FROM membros_equipe m
    WHERE m.usuario_id = ${usuarioId} AND m.papel = 'dono'
      AND NOT EXISTS (SELECT 1 FROM membros_equipe o WHERE o.equipe_id = m.equipe_id AND o.papel = 'dono' AND o.usuario_id <> ${usuarioId})
  `
  for (const { equipe_id: equipeId } of donas) {
    const [proximo] = await sql`
      SELECT usuario_id FROM membros_equipe WHERE equipe_id = ${equipeId} AND usuario_id <> ${usuarioId}
      ORDER BY (papel = 'editor') DESC, entrou_em LIMIT 1
    `
    if (proximo) await sql`UPDATE membros_equipe SET papel = 'dono' WHERE equipe_id = ${equipeId} AND usuario_id = ${proximo.usuario_id}`
    else await sql`DELETE FROM equipes WHERE id = ${equipeId}`
  }
  await sql.transaction([
    sql`UPDATE comentarios_cartao SET autor_nome = 'Ex-membro', autor_id = NULL WHERE autor_id = ${usuarioId}`,
    sql`UPDATE atividade_cartao SET autor_nome = 'Ex-membro', autor_id = NULL WHERE autor_id = ${usuarioId}`,
  ])
}

// O que as equipes guardam sobre a pessoa (acesso e portabilidade, Art. 18).
export async function dadosDeEquipesDaPessoa(usuarioId: string) {
  try {
    return await lerDadosDeEquipes(usuarioId)
  } catch (erro) {
    if (!semTabelasDeEquipe(erro)) throw erro
    return { foto: null, equipes: [], comentariosEscritos: [], cartoesAtribuidosAMim: [] }
  }
}

async function lerDadosDeEquipes(usuarioId: string) {
  const sql = banco()
  const [conta] = await sql`SELECT foto FROM usuarios WHERE id = ${usuarioId}`
  const [equipes, comentarios, atribuidos] = await Promise.all([
    sql`
      SELECT e.id, e.nome, m.papel, m.entrou_em FROM membros_equipe m JOIN equipes e ON e.id = m.equipe_id
      WHERE m.usuario_id = ${usuarioId} ORDER BY m.entrou_em
    `,
    sql`
      SELECT c.id, c.quadro_id, c.cartao_id, c.texto, c.criado_em FROM comentarios_cartao c WHERE c.autor_id = ${usuarioId} ORDER BY c.criado_em
    `,
    sql`
      SELECT k.id, k.quadro_id, k.titulo, k.prazo, k.prioridade FROM cartoes_equipe k WHERE k.responsavel_id = ${usuarioId} ORDER BY k.criado_em
    `,
  ])
  return { foto: conta?.foto ? String(conta.foto) : null, equipes, comentariosEscritos: comentarios, cartoesAtribuidosAMim: atribuidos }
}
