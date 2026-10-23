// Rafael Marques - 23/10/2026
// Versão do SprintNote: vem do package.json (um só lugar para mudar a cada lançamento).
// O npm exige três números (1.1.1); o que aparece no app é o campo "versaoExibida" do package.json
// (ex.: "1.1a"). Sem ele, mostra a versão sem o ".0" final (1.1.0 vira "1.1").

import pacote from "../package.json"

export const VERSAO_APP: string = pacote.versaoExibida ?? pacote.version.replace(/\.0$/, "")
