"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

import { TelaAbertura } from "@/components/conta/tela-abertura"
import { TelaApresentacao } from "@/components/conta/tela-apresentacao"
import { TelaEntrada, type Modo } from "@/components/conta/tela-entrada"
import { carregarDadosDaConta, enviarPendentes, iniciarSincronizacao, limparDadosLocais } from "@/lib/estado/sincronizacao"
import { sair as acaoSair } from "@/lib/servidor/acoes-conta"
import type { Usuario } from "@/lib/tipos-conta"

// abertura → apresentação → entrada (login/cadastro) → carregando → pronto
type Fase = "abertura" | "apresentacao" | "entrada" | "carregando" | "pronto" | "falha"

// Tempo mínimo da tela de abertura, para ela não "piscar".
const ABERTURA_MINIMA = 1200

type Conta = {
  usuario: Usuario
  sair: () => Promise<void>
  // Depois de mudar o nome em "Minha conta".
  atualizarUsuario: (mudancas: Partial<Usuario>) => void
  // Depois de excluir a conta ou sair de todos os aparelhos (a sessão já foi apagada no servidor).
  encerrarNesteNavegador: () => void
}

const ContextoConta = createContext<Conta | null>(null)

// null enquanto ninguém entrou (o app fica montado, escondido, por baixo das telas de entrada).
export function useConta() {
  return useContext(ContextoConta)
}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))

// Rafael Marques - 21/10/2026
// Porta de entrada do app: abertura → (login/cadastro) → carrega os dados
// da conta → mostra o app e mantém tudo salvo no banco.
export function PortaoConta({ children, depoisDeEntrar }: { children: React.ReactNode; depoisDeEntrar?: React.ReactNode }) {
  const [fase, setFase] = useState<Fase>("abertura")
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const [modoEntrada, setModoEntrada] = useState<Modo>("entrar")

  useEffect(() => {
    let ativo = true
    const minimo = esperar(ABERTURA_MINIMA)
    ;(async () => {
      try {
        const resposta = await fetch("/api/conta", { cache: "no-store" })
        if (!resposta.ok) throw new Error()
        const { usuario: atual } = (await resposta.json()) as { usuario: Usuario | null }
        if (atual) await carregarDadosDaConta()
        await minimo
        if (!ativo) return
        setUsuario(atual)
        setFase(atual ? "pronto" : "apresentacao")
      } catch {
        await minimo
        if (!ativo) return
        setErro("Não foi possível conectar. Verifique sua internet.")
        setFase("falha")
      }
    })()
    return () => {
      ativo = false
    }
  }, [tentativa])

  useEffect(() => {
    if (fase !== "pronto") return
    return iniciarSincronizacao()
  }, [fase])

  const aoEntrar = useCallback(async (novo: Usuario) => {
    setUsuario(novo)
    setFase("carregando")
    try {
      await carregarDadosDaConta()
      setFase("pronto")
    } catch {
      setErro("Não foi possível carregar seus dados.")
      setFase("falha")
    }
  }, [])

  const encerrarNesteNavegador = useCallback(() => {
    limparDadosLocais()
    window.location.replace("/")
  }, [])

  const sair = useCallback(async () => {
    await enviarPendentes()
    await acaoSair()
    encerrarNesteNavegador()
  }, [encerrarNesteNavegador])

  const atualizarUsuario = useCallback((mudancas: Partial<Usuario>) => {
    setUsuario((atual) => (atual ? { ...atual, ...mudancas } : atual))
  }, [])

  const pronto = fase === "pronto" && usuario !== null

  // Sem rolagem da página por baixo das telas de entrada.
  useEffect(() => {
    if (pronto) return
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = ""
    }
  }, [pronto])

  let tela: React.ReactNode = null
  if (fase === "apresentacao") tela = <TelaApresentacao aoEscolher={(modo) => { setModoEntrada(modo); setFase("entrada") }} />
  else if (fase === "entrada") tela = <TelaEntrada key={modoEntrada} modoInicial={modoEntrada} aoEntrar={aoEntrar} aoVoltar={() => setFase("apresentacao")} />
  else if (fase === "falha")
    tela = (
      <TelaAbertura
        erro={erro}
        aoTentarDeNovo={() => {
          setErro(null)
          setFase("abertura")
          setTentativa((valor) => valor + 1)
        }}
      />
    )
  else if (!pronto) tela = <TelaAbertura mensagem={fase === "carregando" ? "Carregando seus dados…" : undefined} />

  return (
    <ContextoConta value={pronto && usuario ? { usuario, sair, atualizarUsuario, encerrarNesteNavegador } : null}>
      {/* O app fica sempre montado (o Next valida as rotas), mas escondido e
          inerte até os dados da conta chegarem; aí é montado de novo, já com eles. */}
      <div key={pronto ? "conta" : "espera"} inert={!pronto || undefined} aria-hidden={!pronto || undefined} className="contents">
        {children}
      </div>
      {pronto && depoisDeEntrar}
      {tela && <div className="fixed inset-0 z-50 overflow-y-auto bg-background">{tela}</div>}
    </ContextoConta>
  )
}
