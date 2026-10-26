// Rafael Marques - 23/10/2026
// Mantém os quadros de equipe da tela iguais aos do servidor:
//  - baixa as equipes e os quadros ao entrar e confere por versão a cada poucos segundos;
//  - quando a pessoa edita, compara com a última versão do servidor e manda só o que mudou;
//  - se o servidor recusar (ex.: leitor, quadro mudou), a tela volta para a versão do servidor.
// Os quadros ficam na mesma lista do Kanban pessoal (useKanban), marcados com equipeId.

import { chamarApi, ErroApi, mensagemDoErro } from "@/lib/equipes/api"
import { calcularOperacoes, clonarFoto, fotografarQuadro, type FotoQuadro } from "@/lib/equipes/diferenca"
import { definirAvisoEquipe, useEquipes } from "@/lib/estado/equipes"
import { colunasPadrao, ganchosEquipe, novoQuadro, useKanban } from "@/lib/estado/kanban"
import { usePreferencias } from "@/lib/estado/preferencias"
import type { QuadroKanban } from "@/lib/tipos"
import type { Equipe, OperacoesQuadro, PapelEquipe, QuadroEquipeBaixado } from "@/lib/tipos-equipe"

const ESPERA_ENVIO = 600
const ESPERA_NOVA_TENTATIVA = 5000
const INTERVALO_ATUALIZACAO = 6000
// A lista de equipes (membros, quadros novos) é conferida a cada N ciclos.
const CICLOS_ATE_LISTA = 5

type Base = { versao: number; foto: FotoQuadro }

// Última versão confirmada pelo servidor, por quadro.
const bases = new Map<string, Base>()
const temporizadores = new Map<string, ReturnType<typeof setTimeout>>()
const emEnvio = new Set<string>()
let ativa = false

const estadoKanban = () => {
  const { quadros, colunas, cartoes } = useKanban.getState()
  return { quadros, colunas, cartoes }
}

function definirPapel(quadroId: string, papel: PapelEquipe) {
  useEquipes.setState((estado) => ({ papelDoQuadro: { ...estado.papelDoQuadro, [quadroId]: papel } }))
}

function pendente(quadroId: string) {
  const base = bases.get(quadroId)
  const atual = fotografarQuadro(quadroId, estadoKanban())
  return Boolean(base && atual && calcularOperacoes(base.foto, atual))
}

// Coloca o quadro do servidor na tela (no lugar do que havia).
function aplicarQuadro(baixado: QuadroEquipeBaixado) {
  const id = baixado.quadro.id
  useKanban.setState((estado) => {
    const antigas = new Set(estado.colunas.filter((coluna) => coluna.quadroId === id).map((coluna) => coluna.id))
    return {
      quadros: estado.quadros.some((quadro) => quadro.id === id)
        ? estado.quadros.map((quadro) => (quadro.id === id ? baixado.quadro : quadro))
        : [...estado.quadros, baixado.quadro],
      colunas: [...estado.colunas.filter((coluna) => coluna.quadroId !== id), ...baixado.colunas],
      cartoes: [...estado.cartoes.filter((cartao) => !antigas.has(cartao.colunaId)), ...baixado.cartoes],
    }
  })
  bases.set(id, { versao: baixado.versao, foto: clonarFoto({ quadro: baixado.quadro, colunas: baixado.colunas, cartoes: baixado.cartoes }) })
  definirPapel(id, baixado.meuPapel)
}

// Tira o quadro da tela (saiu da equipe, quadro excluído...).
function removerQuadroLocal(quadroId: string) {
  bases.delete(quadroId)
  clearTimeout(temporizadores.get(quadroId))
  temporizadores.delete(quadroId)
  useKanban.setState((estado) => {
    const colunas = new Set(estado.colunas.filter((coluna) => coluna.quadroId === quadroId).map((coluna) => coluna.id))
    const quadros = estado.quadros.filter((quadro) => quadro.id !== quadroId)
    return {
      quadros,
      colunas: estado.colunas.filter((coluna) => coluna.quadroId !== quadroId),
      cartoes: estado.cartoes.filter((cartao) => !colunas.has(cartao.colunaId)),
      quadroAtivoId: estado.quadroAtivoId === quadroId ? (quadros[0]?.id ?? null) : estado.quadroAtivoId,
    }
  })
}

async function recarregarQuadro(quadroId: string) {
  try {
    const resposta = await chamarApi<QuadroEquipeBaixado | { semMudancas: true }>(`/api/quadros-equipe/${quadroId}`)
    if (!("semMudancas" in resposta)) aplicarQuadro(resposta)
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) removerQuadroLocal(quadroId)
  }
}

function agendar(quadroId: string, espera = ESPERA_ENVIO) {
  clearTimeout(temporizadores.get(quadroId))
  temporizadores.set(
    quadroId,
    setTimeout(() => {
      temporizadores.delete(quadroId)
      void enviar(quadroId)
    }, espera)
  )
}

async function enviar(quadroId: string) {
  const base = bases.get(quadroId)
  const atual = fotografarQuadro(quadroId, estadoKanban())
  if (!ativa || !base || !atual) return
  const ops: OperacoesQuadro | null = calcularOperacoes(base.foto, atual)
  if (!ops) return

  // Leitores não gravam: a tela volta para o que está no servidor.
  if (useEquipes.getState().papelDoQuadro[quadroId] === "leitor") {
    definirAvisoEquipe("Você é leitor nesta equipe: o que você mudou não é salvo.")
    aplicarQuadro({ ...clonarFoto(base.foto), versao: base.versao, meuPapel: "leitor" })
    return
  }
  if (emEnvio.has(quadroId)) return agendar(quadroId)

  emEnvio.add(quadroId)
  const enviada = clonarFoto(atual)
  try {
    const { versao } = await chamarApi<{ versao: number }>(`/api/quadros-equipe/${quadroId}/operacoes`, { metodo: "POST", corpo: ops })
    // Se a versão subiu mais de 1, outra pessoa gravou no meio: mantemos a antiga para o
    // próximo ciclo baixar o quadro completo (com as mudanças dela e as nossas).
    bases.set(quadroId, { versao: versao === base.versao + 1 ? versao : base.versao, foto: enviada })
    definirAvisoEquipe(null)
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status > 0 && erro.status < 500) {
      definirAvisoEquipe(erro.message)
      emEnvio.delete(quadroId)
      await recarregarQuadro(quadroId)
      return
    }
    agendar(quadroId, ESPERA_NOVA_TENTATIVA)
  } finally {
    emEnvio.delete(quadroId)
  }
  if (pendente(quadroId)) agendar(quadroId)
}

async function atualizarQuadro(quadroId: string) {
  const base = bases.get(quadroId)
  if (!base || emEnvio.has(quadroId) || pendente(quadroId)) return
  // Se o quadro sumiu da tela (ex.: um backup foi importado), baixa de novo mesmo sem versão nova.
  const naTela = fotografarQuadro(quadroId, estadoKanban()) !== null
  try {
    const resposta = await chamarApi<QuadroEquipeBaixado | { semMudancas: true }>(
      `/api/quadros-equipe/${quadroId}${naTela ? `?desde=${base.versao}` : ""}`
    )
    if ("semMudancas" in resposta) return
    // Se a pessoa mexeu enquanto baixávamos, o envio dela vem primeiro.
    if (emEnvio.has(quadroId) || pendente(quadroId)) return
    aplicarQuadro(resposta)
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) removerQuadroLocal(quadroId)
  }
}

// ---------- Equipes ----------

export async function recarregarEquipes() {
  const { equipes } = await chamarApi<{ equipes: Equipe[] }>("/api/equipes")
  useEquipes.setState({ equipes, carregado: true })
  const ids = new Set(equipes.flatMap((equipe) => equipe.quadros.map((quadro) => quadro.id)))
  // Quadros que saíram da lista (excluídos ou a pessoa saiu da equipe) somem da tela.
  for (const id of [...bases.keys()]) if (!ids.has(id)) removerQuadroLocal(id)
  // Quadros novos: baixa.
  await Promise.all([...ids].filter((id) => !bases.has(id)).map((id) => recarregarQuadro(id)))
  return equipes
}

async function ciclo(numero: number) {
  if (!ativa) return
  if (numero % CICLOS_ATE_LISTA === 0) await recarregarEquipes().catch(() => undefined)
  await Promise.all([...bases.keys()].map((id) => atualizarQuadro(id)))
}

// Cria um quadro na equipe (com as três colunas de sempre) e abre.
export async function criarQuadroDeEquipe(equipeId: string, titulo = "Novo quadro") {
  const id = crypto.randomUUID()
  await chamarApi(`/api/equipes/${equipeId}/quadros`, { metodo: "POST", corpo: { id, titulo, icone: "lista" } })
  const quadro: QuadroKanban = { ...novoQuadro(titulo, id), equipeId }
  useKanban.setState((estado) => ({
    quadros: [...estado.quadros, quadro],
    colunas: [...estado.colunas, ...colunasPadrao(id)],
    quadroAtivoId: id,
  }))
  const papel = useEquipes.getState().equipes.find((equipe) => equipe.id === equipeId)?.meuPapel ?? "editor"
  definirPapel(id, papel)
  // O servidor só tem o quadro vazio: o que está na tela é enviado como mudança.
  bases.set(id, { versao: 1, foto: { quadro: { ...quadro, fundo: null, imagemFundo: null, exibicao: {}, etiquetas: [] }, colunas: [], cartoes: [] } })
  agendar(id, 50)
  void recarregarEquipes().catch(() => undefined)
  return id
}

// Leva um quadro pessoal para a equipe: ele sai dos seus quadros e passa a ser da equipe.
// Os vínculos com notas pessoais são desfeitos (os colegas não veem suas notas).
export async function compartilharQuadroPessoal(quadroId: string, equipeId: string) {
  const quadro = useKanban.getState().quadros.find((item) => item.id === quadroId)
  if (!quadro || quadro.equipeId) return null
  const novoId = crypto.randomUUID()
  await chamarApi(`/api/equipes/${equipeId}/quadros`, { metodo: "POST", corpo: { id: novoId, titulo: quadro.titulo, icone: quadro.icone } })
  useKanban.setState((estado) => {
    const colunas = new Set(estado.colunas.filter((coluna) => coluna.quadroId === quadroId).map((coluna) => coluna.id))
    return {
      quadros: estado.quadros.map((item) => (item.id === quadroId ? { ...item, id: novoId, equipeId } : item)),
      colunas: estado.colunas.map((coluna) => (coluna.quadroId === quadroId ? { ...coluna, quadroId: novoId } : coluna)),
      cartoes: estado.cartoes.map((cartao) =>
        colunas.has(cartao.colunaId) ? { ...cartao, notaId: null, atividade: cartao.atividade.slice(-5) } : cartao
      ),
      quadroAtivoId: estado.quadroAtivoId === quadroId ? novoId : estado.quadroAtivoId,
    }
  })
  const papel = useEquipes.getState().equipes.find((equipe) => equipe.id === equipeId)?.meuPapel ?? "editor"
  definirPapel(novoId, papel)
  bases.set(novoId, { versao: 1, foto: { quadro: { ...quadro, id: novoId, equipeId, fundo: null, imagemFundo: null, exibicao: {}, etiquetas: [] }, colunas: [], cartoes: [] } })
  agendar(novoId, 50)
  void recarregarEquipes().catch(() => undefined)
  return novoId
}

async function excluirNoServidor(quadro: QuadroKanban) {
  bases.delete(quadro.id)
  clearTimeout(temporizadores.get(quadro.id))
  try {
    await chamarApi(`/api/quadros-equipe/${quadro.id}`, { metodo: "DELETE" })
  } catch (erro) {
    definirAvisoEquipe(mensagemDoErro(erro))
  }
  // Se o servidor recusou, o quadro volta; se excluiu, a lista nova confirma.
  await recarregarEquipes().catch(() => undefined)
}

// ---------- Foto de perfil ----------
// A foto fica nas preferências (para aparecer na hora) e também na conta,
// onde os colegas de equipe conseguem ver.

async function sincronizarFotoComServidor() {
  try {
    const { foto: doServidor } = await chamarApi<{ foto: string | null }>("/api/conta/foto")
    const { fotoPerfil, definirFotoPerfil } = usePreferencias.getState()
    if (fotoPerfil && fotoPerfil !== doServidor) await chamarApi("/api/conta/foto", { metodo: "PUT", corpo: { foto: fotoPerfil } })
    else if (!fotoPerfil && doServidor) definirFotoPerfil(doServidor)
  } catch {
    // Sem a migração das equipes ou sem rede: a foto continua só neste navegador.
  }
}

// ---------- Início e fim ----------

// Começa ao entrar na conta. Retorna a função que para (ao sair).
export function iniciarSincronizacaoEquipes() {
  ativa = true
  ganchosEquipe.aoExcluirQuadro = (quadro) => void excluirNoServidor(quadro)
  void recarregarEquipes().catch(() => useEquipes.setState({ carregado: true }))
  void sincronizarFotoComServidor()

  const pararKanban = useKanban.subscribe(() => bases.forEach((_, id) => agendar(id)))
  let fotoAnterior = usePreferencias.getState().fotoPerfil
  const pararFoto = usePreferencias.subscribe((estado) => {
    if (estado.fotoPerfil === fotoAnterior) return
    fotoAnterior = estado.fotoPerfil
    const chamada = estado.fotoPerfil
      ? chamarApi("/api/conta/foto", { metodo: "PUT", corpo: { foto: estado.fotoPerfil } })
      : chamarApi("/api/conta/foto", { metodo: "DELETE" })
    void chamada.catch(() => undefined)
  })

  let numero = 1
  const intervalo = setInterval(() => {
    if (document.visibilityState === "visible") void ciclo(numero++)
  }, INTERVALO_ATUALIZACAO)
  const aoVoltar = () => {
    if (document.visibilityState === "visible") void ciclo(0)
  }
  document.addEventListener("visibilitychange", aoVoltar)

  return () => {
    ativa = false
    ganchosEquipe.aoExcluirQuadro = undefined
    pararKanban()
    pararFoto()
    clearInterval(intervalo)
    document.removeEventListener("visibilitychange", aoVoltar)
    for (const id of [...bases.keys()]) removerQuadroLocal(id)
    useEquipes.setState({ equipes: [], carregado: false, papelDoQuadro: {}, aviso: null })
  }
}
