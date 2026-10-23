"use server"

// Rafael Marques - 21/10/2026
// Ações de conta chamadas pelos formulários: criar, entrar, sair e — em
// "Minha conta" — os direitos do titular da LGPD (Art. 18): corrigir nome,
// trocar senha, encerrar sessões e excluir a conta.

import { VERSAO_DOCUMENTOS, RETENCAO } from "@/lib/conta/documentos"
import { banco } from "@/lib/servidor/banco"
import { prepararExclusaoDaConta } from "@/lib/servidor/equipes"
import { conferirSenha, gerarHashSenha, HASH_FALSO } from "@/lib/servidor/senha"
import { apagarCookieSessao, criarSessao, encerrarOutrasSessoes, encerrarSessao, usuarioAtual } from "@/lib/servidor/sessao"
import type { EstadoFormularioConta } from "@/lib/tipos-conta"

const SENHA_MINIMA = 8
const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Limite contra tentativa e erro de senha (segurança, Art. 46).
const MAX_FALHAS = 5
const JANELA_MINUTOS = 15

function lerCampos(formulario: FormData) {
  return {
    nome: String(formulario.get("nome") ?? "").trim().replace(/\s+/g, " "),
    email: String(formulario.get("email") ?? "").trim().toLowerCase(),
    senha: String(formulario.get("senha") ?? ""),
    confirmacao: String(formulario.get("confirmacao") ?? ""),
  }
}

function validarNome(nome: string) {
  if (nome.length < 2) return "Digite seu nome."
  if (nome.length > 80) return "O nome pode ter no máximo 80 caracteres."
}

function validarSenhaNova(senha: string) {
  if (senha.length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`
  if (senha.length > 200) return "A senha pode ter no máximo 200 caracteres."
}

export async function cadastrar(_anterior: EstadoFormularioConta, formulario: FormData): Promise<EstadoFormularioConta> {
  const { nome, email, senha, confirmacao } = lerCampos(formulario)
  const erros: NonNullable<EstadoFormularioConta>["erros"] = {}
  erros.nome = validarNome(nome)
  if (!formatoEmail.test(email) || email.length > 254) erros.email = "Digite um e-mail válido."
  erros.senha = validarSenhaNova(senha)
  if (confirmacao !== senha) erros.confirmacao = "As senhas não são iguais."
  if (formulario.get("aceite") !== "on") erros.aceite = "Para criar a conta, aceite os Termos e a Política de Privacidade."
  if (Object.values(erros).some(Boolean)) return { erros, nome, email }

  try {
    const hash = await gerarHashSenha(senha)
    // O aceite fica registrado com data e versão (prova do aceite, Art. 8º, §2º).
    const linhas = await banco()`
      INSERT INTO usuarios (nome, email, senha_hash, termos_aceitos_em, versao_termos)
      VALUES (${nome}, ${email}, ${hash}, now(), ${VERSAO_DOCUMENTOS})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, nome, email
    `
    if (!linhas[0]) return { erros: { email: "Já existe uma conta com este e-mail." }, nome, email }
    const usuario = { id: String(linhas[0].id), nome: String(linhas[0].nome), email: String(linhas[0].email) }
    await criarSessao(usuario.id)
    return { usuario }
  } catch (erro) {
    console.error("Erro ao criar conta:", erro)
    return { erro: "Não foi possível criar a conta agora. Tente de novo em instantes.", nome, email }
  }
}

export async function entrar(_anterior: EstadoFormularioConta, formulario: FormData): Promise<EstadoFormularioConta> {
  const { email, senha } = lerCampos(formulario)
  if (!email || !senha) return { erro: "Preencha o e-mail e a senha.", email }

  try {
    const sql = banco()
    await sql`DELETE FROM tentativas_login WHERE criado_em < now() - make_interval(hours => ${RETENCAO.tentativasLoginHoras})`
    const [{ falhas }] = await sql`
      SELECT count(*)::int AS falhas FROM tentativas_login
      WHERE email = ${email} AND criado_em > now() - make_interval(mins => ${JANELA_MINUTOS})
    `
    if (Number(falhas) >= MAX_FALHAS) {
      return { erro: `Muitas tentativas erradas. Por segurança, espere ${JANELA_MINUTOS} minutos e tente de novo.`, email }
    }

    const linhas = await sql`SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ${email}`
    const linha = linhas[0]
    // Confere mesmo sem conta, para o tempo de resposta não entregar quais e-mails existem.
    const valida = await conferirSenha(senha, linha ? String(linha.senha_hash) : HASH_FALSO)
    if (!linha || !valida) {
      await sql`INSERT INTO tentativas_login (email) VALUES (${email})`
      return { erro: "E-mail ou senha incorretos.", email }
    }
    await sql`DELETE FROM tentativas_login WHERE email = ${email}`
    const usuario = { id: String(linha.id), nome: String(linha.nome), email: String(linha.email) }
    await criarSessao(usuario.id)
    return { usuario }
  } catch (erro) {
    console.error("Erro ao entrar:", erro)
    return { erro: "Não foi possível entrar agora. Tente de novo em instantes.", email }
  }
}

export async function sair() {
  await encerrarSessao()
}

// ---------- Minha conta ----------

export type EstadoAcaoConta = { erro?: string; erros?: Record<string, string | undefined>; ok?: string; nome?: string } | undefined

const semSessao = { erro: "Sua sessão expirou. Entre de novo." }

// Correção de dados (Art. 18, III).
export async function atualizarNome(_anterior: EstadoAcaoConta, formulario: FormData): Promise<EstadoAcaoConta> {
  const usuario = await usuarioAtual()
  if (!usuario) return semSessao
  const nome = String(formulario.get("nome") ?? "").trim().replace(/\s+/g, " ")
  const erro = validarNome(nome)
  if (erro) return { erros: { nome: erro } }
  await banco()`UPDATE usuarios SET nome = ${nome} WHERE id = ${usuario.id}`
  return { ok: "Nome atualizado.", nome }
}

export async function alterarSenha(_anterior: EstadoAcaoConta, formulario: FormData): Promise<EstadoAcaoConta> {
  const usuario = await usuarioAtual()
  if (!usuario) return semSessao
  const atual = String(formulario.get("atual") ?? "")
  const nova = String(formulario.get("nova") ?? "")
  const confirmacao = String(formulario.get("confirmacao") ?? "")
  const erros: Record<string, string | undefined> = { nova: validarSenhaNova(nova) }
  if (confirmacao !== nova) erros.confirmacao = "As senhas não são iguais."
  if (Object.values(erros).some(Boolean)) return { erros }

  const [linha] = await banco()`SELECT senha_hash FROM usuarios WHERE id = ${usuario.id}`
  if (!linha || !(await conferirSenha(atual, String(linha.senha_hash)))) return { erros: { atual: "Senha atual incorreta." } }
  await banco()`UPDATE usuarios SET senha_hash = ${await gerarHashSenha(nova)} WHERE id = ${usuario.id}`
  // Quem tinha a senha antiga perde o acesso nos outros aparelhos.
  await encerrarOutrasSessoes(usuario.id, true)
  return { ok: "Senha alterada. As sessões nos outros aparelhos foram encerradas." }
}

export async function sairDeTodosOsAparelhos() {
  const usuario = await usuarioAtual()
  if (!usuario) return
  await encerrarOutrasSessoes(usuario.id, false)
  await apagarCookieSessao()
}

// Eliminação (Art. 18, VI): apaga a conta, as sessões e todo o conteúdo (ON DELETE CASCADE).
export async function excluirConta(_anterior: EstadoAcaoConta, formulario: FormData): Promise<EstadoAcaoConta> {
  const usuario = await usuarioAtual()
  if (!usuario) return semSessao
  const senha = String(formulario.get("senha") ?? "")
  const [linha] = await banco()`SELECT senha_hash FROM usuarios WHERE id = ${usuario.id}`
  if (!linha || !(await conferirSenha(senha, String(linha.senha_hash)))) return { erros: { senha: "Senha incorreta." } }
  const sql = banco()
  // Rafael Marques - 23/10/2026: antes de apagar, passa a propriedade das equipes e anonimiza comentários.
  await prepararExclusaoDaConta(usuario.id)
  await sql`DELETE FROM tentativas_login WHERE email = ${usuario.email}`
  await sql`DELETE FROM usuarios WHERE id = ${usuario.id}`
  await apagarCookieSessao()
  return { ok: "excluida" }
}
