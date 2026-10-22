// Rafael Marques - 21/10/2026
// Gera um arquivo .zip simples (sem compressão) no navegador, para exportar
// as notas como arquivos .md em pastas — o formato que o Obsidian abre.

const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabela[n] = c >>> 0
  }
  return tabela
})()

function crc32(dados: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of dados) crc = TABELA_CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function dataDos(data: Date) {
  const hora = (data.getHours() << 11) | (data.getMinutes() << 5) | Math.floor(data.getSeconds() / 2)
  const dia = ((data.getFullYear() - 1980) << 9) | ((data.getMonth() + 1) << 5) | data.getDate()
  return { hora, dia }
}

export function gerarZip(arquivos: { caminho: string; conteudo: string }[]): Blob {
  const codificador = new TextEncoder()
  const partes: Uint8Array[] = []
  const central: Uint8Array[] = []
  let deslocamento = 0
  const { hora, dia } = dataDos(new Date())

  for (const arquivo of arquivos) {
    const nome = codificador.encode(arquivo.caminho)
    const dados = codificador.encode(arquivo.conteudo)
    const crc = crc32(dados)

    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(6, 0x0800, true) // nomes em UTF-8
    local.setUint16(8, 0, true) // sem compressão
    local.setUint16(10, hora, true)
    local.setUint16(12, dia, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, dados.length, true)
    local.setUint32(22, dados.length, true)
    local.setUint16(26, nome.length, true)
    local.setUint16(28, 0, true)
    partes.push(new Uint8Array(local.buffer), nome, dados)

    const registro = new DataView(new ArrayBuffer(46))
    registro.setUint32(0, 0x02014b50, true)
    registro.setUint16(4, 20, true)
    registro.setUint16(6, 20, true)
    registro.setUint16(8, 0x0800, true)
    registro.setUint16(10, 0, true)
    registro.setUint16(12, hora, true)
    registro.setUint16(14, dia, true)
    registro.setUint32(16, crc, true)
    registro.setUint32(20, dados.length, true)
    registro.setUint32(24, dados.length, true)
    registro.setUint16(28, nome.length, true)
    registro.setUint32(42, deslocamento, true)
    central.push(new Uint8Array(registro.buffer), nome)

    deslocamento += 30 + nome.length + dados.length
  }

  const tamanhoCentral = central.reduce((soma, parte) => soma + parte.length, 0)
  const fim = new DataView(new ArrayBuffer(22))
  fim.setUint32(0, 0x06054b50, true)
  fim.setUint16(8, arquivos.length, true)
  fim.setUint16(10, arquivos.length, true)
  fim.setUint32(12, tamanhoCentral, true)
  fim.setUint32(16, deslocamento, true)

  return new Blob([...partes, ...central, new Uint8Array(fim.buffer)] as BlobPart[], { type: "application/zip" })
}
