"use client"

import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { useShallow } from "zustand/react/shallow"

import { itemLista } from "@/components/motion/presets"
import { Button } from "@/components/ui/button"
import { useHabitos } from "@/lib/estado/habitos"
import { useInicio } from "@/lib/estado/inicio"
import { useNotas } from "@/lib/estado/notas"
import { useTarefas } from "@/lib/estado/tarefas"

const TEM_TAREFA_NA_NOTA = /^\s*[-*+] \[[ xX]\] ?\S/m

// Primeiros passos (8.16): três passos dentro de "Seu dia". Cada passo feito some (M9). Dispensável.
export function Onboarding() {
  const dispensado = useInicio((estado) => estado.onboardingDispensado)
  const dispensar = useInicio((estado) => estado.dispensarOnboarding)
  const temTarefa = useTarefas((estado) => estado.tarefas.length > 0)
  const temHabito = useHabitos((estado) => estado.habitos.length > 0)
  const notaComTarefa = useNotas(useShallow((estado) => estado.notas.some((nota) => TEM_TAREFA_NA_NOTA.test(nota.conteudo))))

  const passos = [
    { id: "tarefa", feito: temTarefa, texto: "Criar sua primeira tarefa", href: "/tarefas?criar=1" },
    { id: "habito", feito: temHabito, texto: "Escolher um hábito", href: "/habitos?criar=1" },
    { id: "nota", feito: notaComTarefa, texto: "Escrever uma nota e citar uma tarefa", href: "/notas" },
  ]
  const restantes = passos.filter((passo) => !passo.feito)
  if (dispensado || restantes.length === 0) return null

  return (
    <section aria-labelledby="titulo-primeiros-passos" className="rounded-lg border border-dashed border-line-strong p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 id="titulo-primeiros-passos" className="text-ui font-semibold text-paper">
          Seu dia começa aqui.
        </h3>
        <Button variant="ghost" size="sm" onClick={dispensar}>
          Dispensar
        </Button>
      </div>
      <ol className="space-y-0.5">
        <AnimatePresence initial={false}>
          {restantes.map((passo) => (
            <motion.li key={passo.id} {...itemLista} className="overflow-hidden">
              <Link href={passo.href} className="flex min-h-row items-center gap-3 rounded-sm px-1 text-ui text-ink hover:bg-raised hover:text-paper">
                <span aria-hidden="true" className="size-4 shrink-0 rounded-full border border-line-strong" />
                {passo.texto}
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </section>
  )
}
