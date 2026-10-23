// Rafael Marques - 23/10/2026
// Versão do SprintNote: vem do package.json (um só lugar para mudar a cada lançamento).
// O npm exige três números (1.1.0), mas o app mostra "1.1": o ".0" final da correção some.

import pacote from "../package.json"

export const VERSAO_APP: string = pacote.version.replace(/\.0$/, "")
