// Rafael Marques - 23/10/2026
// Chamadas do navegador à API de equipes. Erros viram ErroApi com a mensagem
// em português que o servidor mandou (status 0 = sem conexão).

export class ErroApi extends Error {
  constructor(
    public status: number,
    mensagem: string
  ) {
    super(mensagem)
  }
}

export async function chamarApi<T = unknown>(caminho: string, opcoes: { metodo?: string; corpo?: unknown } = {}): Promise<T> {
  const metodo = opcoes.metodo ?? "GET"
  let resposta: Response
  try {
    resposta = await fetch(caminho, {
      method: metodo,
      cache: "no-store",
      headers: metodo === "GET" || metodo === "DELETE" ? undefined : { "Content-Type": "application/json" },
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
    })
  } catch {
    throw new ErroApi(0, "Sem conexão. Tente de novo.")
  }
  const dados = (await resposta.json().catch(() => ({}))) as { erro?: string }
  if (!resposta.ok) throw new ErroApi(resposta.status, dados.erro ?? "Não foi possível concluir agora.")
  return dados as T
}

export const mensagemDoErro = (erro: unknown) => (erro instanceof Error ? erro.message : "Não foi possível concluir agora.")
