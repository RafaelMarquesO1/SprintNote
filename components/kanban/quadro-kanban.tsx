"use client"

import { useEffect, useRef, useState } from "react"
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  AlertCircleIcon,
  ArchiveIcon,
  ChartColumnIcon,
  CheckIcon,
  DownloadIcon,
  LayoutTemplateIcon,
  Rows3Icon,
  UploadIcon,
  FilterIcon,
  Share2Icon,
  UserCheckIcon,
  UsersIcon,
  KanbanIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  TagIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Icone, iconesNota } from "@/components/icone"
import { ConteudoCartao, estilosPrioridade, PREFIXO_CARTAO } from "@/components/kanban/cartao-kanban"
import { Coluna, PREFIXO_ARRASTAR_COLUNA, PREFIXO_COLUNA } from "@/components/kanban/coluna-kanban"
import { DialogoCartao } from "@/components/kanban/dialogo-cartao"
// Rafael Marques - 23/10/2026: equipes (quadros compartilhados, responsável e aviso de leitor).
import { useConta } from "@/components/conta/portao-conta"
import { AvatarPessoa } from "@/components/equipes/avatar-pessoa"
import { AvisoDesfazer } from "@/components/kanban/aviso-desfazer"
import { DialogoCompartilhar } from "@/components/kanban/dialogo-compartilhar"
import { PaineisKanban } from "@/components/kanban/paineis-kanban"
import { DialogoArquivados } from "@/components/kanban/dialogo-arquivados"
import { DialogoEtiquetas, DialogoExcluirColuna } from "@/components/kanban/dialogos-quadro"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, IconButton } from "@/components/ui/button"
import { TopbarSlot } from "@/components/shell/estado"
import { AvatarStack } from "@/components/ui/avatar-stack"
import { chipVariants, ToggleChip } from "@/components/ui/chip"
import { PontoTinta } from "@/components/ui/etiqueta"
import { Segmented } from "@/components/ui/segmented"
import { StatList } from "@/components/ui/stat-list"
import { PriorityIcon } from "@/components/ui/status-icon"
import { abrirPainelKanban } from "@/lib/estado/paineis-kanban"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Interruptor, OpcoesLadoALado, PainelPersonalizar, SecaoPersonalizar } from "@/components/painel-personalizar"
import { useHidratado } from "@/hooks/use-hidratado"
import { useHoje } from "@/hooks/use-hoje"
import { DialogoModelos } from "@/components/kanban/dialogo-modelos"
import { DialogoResumo } from "@/components/kanban/dialogo-resumo"
import { chaveDaRaia, montarRaias, mudancasDaRaia, RaiasKanban } from "@/components/kanban/raias-kanban"
import { CamadaFundo } from "@/components/kanban/camada-fundo"
import { SeletorFundo } from "@/components/kanban/seletor-fundo"
import { VisaoCalendario } from "@/components/kanban/visao-calendario"
import { VisaoLista } from "@/components/kanban/visao-lista"
import { AjusteFotoAoVivo } from "@/components/kanban/ajuste-foto-ao-vivo"
import { estiloDoContraste, useLeituraDaFoto } from "@/components/kanban/leitura-foto"
import { prepararFoto } from "@/lib/kanban/preparar-foto"
import { ajusteFotoPadrao, codificarAjusteFoto, pedeVidro, resolverFundoQuadro, type AjusteFoto } from "@/lib/kanban/fundo"
import { useEquipes } from "@/lib/estado/equipes"
import { alternarFiltroPorResponsavel, filtrarPorResponsavel, useFiltroAtribuidos } from "@/lib/estado/filtro-atribuidos"
import { cartaoPeloNumero, colunasDoQuadro, exibicaoDoQuadro, exibicaoPadrao, numeroDoCartao, useKanban } from "@/lib/estado/kanban"
import { rotulosRaia, useVisaoKanban, type RaiaKanban, type VisaoKanban } from "@/lib/estado/visao-kanban"
import { baixarArquivo, nomeSeguro } from "@/lib/exportar"
import { exportarQuadro, quadroParaCsv } from "@/lib/kanban/transferir"
import { criarQuadroDeEquipe } from "@/lib/estado/sincronizacao-equipes"
import { mensagemDoErro } from "@/lib/equipes/api"
import { descricoesPapel, rotulosPapel } from "@/lib/tipos-equipe"
import type { ColunaKanban, Prioridade } from "@/lib/tipos"

// Arrastando um cartão: o cartão sob o cursor ganha da coluna.
// Arrastando uma coluna: só outras colunas contam como alvo.
const detectarColisao: CollisionDetection = (argumentos) => {
  const ehColuna = String(argumentos.active.id).startsWith(PREFIXO_ARRASTAR_COLUNA)
  if (ehColuna) {
    // A coluna sob o ponteiro ganha; fora de todas, a mais próxima.
    const soColunas = {
      ...argumentos,
      droppableContainers: argumentos.droppableContainers.filter((alvo) => String(alvo.id).startsWith(PREFIXO_COLUNA)),
    }
    const sobPonteiro = pointerWithin(soColunas)
    return sobPonteiro.length > 0 ? sobPonteiro : closestCenter(soColunas)
  }
  const colisoes = pointerWithin(argumentos)
  const sobreCartao = colisoes.find((colisao) => String(colisao.id).startsWith(PREFIXO_CARTAO))
  if (sobreCartao) return [sobreCartao]
  return colisoes.length > 0 ? colisoes : rectIntersection(argumentos)
}

// Título do quadro: editável no próprio cabeçalho (salva a cada letra).
function TituloQuadro({ quadroId, titulo }: { quadroId: string; titulo: string }) {
  const atualizarQuadro = useKanban((estado) => estado.atualizarQuadro)
  const [rascunho, setRascunho] = useState(titulo)
  return (
    <input
      value={rascunho}
      onChange={(evento) => {
        setRascunho(evento.target.value)
        if (evento.target.value.trim()) atualizarQuadro(quadroId, { titulo: evento.target.value.trim() })
      }}
      onBlur={() => setRascunho(titulo)}
      onKeyDown={(evento) => evento.key === "Enter" && evento.currentTarget.blur()}
      aria-label="Nome do quadro"
      className="w-full min-w-0 bg-transparent font-display text-4xl leading-none font-bold tracking-tight text-paper outline-none placeholder:text-ink-muted md:text-display-md"
    />
  )
}

// Rafael Marques - 20/10/2026 (personalização em 21/10/2026; filtros, arquivados e desfazer em 23/10/2026)
// Kanban: vários quadros, colunas e etiquetas personalizáveis.
// Cartões e colunas se arrastam com mouse, toque ou teclado.
export function QuadroKanban() {
  const hidratado = useHidratado()
  const hoje = useHoje()
  const quadros = useKanban((estado) => estado.quadros)
  const todasColunas = useKanban((estado) => estado.colunas)
  const cartoes = useKanban((estado) => estado.cartoes)
  const quadroAtivoId = useKanban((estado) => estado.quadroAtivoId)
  const definirQuadroAtivo = useKanban((estado) => estado.definirQuadroAtivo)
  const criarQuadro = useKanban((estado) => estado.criarQuadro)
  const atualizarQuadro = useKanban((estado) => estado.atualizarQuadro)
  const excluirQuadro = useKanban((estado) => estado.excluirQuadro)
  const adicionarColuna = useKanban((estado) => estado.adicionarColuna)
  const reordenarColuna = useKanban((estado) => estado.reordenarColuna)
  const moverCartao = useKanban((estado) => estado.moverCartao)
  const definirExibicao = useKanban((estado) => estado.definirExibicao)

  const [idArrastado, setIdArrastado] = useState<string | null>(null)
  const [colunaArrastadaId, setColunaArrastadaId] = useState<string | null>(null)
  const [idAberto, setIdAberto] = useState<string | null>(null)
  const [colunaParaExcluir, setColunaParaExcluir] = useState<ColunaKanban | null>(null)
  const [editandoEtiquetas, setEditandoEtiquetas] = useState(false)
  const [excluindoQuadro, setExcluindoQuadro] = useState(false)
  const [novaColuna, setNovaColuna] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  // Redesign v2 (8.8): filtros na URL. A tag chega pelo nome ("nome:SisPep") e vale para a etiqueta com esse nome.
  const [filtroEtiquetas, setFiltroEtiquetas] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : new URLSearchParams(window.location.search).getAll("tag").map((nome) => `nome:${nome}`)
  )
  const [filtroPrioridades, setFiltroPrioridades] = useState<Prioridade[]>([])
  const [soAtrasados, setSoAtrasados] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("atrasados") === "1")
  const [verArquivados, setVerArquivados] = useState(false)
  // Rafael Marques - 23/10/2026: no celular os chips de filtro ficam recolhidos atrás do botão "Filtros".
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  // Rafael Marques - 23/10/2026: equipes
  const conta = useConta()
  const equipes = useEquipes((estado) => estado.equipes)
  const papelDoQuadro = useEquipes((estado) => estado.papelDoQuadro)
  const avisoEquipe = useEquipes((estado) => estado.aviso)
  // Rafael Marques - 23/10/2026: filtro por pessoa responsável (inicial no cartão, botão do cabeçalho ou busca).
  const filtroResp = useFiltroAtribuidos((estado) => estado.responsavelId)
  const [compartilhando, setCompartilhando] = useState(false)
  const [erroEquipe, setErroEquipe] = useState<string | null>(null)
  const meuId = conta?.usuario.id ?? null
  // Rafael Marques - 26/10/2026: visões (quadro, lista, calendário), raias, modelos, resumo, seleção e importação.
  const visoes = useVisaoKanban((estado) => estado.visoes)
  const raiasGuardadas = useVisaoKanban((estado) => estado.raias)
  const definirVisao = useVisaoKanban((estado) => estado.definirVisao)
  const definirRaia = useVisaoKanban((estado) => estado.definirRaia)
  const importarQuadro = useKanban((estado) => estado.importarQuadro)
  const atualizarCartao = useKanban((estado) => estado.atualizarCartao)
  const [escolhendoModelo, setEscolhendoModelo] = useState(false)
  const [verResumo, setVerResumo] = useState(false)
  const [avisoArquivo, setAvisoArquivo] = useState<string | null>(null)
  const entradaArquivo = useRef<HTMLInputElement>(null)
  // Rafael Marques - 26/10/2026: com foto de fundo, as letras do cabeçalho ficam claras ou escuras conforme a foto.
  const quadroDaVez = quadros.find((item) => item.id === quadroAtivoId) ?? quadros[0]
  const fotoDaVez = quadroDaVez ? resolverFundoQuadro(quadroDaVez.fundo, quadroDaVez.imagemFundo) : null
  // Ajuste ao vivo da foto (rascunho mostrado no próprio quadro até "Aplicar").
  const [rascunhoFoto, setRascunhoFoto] = useState<{ imagem: string; ajuste: AjusteFoto } | null>(null)
  const [preparandoFoto, setPreparandoFoto] = useState(false)
  const [avisoFoto, setAvisoFoto] = useState<string | null>(null)
  const [personalizarAberto, setPersonalizarAberto] = useState(false)
  // Visibilidade, brilho e cor das letras: calculados pela foto e pelo tema.
  const { automatico, contraste } = useLeituraDaFoto(rascunhoFoto?.imagem ?? (fotoDaVez?.tipo === "foto" ? quadroDaVez?.imagemFundo : null))

  const sensores = useSensors(
    // Precisa arrastar 5px para começar: assim um clique simples abre o cartão.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  // Rafael Marques - 29/10/2026: o cartão aberto fica na URL (/kanban?quadro=…&cartao=12), para
  // compartilhar o link ou seguir a numeração. Ao chegar por um link (ou por uma citação numa nota),
  // abre o quadro e o cartão. O endereço é lido depois de montar: numa navegação dentro do app, na
  // hora da montagem o navegador ainda mostra o endereço da página anterior.
  // undefined = ainda não leu; null = nada pendente.
  const linkPendente = useRef<{ quadro: string | null; numero: number | null } | null | undefined>(undefined)
  const numeroAberto = useKanban((estado) => (idAberto ? numeroDoCartao(estado, idAberto) : null))
  const cartoesTodos = useKanban((estado) => estado.cartoes)

  useEffect(() => {
    if (!hidratado) return
    if (linkPendente.current === undefined) {
      const busca = new URLSearchParams(window.location.search)
      const numero = Number(busca.get("cartao"))
      const quadroDoLink = busca.get("quadro")
      const numeroDoLink = Number.isInteger(numero) && numero > 0 ? numero : null
      linkPendente.current = quadroDoLink || numeroDoLink ? { quadro: quadroDoLink, numero: numeroDoLink } : null
    }
    const link = linkPendente.current
    if (!link) return
    // Quadros de equipe chegam depois do servidor: espera até o quadro existir.
    if (link.quadro && !quadros.some((item) => item.id === link.quadro)) return
    if (link.quadro && link.quadro !== quadroAtivoId) {
      definirQuadroAtivo(link.quadro)
      return
    }
    const quadroId = link.quadro ?? quadroDaVez?.id
    if (link.numero && quadroId) {
      const id = cartaoPeloNumero(useKanban.getState(), quadroId, link.numero)
      if (!id) return
      setIdAberto(id)
    }
    linkPendente.current = null
  }, [hidratado, quadros, cartoesTodos, quadroAtivoId, quadroDaVez?.id, definirQuadroAtivo])

  useEffect(() => {
    // Enquanto o link de chegada não foi resolvido, não reescreve o endereço (perderia o cartão pedido).
    if (!hidratado || linkPendente.current !== null || !quadroDaVez) return
    // Rafael Marques - 29/10/2026: só mexe no endereço enquanto está no Kanban (não atrapalha a ida para outra página).
    if (!window.location.pathname.startsWith("/kanban")) return
    const url = new URL(window.location.href)
    url.searchParams.set("quadro", quadroDaVez.id)
    if (idAberto && numeroAberto) url.searchParams.set("cartao", String(numeroAberto))
    else url.searchParams.delete("cartao")
    url.searchParams.delete("tag")
    for (const filtro of filtroEtiquetas) {
      const nome = filtro.startsWith("nome:") ? filtro.slice(5) : quadroDaVez.etiquetas.find((etiqueta) => etiqueta.id === filtro)?.nome
      if (nome) url.searchParams.append("tag", nome)
    }
    if (soAtrasados) url.searchParams.set("atrasados", "1")
    else url.searchParams.delete("atrasados")
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url)
  }, [hidratado, quadroDaVez, idAberto, numeroAberto, filtroEtiquetas, soAtrasados])

  if (!hidratado) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-64 w-72 shrink-0" />)}
      </div>
    )
  }

  const quadro = quadros.find((item) => item.id === quadroAtivoId) ?? quadros[0]

  if (!quadro) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-xl border border-dashed p-10 text-center">
        <p className="font-medium">Nenhum quadro ainda</p>
        <Button onClick={() => criarQuadro("Meu quadro")}><PlusIcon /> Criar quadro</Button>
        <PaineisKanban />
      </div>
    )
  }

  const colunas = colunasDoQuadro(todasColunas, quadro.id)
  const visao: VisaoKanban = visoes[quadro.id] ?? "quadro"
  const raiaEscolhida: RaiaKanban = raiasGuardadas[quadro.id] ?? "nenhuma"
  const exibicao = exibicaoDoQuadro(quadro)
  const idsColunas = new Set(colunas.map((coluna) => coluna.id))
  const termo = busca.trim().toLowerCase()
  const equipeDoQuadro = equipes.find((equipe) => equipe.id === quadro.equipeId)
  // O filtro só vale se a pessoa for da equipe deste quadro (ao trocar de quadro ele se desliga sozinho).
  const responsavelFiltrado = equipeDoQuadro?.membros.find((membro) => membro.id === filtroResp) ?? null
  const filtroEMeu = responsavelFiltrado !== null && responsavelFiltrado.id === meuId
  const meuPapel = quadro.equipeId ? papelDoQuadro[quadro.id] : undefined
  const membrosDoQuadro = equipeDoQuadro?.membros ?? []
  // "Por pessoa" só faz sentido em quadro de equipe.
  const raia: RaiaKanban = raiaEscolhida === "responsavel" && !equipeDoQuadro ? "nenhuma" : raiaEscolhida
  // Rafael Marques - 02/11/2026: colunas em vidro só com foto (as texturas são leves).
  const vidro = rascunhoFoto !== null || pedeVidro(resolverFundoQuadro(quadro.fundo, quadro.imagemFundo))

  async function ajustarFoto(arquivo?: File) {
    setPersonalizarAberto(false)
    setAvisoFoto(null)
    const atual = resolverFundoQuadro(quadro.fundo, quadro.imagemFundo)
    if (!arquivo) {
      if (quadro.imagemFundo) setRascunhoFoto({ imagem: quadro.imagemFundo, ajuste: atual?.tipo === "foto" ? atual.ajuste : ajusteFotoPadrao })
      return
    }
    setPreparandoFoto(true)
    try {
      const imagem = await prepararFoto(arquivo)
      setRascunhoFoto({ imagem, ajuste: ajusteFotoPadrao })
    } catch (erro) {
      setAvisoFoto(erro instanceof Error ? erro.message : "Não consegui usar essa imagem.")
      if (!rascunhoFoto) setPersonalizarAberto(true)
    } finally {
      setPreparandoFoto(false)
    }
  }
  // "nome:SisPep" (veio da URL) → id da etiqueta com esse nome neste quadro.
  const idDaEtiqueta = (filtro: string) => (filtro.startsWith("nome:") ? (quadro.etiquetas.find((etiqueta) => etiqueta.nome === filtro.slice(5))?.id ?? filtro) : filtro)
  const filtrando = Boolean(termo) || filtroEtiquetas.length > 0 || filtroPrioridades.length > 0 || soAtrasados || Boolean(responsavelFiltrado)
  const concluidaId = (colunaId: string) => Boolean(colunas.find((coluna) => coluna.id === colunaId)?.concluida)
  const visivel = (cartao: (typeof cartoes)[number]) =>
    !cartao.arquivado &&
    (!termo || `${cartao.titulo} ${cartao.descricao}`.toLowerCase().includes(termo)) &&
    filtroEtiquetas.every((id) => cartao.etiquetas.includes(idDaEtiqueta(id))) &&
    (!responsavelFiltrado || cartao.responsavelId === responsavelFiltrado.id) &&
    (filtroPrioridades.length === 0 || (cartao.prioridade !== null && filtroPrioridades.includes(cartao.prioridade))) &&
    (!soAtrasados || Boolean(hoje && cartao.prazo && cartao.prazo < hoje && !concluidaId(cartao.colunaId)))
  const todosDoQuadro = cartoes.filter((cartao) => idsColunas.has(cartao.colunaId))
  const arquivados = todosDoQuadro.filter((cartao) => cartao.arquivado)
  const cartoesDoQuadro = todosDoQuadro.filter((cartao) => !cartao.arquivado)

  function aoSoltar({ active, over }: DragEndEvent) {
    setIdArrastado(null)
    setColunaArrastadaId(null)
    if (!over) return

    // Reordenar coluna: entra no lugar da coluna sob o cursor.
    const colunaMovida = active.data.current?.colunaArrastadaId as string | undefined
    if (colunaMovida) {
      const alvo = over.data.current?.colunaId as string | undefined
      if (!alvo || alvo === colunaMovida) return
      const ordem = colunas.map((coluna) => coluna.id)
      const daqui = ordem.indexOf(colunaMovida)
      const dali = ordem.indexOf(alvo)
      // Indo para a direita, fica depois do alvo.
      reordenarColuna(colunaMovida, daqui < dali ? (ordem[dali + 1] ?? null) : alvo)
      return
    }

    const id = active.data.current?.cartaoId as string
    if (!cartoes.some((cartao) => cartao.id === id)) return

    const movido = cartoes.find((cartao) => cartao.id === id)!
    // Soltou na coluna (área vazia): vai para o fim dela.
    const colunaAlvo = over.data.current?.colunaId as string | undefined
    if (colunaAlvo) {
      moverCartao(id, colunaAlvo, null)
      // Com raias, a raia da coluna onde soltou vira o novo valor do cartão.
      const chaveRaia = over.data.current?.raiaChave as string | undefined
      if (raia !== "nenhuma" && chaveRaia !== undefined) atualizarCartao(id, mudancasDaRaia(raia, chaveRaia, movido))
      return
    }

    // Soltou sobre outro cartão: entra no lugar dele.
    const idAlvo = over.data.current?.cartaoId as string
    const cartaoAlvo = cartoes.find((cartao) => cartao.id === idAlvo)
    if (!cartaoAlvo || idAlvo === id) return
    if (raia !== "nenhuma") atualizarCartao(id, mudancasDaRaia(raia, chaveDaRaia(raia, cartaoAlvo, quadro.etiquetas), movido))
    const daColuna = cartoes.filter((cartao) => cartao.colunaId === cartaoAlvo.colunaId)
    const indiceMovido = daColuna.findIndex((cartao) => cartao.id === id)
    const indiceAlvo = daColuna.findIndex((cartao) => cartao.id === idAlvo)
    // Descendo na mesma coluna, o cartão fica depois do alvo.
    const antesDeId =
      indiceMovido !== -1 && indiceMovido < indiceAlvo ? (daColuna[indiceAlvo + 1]?.id ?? null) : idAlvo
    moverCartao(id, cartaoAlvo.colunaId, antesDeId)
  }

  function exportarJson() {
    const arquivo = exportarQuadro(quadro, colunas, todosDoQuadro)
    baixarArquivo(`${nomeSeguro(quadro.titulo)}.sprintnote-quadro.json`, JSON.stringify(arquivo, null, 2), "application/json")
  }
  function exportarCsv() {
    baixarArquivo(`${nomeSeguro(quadro.titulo)}.csv`, quadroParaCsv(colunas, todosDoQuadro, quadro.etiquetas), "text/csv;charset=utf-8")
  }
  async function aoEscolherArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ""
    if (!arquivo) return
    if (arquivo.size > 8 * 1024 * 1024) return setAvisoArquivo("O arquivo é grande demais (máximo de 8 MB).")
    const resultado = importarQuadro(await arquivo.text())
    setAvisoArquivo("erro" in resultado ? resultado.erro : null)
  }

  function moverColunaPorMenu(coluna: ColunaKanban, delta: -1 | 1) {
    const ordem = colunas.map((item) => item.id)
    const indice = ordem.indexOf(coluna.id)
    const destino = indice + delta
    if (destino < 0 || destino >= ordem.length) return
    reordenarColuna(coluna.id, delta < 0 ? ordem[destino] : (ordem[destino + 1] ?? null))
  }

  const cartaoArrastado = cartoes.find((cartao) => cartao.id === idArrastado) ?? null
  const colunaArrastada = colunas.find((coluna) => coluna.id === colunaArrastadaId) ?? null
  const cartaoAberto = cartoes.find((cartao) => cartao.id === idAberto) ?? null

  // Rafael Marques - 23/10/2026: cartões de equipe atribuídos a mim neste quadro (em aberto), para o atalho do cabeçalho.
  const atribuidosAMim = cartoesDoQuadro.filter((cartao) => meuId !== null && cartao.responsavelId === meuId && !concluidaId(cartao.colunaId)).length
  const concluidos = cartoesDoQuadro.filter((cartao) => concluidaId(cartao.colunaId)).length
  const atrasados = cartoesDoQuadro.filter(
    (cartao) => hoje && cartao.prazo && cartao.prazo < hoje && !colunas.find((coluna) => coluna.id === cartao.colunaId)?.concluida
  ).length

  const menuTrocarQuadro = (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
        <span className="max-sm:hidden">Trocar quadro</span>
        <KanbanIcon className="sm:hidden" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Meus quadros</DropdownMenuLabel>
          {quadros.filter((item) => !item.equipeId).map((item) => (
            <DropdownMenuItem key={item.id} onClick={() => definirQuadroAtivo(item.id)}>
              <Icone nome={item.icone} /> {item.titulo}
              {item.id === quadro.id && <CheckIcon className="ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {equipes.map((equipe) => {
          const doTime = quadros.filter((item) => item.equipeId === equipe.id)
          if (doTime.length === 0) return null
          return (
            <DropdownMenuGroup key={equipe.id}>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-1.5"><UsersIcon className="size-3" /> {equipe.nome}</DropdownMenuLabel>
              {doTime.map((item) => (
                <DropdownMenuItem key={item.id} onClick={() => definirQuadroAtivo(item.id)}>
                  <Icone nome={item.icone} /> {item.titulo}
                  {item.id === quadro.id && <CheckIcon className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => criarQuadro("Novo quadro")}><PlusIcon /> Novo quadro</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEscolhendoModelo(true)}><LayoutTemplateIcon /> Novo a partir de um modelo…</DropdownMenuItem>
        {equipes.filter((equipe) => equipe.meuPapel !== "leitor").map((equipe) => (
          <DropdownMenuItem key={equipe.id} onClick={() => criarQuadroDeEquipe(equipe.id).catch((falha) => setErroEquipe(mensagemDoErro(falha)))}>
            <UsersIcon /> <span className="truncate">Novo quadro em {equipe.nome}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const menuMais = (
    <DropdownMenu>
      <DropdownMenuTrigger render={<IconButton variant="secondary" size="sm" aria-label="Mais opções do quadro" />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem onClick={() => abrirPainelKanban("equipes")}><UsersIcon /> Equipes…</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setVerResumo(true)}><ChartColumnIcon /> Resumo do quadro…</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditandoEtiquetas(true)}><TagIcon /> Etiquetas…</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setNovaColuna("")}><PlusIcon /> Nova coluna</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setVerArquivados(true)}>
          <ArchiveIcon /> Arquivados{arquivados.length > 0 && ` (${arquivados.length})`}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportarJson}><DownloadIcon /> Exportar quadro (.json)</DropdownMenuItem>
        <DropdownMenuItem onClick={exportarCsv}><DownloadIcon /> Exportar planilha (.csv)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => entradaArquivo.current?.click()}><UploadIcon /> Importar quadro…</DropdownMenuItem>
        <DropdownMenuSeparator />
        {!quadro.equipeId && equipes.some((equipe) => equipe.meuPapel !== "leitor") && (
          <DropdownMenuItem onClick={() => setCompartilhando(true)}><Share2Icon /> Compartilhar com equipe…</DropdownMenuItem>
        )}
        {(!quadro.equipeId || meuPapel === "dono") && (
          <DropdownMenuItem onClick={() => setExcluindoQuadro(true)}><Trash2Icon /> Excluir quadro…</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const filtrosAtivos = filtroEtiquetas.length + filtroPrioridades.length + (soAtrasados ? 1 : 0)

  return (
    // Rafael Marques - 26/10/2026: fundo numa camada própria (sem fundo = night liso) e animações de entrada.
    <div className="relative isolate -mx-4 -my-6 flex min-h-[calc(100dvh-var(--spacing-topbar))] flex-col md:-mx-6">
      <TopbarSlot
        largura="bleed"
        trilha={[{ rotulo: "Quadros", href: "/kanban" }, { rotulo: quadro.titulo }]}
        acoes={
          <>
            {quadro.equipeId && (
              <Button
                variant={filtroEMeu ? "primary" : "secondary"}
                size="sm"
                aria-pressed={filtroEMeu}
                onClick={() => meuId && alternarFiltroPorResponsavel(meuId, "você")}
              >
                <UserCheckIcon className="sm:hidden" /> <span className="max-sm:hidden">Atribuídos a mim</span>
                {atribuidosAMim > 0 && <span className="text-micro tabular-nums opacity-70">{atribuidosAMim}</span>}
              </Button>
            )}
            {menuTrocarQuadro}
            {menuMais}
          </>
        }
      />
      <CamadaFundo quadro={quadro} automatico={automatico} rascunho={rascunhoFoto} />
      <div className="space-y-5 px-4 pt-8 transition-colors duration-slow md:px-10 md:pt-10" style={contraste ? estiloDoContraste[contraste] : undefined}>
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0 flex-[1_1_20rem] space-y-3">
            <div className="flex items-center gap-3">
              <DropdownMenu>
                {/* O ícone acompanha a altura do título (antes 20px, sumia ao lado dele). */}
                <DropdownMenuTrigger aria-label="Trocar ícone do quadro" className="flex size-11 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-raised hover:text-paper md:size-12">
                  <Icone nome={quadro.icone} className="size-7 md:size-8" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-auto">
                  <div className="grid max-h-72 grid-cols-8 gap-0.5 overflow-y-auto">
                    {iconesNota.map((icone) => (
                      <DropdownMenuItem key={icone} aria-label={icone} className="justify-center" onClick={() => atualizarQuadro(quadro.id, { icone })}>
                        <Icone nome={icone} />
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <TituloQuadro key={quadro.id} quadroId={quadro.id} titulo={quadro.titulo} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {equipeDoQuadro && <AvatarStack pessoas={equipeDoQuadro.membros.map((membro) => ({ id: membro.id, nome: membro.nome, foto: membro.foto }))} max={5} />}
              <StatList
                stats={[
                  { label: cartoesDoQuadro.length === 1 ? "cartão" : "cartões", value: cartoesDoQuadro.length },
                  { label: concluidos === 1 ? "concluído" : "concluídos", value: concluidos },
                  ...(atrasados > 0 ? [{ label: atrasados === 1 ? "atrasado" : "atrasados", value: atrasados }] : []),
                ]}
              />
              {meuPapel && <span className="text-ui text-ink-soft" title={descricoesPapel[meuPapel]}>Você é {rotulosPapel[meuPapel].toLowerCase()}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PainelPersonalizar
              aberto={personalizarAberto}
              aoMudarAberto={setPersonalizarAberto}
              titulo="Opções do quadro"
              rotuloBotao="Opções do quadro"
              descricao="As mudanças aparecem na hora."
              tamanhoBotao="sm"
              aoRestaurar={() => {
                definirExibicao(quadro.id, exibicaoPadrao)
                atualizarQuadro(quadro.id, { fundo: null, imagemFundo: null })
              }}
            >
              <SecaoPersonalizar titulo="Fundo do quadro">
                <SeletorFundo fundo={quadro.fundo} imagem={quadro.imagemFundo} aoMudar={(mudancas) => atualizarQuadro(quadro.id, mudancas)} aoAjustarFoto={(arquivo) => void ajustarFoto(arquivo)} />
                {avisoFoto && !rascunhoFoto && (
                  <p role="alert" className="text-small text-paper">
                    {avisoFoto}
                  </p>
                )}
              </SecaoPersonalizar>
              <SecaoPersonalizar titulo="Mostrar nos cartões">
                <Interruptor rotulo="Caixa para concluir" descricao="Marca o cartão como feito sem abrir." marcado={exibicao.concluir} aoMudar={(marcado) => definirExibicao(quadro.id, { concluir: marcado })} />
                <Interruptor rotulo="Etiquetas" marcado={exibicao.etiquetas} aoMudar={(marcado) => definirExibicao(quadro.id, { etiquetas: marcado })} />
                <Interruptor rotulo="Prioridade" marcado={exibicao.prioridade} aoMudar={(marcado) => definirExibicao(quadro.id, { prioridade: marcado })} />
                <Interruptor rotulo="Comentários" marcado={exibicao.comentarios} aoMudar={(marcado) => definirExibicao(quadro.id, { comentarios: marcado })} />
                <Interruptor rotulo="Prazo" marcado={exibicao.prazo} aoMudar={(marcado) => definirExibicao(quadro.id, { prazo: marcado })} />
                <Interruptor rotulo="Trecho da descrição" marcado={exibicao.descricao} aoMudar={(marcado) => definirExibicao(quadro.id, { descricao: marcado })} />
                <Interruptor rotulo="Nota vinculada" marcado={exibicao.nota} aoMudar={(marcado) => definirExibicao(quadro.id, { nota: marcado })} />
              </SecaoPersonalizar>
              <SecaoPersonalizar titulo="Checklist no cartão">
                <OpcoesLadoALado
                  rotulo="Checklist no cartão"
                  valor={exibicao.checklist}
                  aoMudar={(checklist) => definirExibicao(quadro.id, { checklist })}
                  opcoes={[
                    { valor: "oculto", rotulo: "Oculta" },
                    { valor: "progresso", rotulo: "Progresso" },
                    { valor: "itens", rotulo: "Itens" },
                  ]}
                />
                <p className="text-small text-ink-soft">“Itens” mostra a lista no cartão para marcar sem abrir.</p>
              </SecaoPersonalizar>
            </PainelPersonalizar>
            <Segmented
              label="Visão do quadro"
              value={visao}
              onChange={(valor) => definirVisao(quadro.id, valor)}
              options={[
                { value: "quadro", label: "Quadro" },
                { value: "lista", label: "Lista" },
                { value: "calendario", label: "Calendário" },
              ]}
            />
          </div>
        </header>

        {(avisoEquipe || erroEquipe) && quadro.equipeId && (
          <p role="alert" className="flex items-center gap-2 rounded-md border border-line-strong px-3 py-2 text-small text-paper">
            <AlertCircleIcon className="size-4" /> {erroEquipe ?? avisoEquipe}
          </p>
        )}
        {meuPapel === "leitor" && <p className="text-small text-ink-soft">Somente leitura neste quadro.</p>}

        {/* Filtros (ficam na URL: ?tag=…&atrasados=1) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-md:min-w-0 max-md:flex-1">
            <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
            <Input inputSize="sm" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Filtrar cartões" aria-label="Filtrar cartões" className="w-full pl-9 md:w-64" />
          </div>
          <Button variant="secondary" size="sm" className="md:hidden" aria-expanded={mostrarFiltros} onClick={() => setMostrarFiltros(!mostrarFiltros)}>
            <FilterIcon /> Filtros {filtrosAtivos > 0 && <span className="tabular-nums">{filtrosAtivos}</span>}
          </Button>
          <div className={cn("contents", !mostrarFiltros && "max-md:hidden")}>
            {quadro.etiquetas.length > 0 && <span aria-hidden="true" className="mx-1 h-6 w-px bg-line-strong" />}
            {quadro.etiquetas.map((etiqueta) => {
              const ativa = filtroEtiquetas.some((filtro) => idDaEtiqueta(filtro) === etiqueta.id)
              return (
                <ToggleChip
                  key={etiqueta.id}
                  pressed={ativa}
                  onPressedChange={(ligar) => setFiltroEtiquetas(ligar ? [...filtroEtiquetas, etiqueta.id] : filtroEtiquetas.filter((filtro) => idDaEtiqueta(filtro) !== etiqueta.id))}
                >
                  <PontoTinta cor={etiqueta.cor} />
                  {etiqueta.nome}
                </ToggleChip>
              )
            })}
            <span aria-hidden="true" className="mx-1 h-6 w-px bg-line-strong" />
            <ToggleChip pressed={soAtrasados} onPressedChange={setSoAtrasados}>
              Atrasados
            </ToggleChip>
            <DropdownMenu>
              <DropdownMenuTrigger render={<button type="button" aria-pressed={filtroPrioridades.length > 0} className={cn(chipVariants({ variant: "filter" }), "cursor-pointer")} />}>
                Prioridade{filtroPrioridades.length > 0 && <span className="tabular-nums">{filtroPrioridades.length}</span>}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {(["alta", "media", "baixa"] as const).map((prioridade) => (
                  <DropdownMenuCheckboxItem
                    key={prioridade}
                    checked={filtroPrioridades.includes(prioridade)}
                    onCheckedChange={(ligar) => setFiltroPrioridades(ligar ? [...filtroPrioridades, prioridade] : filtroPrioridades.filter((item) => item !== prioridade))}
                  >
                    <PriorityIcon priority={prioridade} /> {estilosPrioridade[prioridade].titulo}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {equipeDoQuadro && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<button type="button" aria-pressed={Boolean(responsavelFiltrado)} className={cn(chipVariants({ variant: "filter" }), "cursor-pointer")} />}>
                  {responsavelFiltrado ? (responsavelFiltrado.id === meuId ? "Responsável: você" : `Responsável: ${responsavelFiltrado.nome}`) : "Responsável"}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {equipeDoQuadro.membros.map((membro) => (
                    <DropdownMenuItem key={membro.id} onClick={() => alternarFiltroPorResponsavel(membro.id, membro.id === meuId ? "você" : membro.nome)}>
                      <AvatarPessoa nome={membro.nome} foto={membro.foto} tamanho="sm" /> {membro.nome}
                      {responsavelFiltrado?.id === membro.id && <CheckIcon className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {visao === "quadro" && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<button type="button" aria-pressed={raia !== "nenhuma"} className={cn(chipVariants({ variant: "filter" }), "cursor-pointer")} />}>
                  <Rows3Icon /> {raia === "nenhuma" ? "Raias" : rotulosRaia[raia]}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuGroup>
                  <DropdownMenuLabel>Agrupar o quadro</DropdownMenuLabel>
                  {(Object.keys(rotulosRaia) as RaiaKanban[])
                    .filter((opcao) => opcao !== "responsavel" || equipeDoQuadro)
                    .map((opcao) => (
                      <DropdownMenuItem key={opcao} onClick={() => definirRaia(quadro.id, opcao)}>
                        {rotulosRaia[opcao]} {raia === opcao && <CheckIcon className="ml-auto" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {filtrando && (
            <Button variant="ghost" size="sm" onClick={() => { setBusca(""); setFiltroEtiquetas([]); setFiltroPrioridades([]); setSoAtrasados(false); filtrarPorResponsavel(null) }}>
              <XIcon /> Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {avisoArquivo && (
        <p role="alert" className="mx-4 mt-2 rounded-md border border-line-strong px-3 py-2 text-small text-paper md:mx-10">
          {avisoArquivo}
        </p>
      )}
      <input ref={entradaArquivo} type="file" accept=".json,application/json" className="hidden" onChange={aoEscolherArquivo} aria-label="Importar quadro" />

      {visao === "lista" && (
        <div key="lista" className="animacao-visao">
        <VisaoLista
          cartoes={cartoesDoQuadro.filter(visivel)}
          colunas={colunas}
          etiquetas={quadro.etiquetas}
          vidro={vidro}
          aoAbrir={(cartao) => setIdAberto(cartao.id)}
        />
        </div>
      )}
      {visao === "calendario" && (
        <div key="calendario" className="animacao-visao"><VisaoCalendario cartoes={cartoesDoQuadro.filter(visivel)} colunas={colunas} vidro={vidro} aoAbrir={(cartao) => setIdAberto(cartao.id)} somenteLeitura={meuPapel === "leitor"} /></div>
      )}

      {/* Colunas */}
      {visao === "quadro" && <DndContext
        id="quadro-kanban"
        sensors={sensores}
        collisionDetection={detectarColisao}
        onDragStart={({ active }) => {
          setIdArrastado((active.data.current?.cartaoId as string) ?? null)
          setColunaArrastadaId((active.data.current?.colunaArrastadaId as string) ?? null)
        }}
        onDragEnd={aoSoltar}
        onDragCancel={() => {
          setIdArrastado(null)
          setColunaArrastadaId(null)
        }}
        accessibility={{
          screenReaderInstructions: {
            draggable: "Pressione espaço para pegar, use as setas para mover e espaço para soltar.",
          },
        }}
      >
        {raia !== "nenhuma" ? (
          <RaiasKanban
            raias={montarRaias(raia, cartoesDoQuadro.filter(visivel), quadro.etiquetas, membrosDoQuadro)}
            colunas={colunas}
            etiquetas={quadro.etiquetas}
            exibicao={exibicao}
            vidro={vidro}
            aoAbrirCartao={(cartao) => setIdAberto(cartao.id)}
            aoMoverColuna={moverColunaPorMenu}
            aoExcluirColuna={setColunaParaExcluir}
          />
        ) : (
        <div className="flex flex-1 snap-x items-start gap-4 overflow-x-auto px-4 pt-4 pb-8 md:px-10 md:pt-6">
          {colunas.map((coluna, indice) => (
            <Coluna
              key={coluna.id}
              coluna={coluna}
              cartoes={cartoes.filter((cartao) => cartao.colunaId === coluna.id && visivel(cartao))}
              etiquetas={quadro.etiquetas}
              exibicao={exibicao}
              vidro={vidro}
              posicao={indice}
              total={colunas.length}
              aoAbrirCartao={(cartao) => setIdAberto(cartao.id)}
              aoMover={(delta) => moverColunaPorMenu(coluna, delta)}
              aoExcluir={() => setColunaParaExcluir(coluna)}
            />
          ))}

          {/* Nova coluna */}
          {novaColuna === null ? (
            <button
              type="button"
              onClick={() => setNovaColuna("")}
              className={cn("flex h-control w-[80vw] max-w-column shrink-0 items-center gap-2 rounded-lg border border-dashed border-line-strong px-3 text-ui text-ink-soft hover:border-ink-muted hover:text-paper sm:w-column", vidro && "bg-panel/90 backdrop-blur-xl")}
            >
              <PlusIcon className="size-4" /> Nova coluna
            </button>
          ) : (
            <form
              className="w-[80vw] max-w-column shrink-0 space-y-2 rounded-lg border border-line-strong bg-panel p-2 sm:w-column"
              onSubmit={(evento) => {
                evento.preventDefault()
                if (!novaColuna.trim()) return
                adicionarColuna(quadro.id, novaColuna)
                setNovaColuna("")
              }}
            >
              <Input
                autoFocus
                value={novaColuna}
                onChange={(evento) => setNovaColuna(evento.target.value)}
                onKeyDown={(evento) => evento.key === "Escape" && setNovaColuna(null)}
                placeholder="Nome da coluna…"
                aria-label="Nome da nova coluna"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">Adicionar</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setNovaColuna(null)}>Cancelar</Button>
              </div>
            </form>
          )}
        </div>
        )}

        <DragOverlay>
          {cartaoArrastado && (
            <ConteudoCartao
              cartao={cartaoArrastado}
              etiquetas={quadro.etiquetas}
              exibicao={exibicao}
              concluido={Boolean(colunas.find((coluna) => coluna.id === cartaoArrastado.colunaId)?.concluida)}
              arrastando
            />
          )}
          {colunaArrastada && (
            <div className="w-column -rotate-1 rounded-lg bg-panel p-3 text-ui font-semibold text-paper shadow-drag">
              {colunaArrastada.titulo}
            </div>
          )}
        </DragOverlay>
      </DndContext>}

      <DialogoCartao
        cartao={cartaoAberto}
        aoFechar={() => {
          setIdAberto(null)
        }}
      />
      <DialogoArquivados cartoes={arquivados} aberto={verArquivados} aoMudarAberto={setVerArquivados} aoAbrirCartao={(cartao) => { setVerArquivados(false); setIdAberto(cartao.id) }} />
      <AvisoDesfazer />
      {rascunhoFoto && (
        <AjusteFotoAoVivo
          ajuste={rascunhoFoto.ajuste}
          aoMudar={(ajuste) => setRascunhoFoto((atual) => (atual ? { ...atual, ajuste } : atual))}
          aoTrocarFoto={(arquivo) => {
            setPreparandoFoto(true)
            prepararFoto(arquivo)
              .then((imagem) => setRascunhoFoto({ imagem, ajuste: ajusteFotoPadrao }))
              .catch((erro) => setAvisoFoto(erro instanceof Error ? erro.message : "Não consegui usar essa imagem."))
              .finally(() => setPreparandoFoto(false))
          }}
          aoRemover={() => {
            atualizarQuadro(quadro.id, { fundo: null, imagemFundo: null })
            setRascunhoFoto(null)
          }}
          aoCancelar={() => {
            setRascunhoFoto(null)
            setAvisoFoto(null)
          }}
          aoAplicar={() => {
            atualizarQuadro(quadro.id, { ...(rascunhoFoto.imagem !== quadro.imagemFundo ? { imagemFundo: rascunhoFoto.imagem } : {}), fundo: codificarAjusteFoto(rascunhoFoto.ajuste) })
            setRascunhoFoto(null)
          }}
          preparando={preparandoFoto}
          aviso={avisoFoto}
        />
      )}
      <DialogoModelos aberto={escolhendoModelo} aoMudarAberto={setEscolhendoModelo} />
      <DialogoResumo
        aberto={verResumo}
        aoMudarAberto={setVerResumo}
        quadro={quadro}
        colunas={colunas}
        cartoes={cartoesDoQuadro}
        membros={equipeDoQuadro ? membrosDoQuadro : undefined}
        aoAbrirCartao={(cartao) => {
          setVerResumo(false)
          setIdAberto(cartao.id)
        }}
      />
      <PaineisKanban />
      <DialogoCompartilhar quadro={quadro} aberto={compartilhando} aoMudarAberto={setCompartilhando} />
      <DialogoEtiquetas quadro={quadro} aberto={editandoEtiquetas} aoMudarAberto={setEditandoEtiquetas} />
      <DialogoExcluirColuna
        coluna={colunaParaExcluir}
        outras={colunas.filter((coluna) => coluna.id !== colunaParaExcluir?.id)}
        totalCartoes={cartoes.filter((cartao) => cartao.colunaId === colunaParaExcluir?.id).length}
        aoFechar={() => setColunaParaExcluir(null)}
      />
      <AlertDialog open={excluindoQuadro} onOpenChange={setExcluindoQuadro}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir o quadro “{quadro.titulo}”?</AlertDialogTitle>
            <AlertDialogDescription>
              As {colunas.length} coluna(s) e os {cartoesDoQuadro.length} cartão(ões) dele também serão excluídos
              {quadro.equipeId ? ", para todas as pessoas da equipe" : ""}. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="danger"
              onClick={() => {
                excluirQuadro(quadro.id)
                setExcluindoQuadro(false)
              }}
            >
              Excluir quadro
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
