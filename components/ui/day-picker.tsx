"use client"

import { cn } from "@/lib/utils"

import { ToggleChip } from "@/components/ui/chip"
import { nomesDias, nomesDiasCompletos } from "@/lib/datas"

// Segunda primeiro, como no calendário brasileiro.
export const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0]
const UTEIS = [1, 2, 3, 4, 5]
const TODOS = [0, 1, 2, 3, 4, 5, 6]

const iguais = (a: number[], b: number[]) => a.length === b.length && b.every((dia) => a.includes(dia))

// DayPicker (seção 6): Seg…Dom + atalhos "Dias úteis" e "Todos". O dia de hoje tem contorno Brasa.
export function DayPicker({
  value,
  onChange,
  today,
  shortcuts = false,
  label = "Dias da semana",
  className,
}: {
  value: number[]
  onChange: (dias: number[]) => void
  // Dia da semana de hoje (0 = domingo). Recebe contorno Brasa.
  today?: number
  shortcuts?: boolean
  label?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 max-sm:w-full", className)}>
      {/* Rafael Marques - 04/11/2026 (v1.5a): no celular os sete dias ficam numa grade (antes o domingo caía sozinho na linha de baixo). */}
      <div role="group" aria-label={label} className="flex flex-wrap gap-1 max-sm:grid max-sm:w-full max-sm:grid-cols-7">
        {ORDEM_DIAS.map((dia) => {
          const ligado = value.includes(dia)
          return (
            <ToggleChip
              key={dia}
              variant="day"
              pressed={ligado}
              aria-label={nomesDiasCompletos[dia]}
              aria-current={dia === today ? "date" : undefined}
              onPressedChange={(ligar) => onChange(ligar ? [...value, dia].sort() : value.filter((item) => item !== dia))}
              className={cn("max-sm:min-w-0 max-sm:px-0", dia === today && !ligado && "border-ember")}
            >
              {nomesDias[dia]}
            </ToggleChip>
          )
        })}
      </div>
      {shortcuts ? (
        <div className="flex gap-1">
          <ToggleChip variant="filter" pressed={iguais(value, UTEIS)} onPressedChange={() => onChange(UTEIS)}>
            Dias úteis
          </ToggleChip>
          <ToggleChip variant="filter" pressed={iguais(value, TODOS)} onPressedChange={() => onChange(TODOS)}>
            Todos
          </ToggleChip>
        </div>
      ) : null}
    </div>
  )
}
