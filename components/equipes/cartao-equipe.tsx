"use client"

// Rafael Marques - 23/10/2026
// Uma equipe na página "Equipes": quadros, membros e convites.

import { useEffect, useState } from "react"
import {
  CheckIcon,
  CopyIcon,
  LinkIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UserMinusIcon,
  XIcon,
} from "lucide-react"

import { AvatarPessoa } from "@/components/equipes/avatar-pessoa"
import { Icone } from "@/components/icone"
import { cn } from "@/lib/utils"
import { classeSelect } from "@/components/tarefas/dialogo-tarefa"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { chamarApi, mensagemDoErro } from "@/lib/equipes/api"
import { useKanban } from "@/lib/estado/kanban"
import { fecharPainelKanban } from "@/lib/estado/paineis-kanban"
import { criarQuadroDeEquipe, recarregarEquipes } from "@/lib/estado/sincronizacao-equipes"
import {
  descricoesPapel,
  rotulosPapel,
  type ConviteEquipe,
  type Equipe,
  type MembroEquipe,
  type PapelConvite,
  type PapelEquipe,
} from "@/lib/tipos-equipe"

type Confirmacao = { tipo: "sair" } | { tipo: "excluir" } | { tipo: "remover"; membro: MembroEquipe } | null

function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
}

// Convites em aberto (só o dono): gera link, copia e cancela.
function Convites({ equipe }: { equipe: Equipe }) {
  const [convites, setConvites] = useState<ConviteEquipe[] | null>(null)
  const [papel, setPapel] = useState<PapelConvite>("editor")
  const [email, setEmail] = useState("")
  const [link, setLink] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    try {
      setConvites((await chamarApi<{ convites: ConviteEquipe[] }>(`/api/equipes/${equipe.id}/convites`)).convites)
    } catch (falha) {
      setErro(mensagemDoErro(falha))
    }
  }

  useEffect(() => {
    let ativo = true
    chamarApi<{ convites: ConviteEquipe[] }>(`/api/equipes/${equipe.id}/convites`)
      .then((resposta) => ativo && setConvites(resposta.convites))
      .catch(() => undefined)
    return () => {
      ativo = false
    }
  }, [equipe.id])

  async function gerar() {
    setOcupado(true)
    setErro(null)
    try {
      const { token } = await chamarApi<{ token: string }>(`/api/equipes/${equipe.id}/convites`, {
        metodo: "POST",
        corpo: { papel, email: email.trim() || null },
      })
      setLink(`${window.location.origin}/convite/${token}`)
      setCopiado(false)
      setEmail("")
      await carregar()
    } catch (falha) {
      setErro(mensagemDoErro(falha))
    } finally {
      setOcupado(false)
    }
  }

  async function copiar() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
    } catch {
      setErro("Não foi possível copiar. Selecione o link e copie à mão.")
    }
  }

  return (
    <section className="space-y-3">
      <p className="flex gap-2 text-xs text-muted-foreground">
        <LinkIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>
        O link vale por 7 dias e só pode ser usado uma vez. Quem abrir precisa entrar (ou criar conta) para aceitar. Se você digitar um e-mail, só
        essa conta consegue aceitar.
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <select value={papel} onChange={(evento) => setPapel(evento.target.value as PapelConvite)} className={cn(classeSelect, "w-32")} aria-label="Papel do convidado">
          <option value="editor">Editor</option>
          <option value="leitor">Leitor</option>
        </select>
        <Input
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          type="email"
          placeholder="E-mail (opcional)"
          aria-label="E-mail do convidado (opcional)"
          className="h-8 min-w-48 flex-1"
        />
        <Button size="sm" onClick={gerar} disabled={ocupado}>
          {ocupado ? <Spinner /> : <PlusIcon />} Gerar link
        </Button>
      </div>
      {link && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
          <input readOnly value={link} aria-label="Link do convite" onFocus={(evento) => evento.currentTarget.select()} className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
          <Button size="xs" variant="outline" onClick={copiar}>
            {copiado ? <CheckIcon /> : <CopyIcon />} {copiado ? "Copiado" : "Copiar"}
          </Button>
        </div>
      )}
      {erro && <p role="alert" className="text-xs text-destructive">{erro}</p>}
      {convites && convites.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {convites.map((convite) => (
            <li key={convite.id} className="flex items-center gap-2 px-3 py-1.5 text-xs">
              <Badge variant="secondary">{rotulosPapel[convite.papel]}</Badge>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {convite.email ?? "Qualquer pessoa com o link"} · expira em {dataCurta(convite.expiraEm)}
              </span>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Cancelar convite"
                onClick={async () => {
                  await chamarApi(`/api/equipes/${equipe.id}/convites/${convite.id}`, { metodo: "DELETE" }).catch((falha) => setErro(mensagemDoErro(falha)))
                  await carregar()
                }}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function CartaoEquipe({ equipe, meuId }: { equipe: Equipe; meuId: string }) {
  const definirQuadroAtivo = useKanban((estado) => estado.definirQuadroAtivo)
  const souDono = equipe.meuPapel === "dono"
  const podeEditar = equipe.meuPapel !== "leitor"
  const [renomeando, setRenomeando] = useState<string | null>(null)
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null)
  const [anonimizar, setAnonimizar] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function executar(acao: () => Promise<unknown>) {
    setOcupado(true)
    setErro(null)
    try {
      await acao()
      await recarregarEquipes()
    } catch (falha) {
      setErro(mensagemDoErro(falha))
    } finally {
      setOcupado(false)
    }
  }

  function abrirQuadro(id: string) {
    definirQuadroAtivo(id)
    fecharPainelKanban()
  }

  async function confirmar() {
    if (!confirmacao) return
    const escolha = confirmacao
    setConfirmacao(null)
    await executar(async () => {
      if (escolha.tipo === "excluir") await chamarApi(`/api/equipes/${equipe.id}`, { metodo: "DELETE" })
      else if (escolha.tipo === "sair") await chamarApi(`/api/equipes/${equipe.id}/membros/${meuId}${anonimizar ? "?anonimizar=1" : ""}`, { metodo: "DELETE" })
      else await chamarApi(`/api/equipes/${equipe.id}/membros/${escolha.membro.id}${anonimizar ? "?anonimizar=1" : ""}`, { metodo: "DELETE" })
    })
    setAnonimizar(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {renomeando !== null ? (
              <form
                className="flex gap-2"
                onSubmit={async (evento) => {
                  evento.preventDefault()
                  const nome = renomeando
                  setRenomeando(null)
                  if (nome.trim() && nome.trim() !== equipe.nome) await executar(() => chamarApi(`/api/equipes/${equipe.id}`, { metodo: "PATCH", corpo: { nome } }))
                }}
              >
                <Input autoFocus value={renomeando} onChange={(evento) => setRenomeando(evento.target.value)} maxLength={80} aria-label="Nome da equipe" className="h-8" />
                <Button type="submit" size="sm">Salvar</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setRenomeando(null)}>Cancelar</Button>
              </form>
            ) : (
              <CardTitle className="flex flex-wrap items-center gap-2">
                <span className="truncate">{equipe.nome}</span>
                <Badge variant="secondary" title={descricoesPapel[equipe.meuPapel]}>{rotulosPapel[equipe.meuPapel]}</Badge>
              </CardTitle>
            )}
            <CardDescription>
              {equipe.membros.length} {equipe.membros.length === 1 ? "pessoa" : "pessoas"} · {equipe.quadros.length} {equipe.quadros.length === 1 ? "quadro" : "quadros"}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Opções da equipe ${equipe.nome}`} />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {souDono && <DropdownMenuItem onClick={() => setRenomeando(equipe.nome)}><PencilIcon /> Renomear</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => setConfirmacao({ tipo: "sair" })}><LogOutIcon /> Sair da equipe</DropdownMenuItem>
              {souDono && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setConfirmacao({ tipo: "excluir" })}><Trash2Icon /> Excluir equipe</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Rafael Marques - 29/10/2026: conteúdo em abas, para a janela não virar uma coluna comprida. */}
      <CardContent>
        {erro && <p role="alert" className="mb-3 text-sm text-destructive">{erro}</p>}
        <Tabs defaultValue="quadros">
          <TabsList variant="line" className="mb-3 w-full justify-start border-b">
            <TabsTrigger value="quadros" className="flex-none">Quadros <span className="text-xs text-muted-foreground">{equipe.quadros.length}</span></TabsTrigger>
            <TabsTrigger value="membros" className="flex-none">Membros <span className="text-xs text-muted-foreground">{equipe.membros.length}</span></TabsTrigger>
            {souDono && <TabsTrigger value="convites" className="flex-none">Convites</TabsTrigger>}
          </TabsList>

          <TabsContent value="quadros" className="space-y-2">
            {equipe.quadros.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                Nenhum quadro ainda.{podeEditar ? " Crie um aqui, ou use “Compartilhar com equipe” no menu de um quadro seu." : ""}
              </p>
            ) : (
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {equipe.quadros.map((quadro) => (
                  <li key={quadro.id}>
                    <button
                      type="button"
                      onClick={() => abrirQuadro(quadro.id)}
                      className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                    >
                      <Icone nome={quadro.icone} className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{quadro.titulo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {podeEditar && (
              <Button size="sm" variant="ghost" className="text-muted-foreground" disabled={ocupado} onClick={() => executar(async () => abrirQuadro(await criarQuadroDeEquipe(equipe.id)))}>
                <PlusIcon /> Novo quadro
              </Button>
            )}
          </TabsContent>

          <TabsContent value="membros" className="space-y-3">
            <ul className="divide-y rounded-lg border">
              {equipe.membros.map((membro) => (
                <li key={membro.id} className="flex items-center gap-2.5 px-3 py-2">
                  <AvatarPessoa nome={membro.nome} foto={membro.foto} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {membro.nome} {membro.id === meuId && <span className="font-normal text-muted-foreground">(você)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{membro.email}</p>
                  </div>
                  {souDono ? (
                    <select
                      value={membro.papel}
                      disabled={ocupado}
                      onChange={(evento) =>
                        void executar(() => chamarApi(`/api/equipes/${equipe.id}/membros/${membro.id}`, { metodo: "PATCH", corpo: { papel: evento.target.value as PapelEquipe } }))
                      }
                      className={cn(classeSelect, "w-28 shrink-0")}
                      aria-label={`Papel de ${membro.nome}`}
                    >
                      <option value="dono">Dono</option>
                      <option value="editor">Editor</option>
                      <option value="leitor">Leitor</option>
                    </select>
                  ) : (
                    <Badge variant="outline" title={descricoesPapel[membro.papel]}>{rotulosPapel[membro.papel]}</Badge>
                  )}
                  {souDono && (
                    membro.id !== meuId ? (
                      <Button size="icon-sm" variant="ghost" className="shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Remover ${membro.nome}`} onClick={() => setConfirmacao({ tipo: "remover", membro })}>
                        <UserMinusIcon />
                      </Button>
                    ) : (
                      <span className="size-7 shrink-0" aria-hidden />
                    )
                  )}
                </li>
              ))}
            </ul>
            <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
              {(["dono", "editor", "leitor"] as const).map((papel) => (
                <div key={papel}>
                  <dt className="inline font-medium text-foreground">{rotulosPapel[papel]}: </dt>
                  <dd className="inline">{descricoesPapel[papel].toLowerCase()}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>

          {souDono && (
            <TabsContent value="convites">
              <Convites equipe={equipe} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>

      <AlertDialog open={confirmacao !== null} onOpenChange={(aberto) => !aberto && setConfirmacao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmacao?.tipo === "excluir" && `Excluir a equipe “${equipe.nome}”?`}
              {confirmacao?.tipo === "sair" && `Sair da equipe “${equipe.nome}”?`}
              {confirmacao?.tipo === "remover" && `Remover ${confirmacao.membro.nome} da equipe?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmacao?.tipo === "excluir" && "Todos os quadros e cartões da equipe serão apagados para todos os membros. Essa ação não pode ser desfeita."}
              {confirmacao?.tipo === "sair" && "Você perde o acesso aos quadros da equipe. Os cartões atribuídos a você ficam sem responsável."}
              {confirmacao?.tipo === "remover" && "A pessoa perde o acesso aos quadros da equipe. Os cartões atribuídos a ela ficam sem responsável."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(confirmacao?.tipo === "sair" || confirmacao?.tipo === "remover") && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={anonimizar} onChange={(evento) => setAnonimizar(evento.target.checked)} className="mt-0.5 size-4 accent-primary" />
              <span>Trocar {confirmacao?.tipo === "sair" ? "meu nome" : "o nome dela"} nos comentários e no histórico por “Ex-membro”.</span>
            </label>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant={confirmacao?.tipo === "sair" ? "default" : "destructive"} onClick={confirmar}>
              {confirmacao?.tipo === "excluir" ? "Excluir equipe" : confirmacao?.tipo === "sair" ? "Sair" : "Remover"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
