// Rafael Marques - 30/10/2026
// Junta duas versões dos dados de uma área (a deste aparelho e a do servidor),
// partindo da última versão que os dois tinham em comum ("base").
//  - o que só um lado mudou é mantido;
//  - itens com "id" (notas, cartões, tarefas…) são juntados um a um: criar em um
//    aparelho e criar em outro não apaga nada;
//  - excluir só vale se o outro lado não mexeu no item;
//  - se os dois mudaram o mesmo campo, vence o item com "atualizadoEm" mais novo;
//    sem essa data, vence este aparelho.
// Sem base (não se sabe o que era comum), junta tudo e nada é excluído.

type Lado = "local" | "remoto"

const SEM_BASE = Symbol("sem-base")
type Base = unknown | typeof SEM_BASE

const ehObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === "object" && valor !== null && !Array.isArray(valor)

export function iguais(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((item, i) => iguais(item, b[i]))
  if (ehObjeto(a) && ehObjeto(b)) {
    const chavesA = Object.keys(a).filter((chave) => a[chave] !== undefined)
    const chavesB = Object.keys(b).filter((chave) => b[chave] !== undefined)
    return chavesA.length === chavesB.length && chavesA.every((chave) => iguais(a[chave], b[chave]))
  }
  return false
}

const idDe = (item: unknown) => (ehObjeto(item) && (typeof item.id === "string" || typeof item.id === "number") ? String(item.id) : null)
const ehListaComId = (lista: unknown): lista is Record<string, unknown>[] => Array.isArray(lista) && lista.every((item) => idDe(item) !== null)
const ehListaSimples = (lista: unknown): lista is unknown[] => Array.isArray(lista) && lista.every((item) => typeof item !== "object" || item === null)

export function mesclarEstado(base: unknown, local: unknown, remoto: unknown): unknown {
  return mesclar(base, local, remoto, "local")
}

// Sem a versão em comum (ex.: o envio não terminou antes de fechar a aba).
export function mesclarSemBase(local: unknown, remoto: unknown): unknown {
  return mesclar(SEM_BASE, local, remoto, "local")
}

function mesclar(base: Base, local: unknown, remoto: unknown, preferir: Lado): unknown {
  if (iguais(local, remoto)) return local
  if (base !== SEM_BASE) {
    if (iguais(base, local)) return remoto
    if (iguais(base, remoto)) return local
  }
  if (ehObjeto(local) && ehObjeto(remoto)) return mesclarObjetos(base, local, remoto, preferir)
  if (ehListaComId(local) && ehListaComId(remoto)) return mesclarListasComId(base, local, remoto)
  if (ehListaSimples(local) && ehListaSimples(remoto)) return mesclarListasSimples(base, local, remoto)
  return preferir === "local" ? local : remoto
}

function mesclarObjetos(base: Base, local: Record<string, unknown>, remoto: Record<string, unknown>, preferir: Lado) {
  const objetoBase = base !== SEM_BASE && ehObjeto(base) ? base : null
  const resultado: Record<string, unknown> = {}
  const chaves = [...Object.keys(local), ...Object.keys(remoto).filter((chave) => !(chave in local))]
  for (const chave of chaves) {
    const temBase = objetoBase !== null && chave in objetoBase
    const valorBase = temBase ? objetoBase[chave] : SEM_BASE
    if (chave in local && chave in remoto) resultado[chave] = mesclar(valorBase, local[chave], remoto[chave], preferir)
    else if (chave in local) {
      // Sumiu no servidor: só tira se aqui não mudou.
      if (!(temBase && iguais(valorBase, local[chave]))) resultado[chave] = local[chave]
    } else if (!(temBase && iguais(valorBase, remoto[chave]))) resultado[chave] = remoto[chave]
  }
  return resultado
}

// O item que foi mexido por último decide os campos que os dois mudaram.
function ladoMaisNovo(local: Record<string, unknown>, remoto: Record<string, unknown>): Lado {
  const dataLocal = local.atualizadoEm
  const dataRemota = remoto.atualizadoEm
  return typeof dataLocal === "number" && typeof dataRemota === "number" && dataRemota > dataLocal ? "remoto" : "local"
}

function mesclarListasComId(base: Base, local: Record<string, unknown>[], remoto: Record<string, unknown>[]) {
  const porIdBase = new Map<string, unknown>()
  if (base !== SEM_BASE && ehListaComId(base)) for (const item of base) porIdBase.set(idDe(item)!, item)
  const porIdRemoto = new Map(remoto.map((item) => [idDe(item)!, item]))
  const idsLocais = new Set(local.map((item) => idDe(item)!))

  const resultado: Record<string, unknown>[] = []
  for (const item of local) {
    const id = idDe(item)!
    const doServidor = porIdRemoto.get(id)
    const naBase = porIdBase.has(id)
    if (doServidor) resultado.push(mesclar(naBase ? porIdBase.get(id) : SEM_BASE, item, doServidor, ladoMaisNovo(item, doServidor)) as Record<string, unknown>)
    // Excluído no servidor: só some se aqui ninguém mexeu nele.
    else if (!(naBase && iguais(porIdBase.get(id), item))) resultado.push(item)
  }

  // Itens que só o servidor tem entram logo depois do vizinho que tinham lá.
  let anterior: string | null = null
  for (const item of remoto) {
    const id = idDe(item)!
    if (!idsLocais.has(id)) {
      const excluidoAqui = porIdBase.has(id) && iguais(porIdBase.get(id), item)
      if (!excluidoAqui) {
        const posicao: number = anterior === null ? 0 : resultado.findIndex((outro) => idDe(outro) === anterior) + 1
        resultado.splice(posicao, 0, item)
      }
    }
    if (resultado.some((outro) => idDe(outro) === id)) anterior = id
  }
  return resultado
}

// Listas de textos/números (tags, dias marcados…): funcionam como conjuntos.
function mesclarListasSimples(base: Base, local: unknown[], remoto: unknown[]) {
  const naBase = new Set(base !== SEM_BASE && Array.isArray(base) ? base : [])
  const noRemoto = new Set(remoto)
  const noLocal = new Set(local)
  return [
    ...local.filter((item) => noRemoto.has(item) || !naBase.has(item)),
    ...remoto.filter((item) => !noLocal.has(item) && !naBase.has(item)),
  ]
}
