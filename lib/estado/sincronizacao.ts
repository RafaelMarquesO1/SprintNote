// Rafael Marques - 21/10/2026 (não reenvia texto igual em 23/10/2026)
// Liga os dados do app (Zustand + localStorage) à conta no banco:
//  - ao entrar, baixa as áreas da conta e recarrega os estados;
//  - depois, cada mudança é enviada ao banco alguns instantes depois.

import { create, type StoreApi } from "zustand"

import { useHabitos } from "@/lib/estado/habitos"
import { useInicio } from "@/lib/estado/inicio"
import { useKanban } from "@/lib/estado/kanban"
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
const ultimoTexto = new Map<string, string>()

const agendados = new Map<string, ReturnType<typeof setTimeout>>()
let enviando = 0
let ativa = false

function atualizarEstado(erro = false) {
  if (erro) return useSincronizacao.setState({ estado: "erro" })
  if (enviando > 0) return useSincronizacao.setState({ estado: "salvando" })
  if (agendados.size > 0) return useSincronizacao.setState({ estado: "pendente" })
  useSincronizacao.setState({ estado: "salvo", salvoEm: Date.now() })
}

async function enviar(nome: string, aoSairDaPagina = false) {
  const texto = localStorage.getItem(nome)
  if (texto === null) return
  if (ultimoTexto.get(nome) === texto) return atualizarEstado()
  enviando++
  atualizarEstado()
  try {
    const resposta = await fetch(`/api/dados?chave=${encodeURIComponent(nome)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: texto,
      // keepalive deixa o envio terminar com a aba fechando (limite de ~64 KB).
      keepalive: aoSairDaPagina && texto.length < 60_000,
    })
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
    ultimoTexto.set(nome, texto)
    enviando--
    atualizarEstado()
  } catch {
    enviando--
    atualizarEstado(true)
    if (ativa && !aoSairDaPagina) agendar(nome, ESPERA_NOVA_TENTATIVA)
  }
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
export async function carregarDadosDaConta() {
  const resposta = await fetch("/api/dados", { cache: "no-store" })
  if (!resposta.ok) throw new Error("Não foi possível carregar seus dados.")
  const { dados } = (await resposta.json()) as { dados: Record<string, unknown> }

  const semDados: LojaPersistida[] = []
  for (const loja of lojas) {
    const nome = nomeDa(loja)
    if (nome in dados) localStorage.setItem(nome, JSON.stringify(dados[nome]))
    else {
      localStorage.removeItem(nome)
      semDados.push(loja)
    }
  }
  await Promise.all(lojas.map((loja) => loja.persist.rehydrate()))
  for (const loja of semDados) (loja as unknown as StoreApi<object>).setState(loja.getInitialState(), true)
  ultimoTexto.clear()
  for (const loja of lojas) {
    const texto = localStorage.getItem(nomeDa(loja))
    if (texto !== null) ultimoTexto.set(nomeDa(loja), texto)
  }
}

// Começa a enviar as mudanças. Retorna a função que para.
export function iniciarSincronizacao() {
  ativa = true
  const cancelar = lojas.map((loja) => loja.subscribe(() => agendar(nomeDa(loja))))
  const aoEsconder = () => {
    if (document.visibilityState === "hidden") void enviarPendentes(true)
  }
  const aoSairDaPagina = () => void enviarPendentes(true)
  document.addEventListener("visibilitychange", aoEsconder)
  window.addEventListener("pagehide", aoSairDaPagina)
  return () => {
    ativa = false
    cancelar.forEach((parar) => parar())
    document.removeEventListener("visibilitychange", aoEsconder)
    window.removeEventListener("pagehide", aoSairDaPagina)
  }
}

// Ao sair da conta: tira os dados deste navegador.
export function limparDadosLocais() {
  ultimoTexto.clear()
  for (const loja of lojas) localStorage.removeItem(nomeDa(loja))
}
