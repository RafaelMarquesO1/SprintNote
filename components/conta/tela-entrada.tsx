"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon, UserIcon } from "lucide-react"

import { LinkDocumento } from "@/components/conta/documentos-legais"
import { IconeApp } from "@/components/conta/marca-app"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cadastrar, entrar } from "@/lib/servidor/acoes-conta"
import type { Usuario } from "@/lib/tipos-conta"

export type Modo = "entrar" | "cadastro"

function CampoSenha({ id, nome, autoComplete, invalido }: { id: string; nome: string; autoComplete: string; invalido: boolean }) {
  const [visivel, setVisivel] = useState(false)
  return (
    <InputGroup>
      <InputGroupAddon>
        <LockIcon />
      </InputGroupAddon>
      <InputGroupInput id={id} name={nome} type={visivel ? "text" : "password"} autoComplete={autoComplete} required aria-invalid={invalido || undefined} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label={visivel ? "Esconder senha" : "Mostrar senha"} onClick={() => setVisivel(!visivel)}>
          {visivel ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

function FormularioConta({ modo, aoEntrar }: { modo: Modo; aoEntrar: (usuario: Usuario) => void }) {
  const [estado, acao, enviando] = useActionState(modo === "entrar" ? entrar : cadastrar, undefined)
  const id = useId()
  const erros = estado?.erros ?? {}

  useEffect(() => {
    if (estado?.usuario) aoEntrar(estado.usuario)
  }, [estado, aoEntrar])

  return (
    <form action={acao} noValidate>
      <FieldGroup>
        {modo === "cadastro" && (
          <Field data-invalid={!!erros.nome || undefined}>
            <FieldLabel htmlFor={`${id}-nome`}>Nome</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <UserIcon />
              </InputGroupAddon>
              <InputGroupInput
                id={`${id}-nome`}
                name="nome"
                placeholder="Como quer ser chamado"
                autoComplete="name"
                required
                maxLength={80}
                defaultValue={estado?.nome}
                aria-invalid={!!erros.nome || undefined}
              />
            </InputGroup>
            <FieldError>{erros.nome}</FieldError>
          </Field>
        )}

        <Field data-invalid={!!erros.email || undefined}>
          <FieldLabel htmlFor={`${id}-email`}>E-mail</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MailIcon />
            </InputGroupAddon>
            <InputGroupInput
              id={`${id}-email`}
              name="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              required
              defaultValue={estado?.email}
              aria-invalid={!!erros.email || undefined}
            />
          </InputGroup>
          <FieldError>{erros.email}</FieldError>
        </Field>

        <Field data-invalid={!!erros.senha || undefined}>
          <FieldLabel htmlFor={`${id}-senha`}>Senha</FieldLabel>
          <CampoSenha id={`${id}-senha`} nome="senha" autoComplete={modo === "entrar" ? "current-password" : "new-password"} invalido={!!erros.senha} />
          {erros.senha ? <FieldError>{erros.senha}</FieldError> : modo === "cadastro" && <FieldDescription>Pelo menos 8 caracteres.</FieldDescription>}
        </Field>

        {modo === "cadastro" && (
          <Field data-invalid={!!erros.confirmacao || undefined}>
            <FieldLabel htmlFor={`${id}-confirmacao`}>Confirme a senha</FieldLabel>
            <CampoSenha id={`${id}-confirmacao`} nome="confirmacao" autoComplete="new-password" invalido={!!erros.confirmacao} />
            <FieldError>{erros.confirmacao}</FieldError>
          </Field>
        )}

        {modo === "cadastro" && (
          <Field orientation="horizontal" data-invalid={!!erros.aceite || undefined}>
            <Checkbox id={`${id}-aceite`} name="aceite" aria-invalid={!!erros.aceite || undefined} />
            <div className="grid gap-1.5">
              <FieldLabel htmlFor={`${id}-aceite`} className="block font-normal text-muted-foreground">
                Li e aceito os <LinkDocumento tipo="termos">Termos de Uso</LinkDocumento> e a{" "}
                <LinkDocumento tipo="privacidade">Política de Privacidade</LinkDocumento>, e tenho 18 anos ou mais (ou autorização do responsável).
              </FieldLabel>
              <FieldError>{erros.aceite}</FieldError>
            </div>
          </Field>
        )}

        {estado?.erro && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {estado.erro}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          {enviando && <Spinner />}
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </Button>
      </FieldGroup>
    </form>
  )
}

// Rafael Marques - 21/10/2026
// Tela de entrada: abas "Entrar" e "Criar conta" (e-mail e senha).
export function TelaEntrada({
  modoInicial = "entrar",
  aoEntrar,
  aoVoltar,
}: {
  modoInicial?: Modo
  aoEntrar: (usuario: Usuario) => void
  aoVoltar?: () => void
}) {
  const [modo, setModo] = useState<Modo>(modoInicial)

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-4 animate-in fade-in duration-500">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_55%)]" />

      {aoVoltar && (
        <Button variant="ghost" size="sm" className="absolute top-4 left-4" onClick={aoVoltar}>
          <ArrowLeftIcon /> Voltar
        </Button>
      )}

      <div className="relative flex flex-col items-center gap-3 text-center">
        <IconeApp />
        <span className="text-lg font-semibold tracking-tight">SprintNote</span>
      </div>

      <Card className="relative w-full max-w-sm shadow-lg">
        <Tabs value={modo} onValueChange={(valor) => setModo(valor as Modo)}>
          <CardHeader className="gap-4">
            <TabsList className="w-full">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="cadastro">Criar conta</TabsTrigger>
            </TabsList>
            <div className="space-y-1">
              <CardTitle className="text-xl">{modo === "entrar" ? "Bem-vindo de volta" : "Crie sua conta"}</CardTitle>
              <CardDescription>
                {modo === "entrar" ? "Entre para ver suas notas, tarefas e rotina." : "Seus dados ficam salvos na nuvem e aparecem em qualquer navegador."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="entrar">
              <FormularioConta modo="entrar" aoEntrar={aoEntrar} />
            </TabsContent>
            <TabsContent value="cadastro">
              <FormularioConta modo="cadastro" aoEntrar={aoEntrar} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <p className="relative text-center text-xs text-muted-foreground">
        {modo === "entrar" ? "Ainda não tem conta? " : "Já tem conta? "}
        <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => setModo(modo === "entrar" ? "cadastro" : "entrar")}>
          {modo === "entrar" ? "Criar conta" : "Entrar"}
        </button>
      </p>
    </div>
  )
}
