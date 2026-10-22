"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import {
  CircleUserRoundIcon,
  DatabaseBackupIcon,
  DownloadIcon,
  FileArchiveIcon,
  KeyRoundIcon,
  LibraryIcon,
  LogOutIcon,
  MapPinIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UploadIcon,
  UserPenIcon,
} from "lucide-react"

import { LinkDocumento } from "@/components/conta/documentos-legais"
import { useConta } from "@/components/conta/portao-conta"
import { CabecalhoPagina, Pagina } from "@/components/pagina"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Icone } from "@/components/icone"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotas } from "@/lib/estado/notas"
import { enviarPendentes } from "@/lib/estado/sincronizacao"
import { baixarTudoEmMarkdown, exportarLivroZip, lerBackup, restaurarBackup, type ResumoBackup } from "@/lib/exportar"
import { alterarSenha, atualizarNome, excluirConta, sairDeTodosOsAparelhos, type EstadoAcaoConta } from "@/lib/servidor/acoes-conta"

function Aviso({ estado }: { estado: EstadoAcaoConta }) {
  if (estado?.erro) return <p role="alert" className="text-sm text-destructive">{estado.erro}</p>
  if (estado?.ok) return <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{estado.ok}</p>
  return null
}

function CartaoPerfil() {
  const conta = useConta()
  const [estado, acao, enviando] = useActionState(atualizarNome, undefined)
  const id = useId()
  const atualizarUsuario = conta?.atualizarUsuario

  useEffect(() => {
    if (estado?.nome) atualizarUsuario?.({ nome: estado.nome })
  }, [estado, atualizarUsuario])

  if (!conta) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserPenIcon className="size-4" /> Perfil</CardTitle>
        <CardDescription>Corrija seus dados quando quiser.</CardDescription>
      </CardHeader>
      <form action={acao} className="flex flex-1 flex-col gap-(--card-spacing)">
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!estado?.erros?.nome || undefined}>
              <FieldLabel htmlFor={`${id}-nome`}>Nome</FieldLabel>
              <Input id={`${id}-nome`} name="nome" defaultValue={conta.usuario.nome} maxLength={80} required aria-invalid={!!estado?.erros?.nome || undefined} />
              <FieldError>{estado?.erros?.nome}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-email`}>E-mail</FieldLabel>
              <Input id={`${id}-email`} value={conta.usuario.email} disabled readOnly />
              <FieldDescription>Usado para entrar na conta.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-auto justify-between gap-3">
          <Aviso estado={estado} />
          <Button type="submit" className="ml-auto" disabled={enviando}>{enviando && <Spinner />} Salvar</Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function CartaoSenha() {
  const [estado, acao, enviando] = useActionState(alterarSenha, undefined)
  const id = useId()
  const erros = estado?.erros ?? {}
  const campos = [
    { nome: "atual", rotulo: "Senha atual", autoComplete: "current-password" },
    { nome: "nova", rotulo: "Nova senha", autoComplete: "new-password" },
    { nome: "confirmacao", rotulo: "Confirme a nova senha", autoComplete: "new-password" },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRoundIcon className="size-4" /> Senha</CardTitle>
        <CardDescription>Ao trocar, as sessões nos outros aparelhos são encerradas.</CardDescription>
      </CardHeader>
      <form action={acao} className="flex flex-1 flex-col gap-(--card-spacing)">
        <CardContent>
          <FieldGroup>
            {campos.map((campo) => (
              <Field key={campo.nome} data-invalid={!!erros[campo.nome] || undefined}>
                <FieldLabel htmlFor={`${id}-${campo.nome}`}>{campo.rotulo}</FieldLabel>
                <Input id={`${id}-${campo.nome}`} name={campo.nome} type="password" autoComplete={campo.autoComplete} required aria-invalid={!!erros[campo.nome] || undefined} />
                <FieldError>{erros[campo.nome]}</FieldError>
              </Field>
            ))}
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-auto justify-between gap-3">
          <Aviso estado={estado} />
          <Button type="submit" className="ml-auto" disabled={enviando}>{enviando && <Spinner />} Trocar senha</Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function descreverResumo(resumo: ResumoBackup) {
  return `${resumo.livros} livro(s), ${resumo.notas} nota(s), ${resumo.tarefas} tarefa(s), ${resumo.habitos} hábito(s), ${resumo.rotina} item(ns) de rotina e ${resumo.cartoes} cartão(ões) do Kanban`
}

// Tudo fica salvo na conta: aqui só ficam as cópias para levar a outro lugar
// (JSON completo e notas em Markdown) e a importação de backups antigos.
function CartaoDados() {
  const { livros, notas } = useNotas(useShallow((estado) => ({ livros: estado.livros, notas: estado.notas })))
  const [lido, setLido] = useState<ReturnType<typeof lerBackup> | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null)

  async function escolherArquivo(arquivo: File | undefined) {
    if (!arquivo) return
    try {
      setLido(lerBackup(await arquivo.text()))
      setMensagem(null)
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: erro instanceof Error ? erro.message : "Não foi possível ler o arquivo." })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DatabaseBackupIcon className="size-4" /> Seus dados</CardTitle>
        <CardDescription>Tudo fica salvo na sua conta automaticamente. Baixe uma cópia quando quiser levar para outro lugar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-2"><MapPinIcon className="size-4 shrink-0" /> Armazenados no Brasil (São Paulo), sem compartilhamento com terceiros.</p>
        <p className="flex items-center gap-2"><ShieldCheckIcon className="size-4 shrink-0" /> Senha guardada só como hash; conexões criptografadas.</p>
        {mensagem && (
          <p role="status" className={mensagem.tipo === "erro" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}>{mensagem.texto}</p>
        )}
      </CardContent>
      <CardFooter className="mt-auto flex-wrap gap-2">
        <Button nativeButton={false} render={<a href="/api/conta/exportar" download />} onClick={() => void enviarPendentes()}>
          <DownloadIcon /> Baixar meus dados
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" disabled={notas.length === 0} />}>
            <FileArchiveIcon /> Notas em Markdown
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => setMensagem({ tipo: "ok", texto: `${baixarTudoEmMarkdown()} arquivo(s) exportado(s).` })}>
              <LibraryIcon /> Todos os livros (.zip)
            </DropdownMenuItem>
            {livros.length > 0 && <DropdownMenuSeparator />}
            {livros.map((livro) => (
              <DropdownMenuItem key={livro.id} onClick={() => exportarLivroZip(livro, notas)}>
                <Icone nome={livro.icone} /> <span className="truncate">{livro.titulo}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" nativeButton={false} render={<label />} className="cursor-pointer">
          <UploadIcon /> Importar backup
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(evento) => {
              void escolherArquivo(evento.target.files?.[0])
              evento.target.value = ""
            }}
          />
        </Button>
      </CardFooter>

      <AlertDialog open={lido !== null} onOpenChange={(aberto) => !aberto && setLido(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar este backup?</AlertDialogTitle>
            <AlertDialogDescription>
              {lido && `Backup de ${lido.resumo.data}: ${descreverResumo(lido.resumo)}.`} Livros, notas, tarefas, hábitos, rotina e Kanban da conta
              serão substituídos. Se quiser, baixe seus dados antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                if (!lido) return
                restaurarBackup(lido.backup)
                setMensagem({ tipo: "ok", texto: `Backup importado: ${descreverResumo(lido.resumo)}.` })
                setLido(null)
              }}
            >
              Substituir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function CartaoPrivacidade() {
  const conta = useConta()
  const [confirmando, setConfirmando] = useState(false)
  const [saindo, setSaindo] = useState(false)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheckIcon className="size-4" /> Privacidade e sessões</CardTitle>
        <CardDescription>
          Leia a <LinkDocumento tipo="privacidade">Política de Privacidade</LinkDocumento> e os <LinkDocumento tipo="termos">Termos de Uso</LinkDocumento>.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Perdeu um aparelho ou entrou num computador de outra pessoa? Encerre todas as sessões, inclusive esta.
      </CardContent>
      <CardFooter className="mt-auto">
        <Button variant="outline" onClick={() => setConfirmando(true)}><LogOutIcon /> Sair de todos os aparelhos</Button>
      </CardFooter>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair de todos os aparelhos?</AlertDialogTitle>
            <AlertDialogDescription>Todas as sessões serão encerradas, inclusive esta. Seus dados continuam salvos na conta.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              disabled={saindo}
              onClick={async () => {
                setSaindo(true)
                await enviarPendentes()
                await sairDeTodosOsAparelhos()
                conta?.encerrarNesteNavegador()
              }}
            >
              {saindo && <Spinner />} Sair de todos
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function CartaoExcluir() {
  const conta = useConta()
  const [aberto, setAberto] = useState(false)
  const [estado, acao, enviando] = useActionState(excluirConta, undefined)
  const id = useId()
  const encerrar = conta?.encerrarNesteNavegador

  useEffect(() => {
    if (estado?.ok === "excluida") encerrar?.()
  }, [estado, encerrar])

  return (
    <Card className="ring-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive"><Trash2Icon className="size-4" /> Excluir conta</CardTitle>
        <CardDescription>Apaga a conta e todo o conteúdo (notas, tarefas, hábitos, rotina, Kanban) na hora, sem cópia guardada. Não dá para desfazer.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="destructive" onClick={() => setAberto(true)}><Trash2Icon /> Excluir minha conta</Button>
      </CardFooter>

      <AlertDialog open={aberto} onOpenChange={setAberto}>
        <AlertDialogContent>
          <form action={acao} className="grid gap-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir a conta para sempre?</AlertDialogTitle>
              <AlertDialogDescription>
                Se quiser guardar uma cópia, baixe seus dados antes. Para confirmar, digite sua senha.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Field data-invalid={!!estado?.erros?.senha || undefined}>
              <FieldLabel htmlFor={`${id}-senha`}>Senha</FieldLabel>
              <Input id={`${id}-senha`} name="senha" type="password" autoComplete="current-password" required aria-invalid={!!estado?.erros?.senha || undefined} />
              <FieldError>{estado?.erros?.senha ?? estado?.erro}</FieldError>
            </Field>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={enviando}>{enviando && <Spinner />} Excluir para sempre</Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// Rafael Marques - 22/10/2026
// "Minha conta": onde o titular exerce os direitos da LGPD (Art. 18) —
// corrigir, acessar/levar os dados, encerrar sessões e excluir a conta.
export function PaginaConta() {
  const conta = useConta()
  return (
    <Pagina>
      <CabecalhoPagina
        secao="Conta"
        icone={CircleUserRoundIcon}
        titulo="Minha conta"
        descricao={conta ? `Conectado como ${conta.usuario.email}` : undefined}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <CartaoPerfil />
        <CartaoSenha />
        <CartaoDados />
        <CartaoPrivacidade />
        <div className="lg:col-span-2">
          <CartaoExcluir />
        </div>
      </div>
    </Pagina>
  )
}
