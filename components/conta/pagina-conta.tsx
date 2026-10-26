"use client"

import { useActionState, useEffect, useId, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import {
  CameraIcon,
  CircleUserRoundIcon,
  DatabaseBackupIcon,
  DownloadIcon,
  FileArchiveIcon,
  FileTextIcon,
  FolderInputIcon,
  FolderOpenIcon,
  KeyRoundIcon,
  LibraryIcon,
  LogOutIcon,
  MapPinIcon,
  MonitorSmartphoneIcon,
  ScaleIcon,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { EnquadrarFoto } from "@/components/conta/enquadrar-foto"
import { recortarAvatar, type CorteAvatar } from "@/lib/imagem"
import { importarCofre, lerCofreDeArquivos, lerCofreDeZip, type CofreLido, type ResumoObsidian } from "@/lib/importar-obsidian"
import { useNotas } from "@/lib/estado/notas"
import { usePreferencias } from "@/lib/estado/preferencias"
import { enviarPendentes } from "@/lib/estado/sincronizacao"
import { baixarTudoEmMarkdown, exportarLivroZip, lerBackup, restaurarBackup, type ResumoBackup } from "@/lib/exportar"
import { alterarSenha, atualizarNome, excluirConta, sairDeTodosOsAparelhos, type EstadoAcaoConta } from "@/lib/servidor/acoes-conta"

function Aviso({ estado }: { estado: EstadoAcaoConta }) {
  if (estado?.erro) return <p role="alert" className="text-sm text-destructive">{estado.erro}</p>
  if (estado?.ok) return <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{estado.ok}</p>
  return null
}

// Rafael Marques - 23/10/2026: foto de perfil.
const TAMANHO_MAXIMO_FOTO = 10 * 1024 * 1024
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"]

// Foto de perfil: escolhida aqui, recortada em quadrado e guardada só na conta.
function FotoPerfil() {
  const conta = useConta()
  const foto = usePreferencias((dados) => dados.fotoPerfil)
  const definirFoto = usePreferencias((dados) => dados.definirFotoPerfil)
  const [erro, setErro] = useState<string | null>(null)
  const [lendo, setLendo] = useState(false)
  const [pendente, setPendente] = useState<File | null>(null)
  if (!conta) return null
  const nome = conta.usuario.nome || conta.usuario.email
  const iniciais = nome.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((parte) => parte[0].toUpperCase()).join("")

  // A pessoa escolhe o arquivo e depois enquadra o rosto antes de salvar.
  function escolher(arquivo: File | undefined) {
    if (!arquivo) return
    if (!TIPOS_FOTO.includes(arquivo.type)) return setErro("Use uma imagem JPG, PNG ou WebP.")
    if (arquivo.size > TAMANHO_MAXIMO_FOTO) return setErro("A imagem tem mais de 10 MB.")
    setErro(null)
    setPendente(arquivo)
  }

  async function salvar(arquivo: File, corte: CorteAvatar) {
    setLendo(true)
    try {
      definirFoto(await recortarAvatar(arquivo, corte))
      setPendente(null)
    } catch {
      setPendente(null)
      setErro("Não foi possível ler essa imagem.")
    } finally {
      setLendo(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        {foto && <AvatarImage src={foto} alt="Sua foto de perfil" />}
        <AvatarFallback className="bg-muted text-lg font-medium">{iniciais}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" nativeButton={false} render={<label />} className="cursor-pointer" disabled={lendo}>
            {lendo ? <Spinner /> : <CameraIcon />} {foto ? "Trocar foto" : "Adicionar foto"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(evento) => {
                escolher(evento.target.files?.[0])
                evento.target.value = ""
              }}
            />
          </Button>
          {foto && (
            <Button type="button" variant="ghost" size="sm" onClick={() => definirFoto(null)}>
              <Trash2Icon /> Remover
            </Button>
          )}
        </div>
        {erro ? (
          <p role="alert" className="text-xs text-destructive">{erro}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Opcional. Fica só na sua conta e entra no “Baixar meus dados”.</p>
        )}
      </div>
      {pendente && (
        <EnquadrarFoto
          key={`${pendente.name}-${pendente.lastModified}`}
          arquivo={pendente}
          salvando={lendo}
          onCancelar={() => setPendente(null)}
          onConfirmar={(arquivo, corte) => void salvar(arquivo, corte)}
        />
      )}
    </div>
  )
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
            <FotoPerfil />
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

function descreverImportacao(resumo: ResumoObsidian) {
  const partes = [`${resumo.notas} nota(s) importada(s)`, `${resumo.livros} livro(s) novo(s)`]
  if (resumo.repetidas) partes.push(`${resumo.repetidas} já existia(m)`)
  if (resumo.anexos) partes.push(`${resumo.anexos} anexo(s) ignorado(s)`)
  return `Obsidian: ${partes.join(", ")}.`
}

// Tudo fica salvo na conta: aqui só ficam as cópias para levar a outro lugar
// (JSON completo e notas em Markdown) e a importação de backups antigos.
function CartaoDados() {
  const { livros, notas } = useNotas(useShallow((estado) => ({ livros: estado.livros, notas: estado.notas })))
  const [lido, setLido] = useState<ReturnType<typeof lerBackup> | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null)
  const [cofre, setCofre] = useState<CofreLido | null>(null)
  const [lendoCofre, setLendoCofre] = useState(false)
  const entradaPasta = useRef<HTMLInputElement>(null)
  const entradaZip = useRef<HTMLInputElement>(null)
  const entradaNotas = useRef<HTMLInputElement>(null)

  async function escolherCofre(ler: () => Promise<CofreLido>) {
    setLendoCofre(true)
    try {
      setCofre(await ler())
      setMensagem(null)
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: erro instanceof Error ? erro.message : "Não foi possível ler o cofre." })
    } finally {
      setLendoCofre(false)
    }
  }

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
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" disabled={lendoCofre} />}>
            {lendoCofre ? <Spinner /> : <FolderInputIcon />} Importar do Obsidian
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuItem onClick={() => entradaPasta.current?.click()}>
              <FolderOpenIcon /> Pasta do cofre
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => entradaZip.current?.click()}>
              <FileArchiveIcon /> Cofre compactado (.zip)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => entradaNotas.current?.click()}>
              <FileTextIcon /> Notas soltas (.md)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          ref={entradaPasta}
          type="file"
          className="sr-only"
          {...{ webkitdirectory: "", directory: "" }}
          onChange={(evento) => {
            const arquivos = evento.target.files
            if (arquivos?.length) void escolherCofre(() => lerCofreDeArquivos(arquivos))
            evento.target.value = ""
          }}
        />
        <input
          ref={entradaZip}
          type="file"
          accept=".zip,application/zip"
          className="sr-only"
          onChange={(evento) => {
            const arquivo = evento.target.files?.[0]
            if (arquivo) void escolherCofre(() => lerCofreDeZip(arquivo))
            evento.target.value = ""
          }}
        />
        <input
          ref={entradaNotas}
          type="file"
          accept=".md,text/markdown"
          multiple
          className="sr-only"
          onChange={(evento) => {
            const arquivos = evento.target.files
            if (arquivos?.length) void escolherCofre(() => lerCofreDeArquivos(arquivos))
            evento.target.value = ""
          }}
        />
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

      <AlertDialog open={cofre !== null} onOpenChange={(aberto) => !aberto && setCofre(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar do Obsidian?</AlertDialogTitle>
            <AlertDialogDescription>
              {cofre &&
                `Encontrei ${cofre.resumo.notas} nota(s) em ${cofre.resumo.livros} pasta(s). Cada pasta vira um livro e as notas soltas ficam fora de livros. `}
              Suas notas atuais são mantidas: só acrescentamos as novas. Links [[assim]] e #tags continuam funcionando; imagens e outros anexos não são
              importados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              onClick={() => {
                if (!cofre) return
                const resumo = importarCofre(cofre)
                setMensagem({ tipo: "ok", texto: descreverImportacao(resumo) })
                setCofre(null)
              }}
            >
              Importar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-2"><ScaleIcon className="size-4 shrink-0" /> Seus dados seguem a LGPD: você corrige, baixa ou exclui quando quiser.</p>
        <p className="flex items-center gap-2"><MonitorSmartphoneIcon className="size-4 shrink-0" /> Perdeu um aparelho ou entrou num computador de outra pessoa? Encerre todas as sessões, inclusive esta.</p>
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
        <CardDescription>Apaga a conta e todo o conteúdo (notas, tarefas, hábitos, rotina, Kanban) na hora, sem cópia guardada. Nas equipes, a propriedade passa para outro membro e seus comentários viram “Ex-membro”. Não dá para desfazer.</CardDescription>
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
