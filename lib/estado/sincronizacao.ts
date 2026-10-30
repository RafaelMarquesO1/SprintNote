// Rafael Marques - 21/10/2026 (não reenvia texto igual em 23/10/2026)
// Liga os dados do app (Zustand + localStorage) à conta no banco:
//  - ao entrar, baixa as áreas da conta e recarrega os estados;
//  - depois, cada mudança é enviada ao banco alguns instantes depois.
//
// Rafael Marques - 30/10/2026: vários aparelhos e abas ao mesmo tempo.
//  - cada envio diz em qual versão do banco a mudança foi feita; se outro aparelho
//    salvou antes, o servidor recusa (409) e as duas versões são juntadas (lib/estado/mesclar.ts);
//  - ao voltar para a aba, busca o que mudou em outro aparelho;
//  - o que não chegou a ser enviado (aba fechada no meio) fica marcado e é juntado
//    ao abrir o app de novo, em vez de ser trocado pelo que veio do banco.

import { create, type StoreApi } from "zustand"

import { useHabitos } from "@/lib/estado/habitos"
import { useInicio } from "@/lib/estado/inicio"
import { useKanban } from "@/lib/estado/kanban"
import { mesclarEstado, mesclarSemBase } from "@/lib/estado/mesclar"
import { useNotas } from "@/lib/estado/notas"
import { usePreferencias } from "@/lib/estado/preferencias"
import { useRotina } from "@/lib/estado/rotina"
import { useTarefas } from "@/lib/estado/tarefas"

type LojaPersistida = {
  subscribe: (ouvinte: () => void) => () => void
  getInitialState: () => object
  persist: { getOptions: () => { name?: string }; rehydrate: () => Promise<void> | void }
}

const lojas: LojaPersistida[] = [useNotas, useTarefas, useHabitos, useRotina, useKanban, useInicio, usePreferencias]
const nomeDa = (loja: LojaPersistida) => loja.persist.getOptions().name!

const ESPERA_ENVIO = 1200
const ESPERA_NOVA_TENTATIVA = 5000

export type EstadoSincronizacao = "salvo" | "pendente" | "salvando" | "erro"

export const useSincronizacao = create<{ estado: EstadoSincronizacao; salvoEm: number | null }>(() => ({
  estado: "salvo",
  salvoEm: null,
}))

// Rafael Marques - 23/10/2026: o que já está no banco, para não reenviar o mesmo texto
// (a atualização dos quadros de equipe mexe no estado, mas não muda o que é pessoal).
// Rafael Marques - 30/10/2026: também é a "base" usada para juntar as mudanças.
const ultimoTexto = new Map<string, string>()
// Versão de cada área no banco (null = a área ainda não existe lá).
const versoes = new Map<string, string | null>()

const agendados = new Map<string, ReturnType<typeof setTimeout>>()
const emVoo = new Set<string>()
const reenviar = new Set<string>()
let enviando = 0
let ativa = false
let usuarioAtualId: string | null = null
let aEnviarAoIniciar: string[] = []

// ---------- Marca do que ainda não foi enviado (sobrevive a fechar a aba) ----------
// Fica só neste navegador e é apagada ao sair da conta.
const CHAVE_PENDENCIAS = "sincronia-sprintnote"
type Pendencias = { usuarioId: string; areas: Record<string, string | null> }

function lerPendencias(): Pendencias | null {
  try {
    const texto = localStorage.getItem(CHAVE_PENDENCIAS)
    return texto ? (JSON.parse(texto) as Pendencias) : null
  } catch {
    return null
  }
}

function gravarPendencias(mudar: (areas: Record<string, string | null>) => void) {
  if (!usuarioAtualId) return
  const atual = lerPendencias()
  const areas = atual?.usuarioId === usuarioAtualId ? atual.areas : {}
  mudar(areas)
  try {
    if (Object.keys(areas).length === 0) localStorage.removeItem(CHAVE_PENDENCIAS)
    else localStorage.setItem(CHAVE_PENDENCIAS, JSON.stringify({ usuarioId: usuarioAtualId, areas }))
  } catch {
    // Sem espaço no navegador: segue sem a marca.
  }
}

const marcarPendente = (nome: string) =>
  gravarPendencias((areas) => {
    if (!(nome in areas)) areas[nome] = versoes.get(nome) ?? null
  })
const limparPendente = (nome: string) =>
  gravarPendencias((areas) => {
    delete areas[nome]
  })

// ---------- Estado ----------
function atualizarEstado(erro = false) {
  if (erro) return useSincronizacao.setState({ estado: "erro" })
  if (enviando > 0) return useSincronizacao.setState({ estado: "salvando" })
  if (agendados.size > 0) return useSincronizacao.setState({ estado: "pendente" })
  useSincronizacao.setState({ estado: "salvo", salvoEm: Date.now() })
}

function lerJson(texto: string): unknown {
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

// Coloca um texto na área e recarrega o estado da tela.
async function aplicarTexto(nome: string, texto: string) {
  const loja = lojas.find((outra) => nomeDa(outra) === nome)
  if (!loja) return
  // Quadros de equipe não ficam na área pessoal: guarda e devolve depois de recarregar.
  let doEquipe: Pick<ReturnType<typeof useKanban.getState>, "quadros" | "colunas" | "cartoes" | "quadroAtivoId"> | null = null
  if (nome === nomeDa(useKanban)) {
    const kanban = useKanban.getState()
    const quadros = kanban.quadros.filter((quadro) => quadro.equipeId)
    const ids = new Set(quadros.map((quadro) => quadro.id))
    const colunas = kanban.colunas.filter((coluna) => ids.has(coluna.quadroId))
    const idsColunas = new Set(colunas.map((coluna) => coluna.id))
    const cartoes = kanban.cartoes.filter((cartao) => idsColunas.has(cartao.colunaId))
    doEquipe = { quadros, colunas, cartoes, quadroAtivoId: kanban.quadroAtivoId }
  }

  localStorage.setItem(nome, texto)
  await loja.persist.rehydrate()

  if (doEquipe) {
    const equipe = doEquipe
    useKanban.setState((estado) => {
      const quadros = [...estado.quadros, ...equipe.quadros]
      return {
        quadros,
        colunas: [...estado.colunas, ...equipe.colunas],
        cartoes: [...estado.cartoes, ...equipe.cartoes],
        quadroAtivoId: quadros.some((quadro) => quadro.id === equipe.quadroAtivoId) ? equipe.quadroAtivoId : estado.quadroAtivoId,
      }
    })
  }
}

// Outro aparelho salvou antes: junta o que está no banco com o que está aqui.
async function juntarComServidor(nome: string, textoRemoto: string | null, versaoRemota: string | null) {
  const textoLocal = localStorage.getItem(nome)
  const base = ultimoTexto.get(nome)
  let resultado: string | null
  if (textoRemoto === null || textoLocal === null) resultado = textoLocal ?? textoRemoto
  else {
    const remoto = lerJson(textoRemoto)
    const local = lerJson(textoLocal)
    const mesclado = base === undefined ? mesclarSemBase(local, remoto) : mesclarEstado(lerJson(base), local, remoto)
    resultado = JSON.stringify(mesclado)
  }
  if (textoRemoto === null) ultimoTexto.delete(nome)
  else ultimoTexto.set(nome, textoRemoto)
  versoes.set(nome, versaoRemota)
  if (resultado !== null && resultado !== textoLocal) await aplicarTexto(nome, resultado)
}

async function enviar(nome: string, aoSairDaPagina = false) {
  if (emVoo.has(nome)) {
    // Um envio desta área já está a caminho: manda de novo quando ele voltar.
    reenviar.add(nome)
    return
  }
  const texto = localStorage.getItem(nome)
  if (texto === null) return
  if (ultimoTexto.get(nome) === texto) {
    limparPendente(nome)
    return atualizarEstado()
  }
  emVoo.add(nome)
  enviando++
  atualizarEstado()
  let tentarDeNovo = false
  try {
    const resposta = await fetch(`/api/dados?chave=${encodeURIComponent(nome)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-versao-base": versoes.get(nome) ?? "" },
      body: texto,
      // keepalive deixa o envio terminar com a aba fechando (limite de ~64 KB).
      keepalive: aoSairDaPagina && texto.length < 60_000,
    })
    if (resposta.status === 409) {
      const { valor, versao } = (await resposta.json()) as { valor: unknown; versao: string | null }
      await juntarComServidor(nome, valor === null ? null : JSON.stringify(valor), versao)
      reenviar.add(nome)
    } else {
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
      const { versao } = (await resposta.json()) as { versao: string }
      versoes.set(nome, versao)
      ultimoTexto.set(nome, texto)
      if (localStorage.getItem(nome) === texto) limparPendente(nome)
    }
    enviando--
    atualizarEstado()
  } catch {
    enviando--
    atualizarEstado(true)
    tentarDeNovo = ativa && !aoSairDaPagina
  } finally {
    emVoo.delete(nome)
  }
  if (tentarDeNovo) agendar(nome, ESPERA_NOVA_TENTATIVA)
  else if (reenviar.delete(nome) && ativa) agendar(nome, 0)
}

function agendar(nome: string, espera = ESPERA_ENVIO) {
  clearTimeout(agendados.get(nome))
  agendados.set(
    nome,
    setTimeout(() => {
      agendados.delete(nome)
      void enviar(nome)
    }, espera)
  )
  atualizarEstado()
}

// Mudança feita na tela: marca e agenda o envio.
function aoMudar(nome: string) {
  if (localStorage.getItem(nome) !== ultimoTexto.get(nome)) marcarPendente(nome)
  agendar(nome)
}

// Envia na hora tudo o que estava esperando (ao sair da página ou da conta).
export async function enviarPendentes(aoSairDaPagina = false) {
  const nomes = [...agendados.keys()]
  for (const nome of nomes) clearTimeout(agendados.get(nome))
  agendados.clear()
  await Promise.all(nomes.map((nome) => enviar(nome, aoSairDaPagina)))
}

// Baixa os dados da conta. Cada conta só enxerga o que é dela: área que a
// conta ainda não tem começa no padrão (conta nova = app em branco), nunca
// com o que tenha sobrado neste navegador.
// Rafael Marques - 30/10/2026: exceção — mudanças desta mesma conta que não chegaram
// a ser enviadas são juntadas ao que veio do banco.
export async function carregarDadosDaConta(usuarioId: string) {
  const resposta = await fetch("/api/dados", { cache: "no-store" })
  if (!resposta.ok) throw new Error("Não foi possível carregar seus dados.")
  const { dados, versoes: versoesRemotas } = (await resposta.json()) as {
    dados: Record<string, unknown>
    versoes: Record<string, string>
  }

  const marca = lerPendencias()
  const pendentes = marca?.usuarioId === usuarioId ? marca.areas : {}
  if (marca && marca.usuarioId !== usuarioId) localStorage.removeItem(CHAVE_PENDENCIAS)
  usuarioAtualId = usuarioId
  ultimoTexto.clear()
  versoes.clear()
  aEnviarAoIniciar = []

  const semDados: LojaPersistida[] = []
  for (const loja of lojas) {
    const nome = nomeDa(loja)
    const textoLocal = localStorage.getItem(nome)
    const textoRemoto = nome in dados ? JSON.stringify(dados[nome]) : null
    versoes.set(nome, textoRemoto !== null ? versoesRemotas[nome] : null)
    if (textoRemoto !== null) ultimoTexto.set(nome, textoRemoto)

    if (nome in pendentes && textoLocal !== null) {
      // Mudança deste navegador que não chegou ao banco. Se o banco mudou depois, junta.
      if (textoRemoto !== null && pendentes[nome] !== versoesRemotas[nome]) {
        localStorage.setItem(nome, JSON.stringify(mesclarSemBase(lerJson(textoLocal), dados[nome])))
      }
      aEnviarAoIniciar.push(nome)
    } else if (textoRemoto !== null) localStorage.setItem(nome, textoRemoto)
    else {
      localStorage.removeItem(nome)
      semDados.push(loja)
    }
  }

  await Promise.all(lojas.map((loja) => loja.persist.rehydrate()))
  for (const loja of semDados) (loja as unknown as StoreApi<object>).setState(loja.getInitialState(), true)
  for (const loja of lojas) {
    const nome = nomeDa(loja)
    const texto = localStorage.getItem(nome)
    if (texto !== null && !ultimoTexto.has(nome) && !aEnviarAoIniciar.includes(nome)) ultimoTexto.set(nome, texto)
  }
}

// Busca o que outro aparelho (ou outra aba) salvou enquanto esta aba estava parada.
let buscando = false
async function buscarMudancasDeFora() {
  if (!ativa || buscando) return
  buscando = true
  try {
    const resposta = await fetch("/api/dados?versoes=1", { cache: "no-store" })
    if (!resposta.ok) return
    const { versoes: remotas } = (await resposta.json()) as { versoes: Record<string, string> }
    const mudaram = lojas.map(nomeDa).filter((nome) => nome in remotas && remotas[nome] !== versoes.get(nome))
    if (mudaram.length === 0) return

    const completa = await fetch("/api/dados", { cache: "no-store" })
    if (!completa.ok) return
    const { dados, versoes: atuais } = (await completa.json()) as { dados: Record<string, unknown>; versoes: Record<string, string> }
    for (const nome of mudaram) {
      // Envio desta área a caminho: se der conflito, ele mesmo junta.
      if (emVoo.has(nome) || !(nome in dados)) continue
      const textoRemoto = JSON.stringify(dados[nome])
      if (localStorage.getItem(nome) === ultimoTexto.get(nome) && !agendados.has(nome)) {
        // Nada mudou aqui: só troca pelo que veio.
        ultimoTexto.set(nome, textoRemoto)
        versoes.set(nome, atuais[nome])
        await aplicarTexto(nome, textoRemoto)
      } else {
        await juntarComServidor(nome, textoRemoto, atuais[nome])
        agendar(nome)
      }
    }
  } catch {
    // Sem internet: tenta na próxima vez que a aba voltar.
  } finally {
    buscando = false
  }
}

// Começa a enviar as mudanças. Retorna a função que para.
export function iniciarSincronizacao() {
  ativa = true
  const cancelar = lojas.map((loja) => loja.subscribe(() => aoMudar(nomeDa(loja))))
  for (const nome of aEnviarAoIniciar) agendar(nome, 0)
  aEnviarAoIniciar = []
  const aoMudarVisibilidade = () => {
    if (document.visibilityState === "hidden") void enviarPendentes(true)
    else void buscarMudancasDeFora()
  }
  const aoSairDaPagina = () => void enviarPendentes(true)
  const aoVoltarInternet = () => void buscarMudancasDeFora()
  document.addEventListener("visibilitychange", aoMudarVisibilidade)
  window.addEventListener("pagehide", aoSairDaPagina)
  window.addEventListener("online", aoVoltarInternet)
  return () => {
    ativa = false
    cancelar.forEach((parar) => parar())
    document.removeEventListener("visibilitychange", aoMudarVisibilidade)
    window.removeEventListener("pagehide", aoSairDaPagina)
    window.removeEventListener("online", aoVoltarInternet)
  }
}

// Ao sair da conta: tira os dados deste navegador.
export function limparDadosLocais() {
  ultimoTexto.clear()
  versoes.clear()
  usuarioAtualId = null
  for (const loja of lojas) localStorage.removeItem(nomeDa(loja))
  localStorage.removeItem(CHAVE_PENDENCIAS)
}
