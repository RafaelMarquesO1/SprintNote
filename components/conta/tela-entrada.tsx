"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { motion } from "motion/react"
import { AlertCircleIcon, ArrowLeftIcon, CheckIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon, UserIcon } from "lucide-react"

import { LinkDocumento } from "@/components/conta/documentos-legais"
import { Logo } from "@/components/brand/logo"
import { spring } from "@/components/motion/presets"
import { Segmented } from "@/components/ui/segmented"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
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

function FormularioConta({ modo, aoEntrar, aoTrocarModo }: { modo: Modo; aoEntrar: (usuario: Usuario) => void; aoTrocarModo: (modo: Modo) => void }) {
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
          {erros.email === "Já existe uma conta com este e-mail." ? (
            <p role="alert" className="text-small text-paper">
              Já existe uma conta com este e-mail.{" "}
              <button type="button" className="font-semibold underline underline-offset-4" onClick={() => aoTrocarModo("entrar")}>
                Entrar?
              </button>
            </p>
          ) : (
            <FieldError>{erros.email}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!erros.senha || undefined}>
          <FieldLabel htmlFor={`${id}-senha`}>Senha</FieldLabel>
          <CampoSenha id={`${id}-senha`} nome="senha" autoComplete={modo === "entrar" ? "current-password" : "new-password"} invalido={!!erros.senha} />
          {modo === "cadastro" && <RegraSenha />}
          {erros.senha ? <FieldError>{erros.senha}</FieldError> : null}
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
              <FieldLabel htmlFor={`${id}-aceite`} className="block font-normal text-ink-soft">
                Li e aceito os <LinkDocumento tipo="termos">Termos de Uso</LinkDocumento> e a{" "}
                <LinkDocumento tipo="privacidade">Política de Privacidade</LinkDocumento>, e tenho 18 anos ou mais (ou autorização do responsável).
              </FieldLabel>
              <FieldError>{erros.aceite}</FieldError>
            </div>
          </Field>
        )}

        {estado?.erro && (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-line-strong px-3 py-2.5 text-small text-paper">
            <AlertCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {estado.erro}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={enviando}>
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </Button>
      </FieldGroup>
    </form>
  )
}

// Regra da senha sempre à vista; marcada quando atendida (8.2).
function RegraSenha() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const campo = document.querySelector<HTMLInputElement>('input[name="senha"][autocomplete="new-password"]')
    if (!campo) return
    const ler = () => setOk(campo.value.length >= 8)
    campo.addEventListener("input", ler)
    return () => campo.removeEventListener("input", ler)
  }, [])
  return (
    <p className={ok ? "flex items-center gap-1.5 text-small text-paper" : "flex items-center gap-1.5 text-small text-ink-soft"}>
      <CheckIcon aria-hidden="true" className={ok ? "size-3.5" : "size-3.5 opacity-30"} />
      Pelo menos 8 caracteres{ok ? <span className="sr-only">, atendido</span> : null}
    </p>
  )
}

// Rafael Marques - 21/10/2026 · redesign v2 (8.2)
// Entrar / Criar conta: coluna central de 400px, fundo preto liso, Segmented para trocar.
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
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-night px-4 py-16">
      {aoVoltar && (
        <Button variant="ghost" size="sm" className="absolute top-4 left-4" onClick={aoVoltar}>
          <ArrowLeftIcon /> Voltar
        </Button>
      )}

      <div className="w-full max-w-100 space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Segmented
          label="Entrar ou criar conta"
          value={modo}
          onChange={setModo}
          className="w-full [&>button]:flex-1"
          options={[
            { value: "entrar", label: "Entrar" },
            { value: "cadastro", label: "Criar conta" },
          ]}
        />
        <div className="space-y-1.5">
          <h1 className="font-display text-title text-paper">{modo === "entrar" ? "Que bom te ver de novo." : "Crie sua conta"}</h1>
          <p className="text-ui text-ink-soft">
            {modo === "entrar" ? "Entre para ver suas notas, tarefas e rotina." : "Seus dados ficam salvos e aparecem em qualquer aparelho."}
          </p>
        </div>
        <motion.div layout transition={spring.layout}>
          <FormularioConta key={modo} modo={modo} aoEntrar={aoEntrar} aoTrocarModo={setModo} />
        </motion.div>
      </div>
    </div>
  )
}
