"use client"

import { cn } from "@/lib/utils"

import { nomesDias, nomesDiasCompletos } from "@/lib/datas"

// Começa na segunda-feira, como no calendário brasileiro.
const ordemDias = [1, 2, 3, 4, 5, 6, 0]

// Rafael Marques - 20/10/2026
// Botões para escolher os dias da semana (usado em Hábitos e Rotina).
export function SeletorDias({ dias, aoMudar }: { dias: number[]; aoMudar: (dias: number[]) => void }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Dias da semana">
      {ordemDias.map((dia) => {
        const ativo = dias.includes(dia)
        return (
          <button
            key={dia}
            type="button"
            aria-pressed={ativo}
            title={nomesDiasCompletos[dia]}
            onClick={() => aoMudar(ativo ? dias.filter((item) => item !== dia) : [...dias, dia].sort())}
            className={cn(
              "h-7 w-9 rounded-md border text-xs transition-colors",
              ativo ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {nomesDias[dia]}
          </button>
        )
      })}
    </div>
  )
}

export function descreverDias(dias: number[]) {
  if (dias.length === 7) return "Todos os dias"
  if (dias.length === 5 && [1, 2, 3, 4, 5].every((dia) => dias.includes(dia))) return "Dias úteis"
  if (dias.length === 2 && dias.includes(0) && dias.includes(6)) return "Fins de semana"
  return ordemDias.filter((dia) => dias.includes(dia)).map((dia) => nomesDias[dia]).join(", ")
}
