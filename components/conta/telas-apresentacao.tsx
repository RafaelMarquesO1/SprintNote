"use client"

// Rafael Marques - 03/11/2026
// Prints reais do SprintNote na tela de apresentação, animadas com a rolagem:
// 1. a tela "Hoje" entra inclinada em 3D e se endireita conforme a página desce;
// 2. uma faixa com os nomes das áreas corre devagar;
// 3. no desktop, a seção fica presa na tela e as outras prints chegam como uma pilha de cartões:
//    a nova sobe por cima e a anterior recua e escurece. As prints aparecem sempre inteiras (sem zoom).
//    No celular (e para quem pede menos movimento), cada texto vem com a sua print, que sobe com fade.

import { useLayoutEffect, useRef, useState } from "react"
import Image, { type StaticImageData } from "next/image"
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react"

import { ease } from "@/components/motion/presets"
import { cn } from "@/lib/utils"
import printHoje from "@/public/apresentacao/hoje.png"
import printTarefas from "@/public/apresentacao/tarefas.png"
import printHabitos from "@/public/apresentacao/habitos.png"
import printRotina from "@/public/apresentacao/rotina.png"
import printQuadro from "@/public/apresentacao/quadro.png"
import printNota from "@/public/apresentacao/nota.png"

type Tela = {
  chave: string
  endereco: string
  titulo: string
  texto: string
  imagem: StaticImageData
  descricao: string
}

const telas: Tela[] = [
  {
    chave: "tarefas",
    endereco: "tarefas",
    titulo: "Tarefas de todo lugar, numa lista só.",
    texto: "Escreva [] Estudar @amanhã em qualquer nota e ela aparece aqui, com data, prioridade e lista.",
    imagem: printTarefas,
    descricao: "Tela Tarefas do SprintNote: campo de nova tarefa, abas Hoje, Próximas, Todas e Concluídas e filtros por lista.",
  },
  {
    chave: "habitos",
    endereco: "habitos",
    titulo: "Hábitos com sequência.",
    texto: "Marque o que fez em cada dia da semana e veja quantos dias seguidos você manteve.",
    imagem: printHabitos,
    descricao: "Tela Hábitos do SprintNote: grade da semana com o hábito Leitura marcado na segunda e sequência de 4 dias.",
  },
  {
    chave: "rotina",
    endereco: "rotina",
    titulo: "A rotina sabe que horas são.",
    texto: "Monte a semana por dia e horário. A linha laranja mostra onde você está agora.",
    imagem: printRotina,
    descricao: "Tela Rotina do SprintNote: atividade Trabalho das 7h às 13h e a linha laranja do horário atual.",
  },
  {
    chave: "quadro",
    endereco: "quadros/meu-quadro-pessoal",
    titulo: "Quadros para os projetos.",
    texto: "Colunas, cartões com checklist e etiquetas. Arraste um cartão e o andamento se atualiza.",
    imagem: printQuadro,
    descricao: "Quadro kanban Meu quadro pessoal: colunas A fazer, Em andamento e Concluído com cartões e checklists.",
  },
  {
    chave: "nota",
    endereco: "notas/sprintnote",
    titulo: "Notas com capa e sumário.",
    texto: "Escreva em blocos, dê uma capa à nota e navegue pelos títulos no sumário ao lado.",
    imagem: printNota,
    descricao: "Nota SprintNote com capa azul, caderno Projetos e sumário Nesta nota ao lado.",
  },
]

const areas = ["Hoje", "Tarefas", "Hábitos", "Rotina", "Quadros", "Notas", "Grafo", "Tags", "Biblioteca", "Busca"]

// Moldura de janela em volta da print. A barra de cima é só enfeite (cinzas, sem cor).
function Moldura({ endereco, proporcao = "aspect-[1910/945]", className, children }: { endereco: string; proporcao?: string; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[14px] border border-line-strong bg-raised shadow-[0_40px_120px_-30px_rgb(255_255_255/0.12),0_30px_80px_-30px_rgb(0_0_0/0.35)]",
        className,
      )}
    >
      <div aria-hidden className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="ml-3 truncate rounded-md bg-panel px-2 py-0.5 text-[11px] text-ink-muted">sprintnote / {endereco}</span>
      </div>
      <div className={cn("relative overflow-hidden bg-white", proporcao)}>{children}</div>
    </div>
  )
}

function Print({ imagem, descricao, tamanhos, className, style }: { imagem: StaticImageData; descricao: string; tamanhos: string; className?: string; style?: React.CSSProperties }) {
  return <Image src={imagem} alt={descricao} placeholder="blur" sizes={tamanhos} className={cn("size-full object-cover object-top", className)} style={style} />
}

// 1. A tela "Hoje" deitada para trás, que se endireita enquanto sobe.
// Rafael Marques - 03/11/2026: a apresentação rola dentro de uma camada fixa (portao-conta), não na janela;
// por isso a rolagem é lida do elemento que rola de fato (sem ele, a print ficava parada inclinada).
function PalcoInclinado({ rolagem }: { rolagem: React.RefObject<HTMLElement | null> }) {
  const caixa = useRef<HTMLDivElement>(null)
  const menosMovimento = useReducedMotion()
  const { scrollYProgress } = useScroll({ container: rolagem, target: caixa, offset: ["start end", "center center"] })
  const giro = useTransform(scrollYProgress, [0, 1], [26, 0])
  const escala = useTransform(scrollYProgress, [0, 1], [0.9, 1])
  const subida = useTransform(scrollYProgress, [0, 1], [80, 0])
  const brilho = useTransform(scrollYProgress, [0, 1], [0.55, 1])

  return (
    <div ref={caixa} className="relative mx-auto max-w-[1120px] [perspective:1400px]">
      <div aria-hidden className="pointer-events-none absolute inset-x-[10%] -top-10 h-2/3 rounded-full bg-paper/[0.06] blur-3xl" />
      <motion.div style={menosMovimento ? undefined : { rotateX: giro, scale: escala, y: subida, opacity: brilho }} className="origin-top will-change-transform">
        <Moldura endereco="hoje">
          <Print
            imagem={printHoje}
            descricao="Tela Hoje do SprintNote: saudação Bom dia, Rafael., agenda Seu dia com a linha do agora, quadros com porcentagem concluída e hábitos da semana."
            tamanhos="(min-width: 1180px) 1120px, 100vw"
          />
        </Moldura>
      </motion.div>
    </div>
  )
}

// 2. Faixa com os nomes das áreas, repetida duas vezes para dar a volta sem emenda.
function FaixaAreas() {
  return (
    <div aria-hidden className="relative overflow-hidden border-y border-line py-5 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <motion.div className="flex w-max" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 36, ease: "linear", repeat: Infinity }}>
        {[0, 1].map((volta) => (
          <div key={volta} className="flex shrink-0 items-center gap-10 pr-10">
            {areas.map((area) => (
              <span key={area} className="flex items-center gap-10 font-display text-2xl font-semibold tracking-tight text-ink-muted md:text-3xl">
                {area}
                <span className="size-1.5 rounded-full bg-line-strong" />
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function Numeracao({ indice }: { indice: number }) {
  return (
    <p className="text-micro text-ink-muted tabular-nums">
      {String(indice + 1).padStart(2, "0")} / {String(telas.length).padStart(2, "0")}
    </p>
  )
}

// 3a. Celular e menos movimento: texto e a print inteira, que sobe com fade.
function ListaDeTelas({ className }: { className?: string }) {
  return (
    <ol className={cn("space-y-20", className)}>
      {telas.map((tela, indice) => (
        <motion.li
          key={tela.chave}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: ease.out }}
          className="space-y-5"
        >
          <Numeracao indice={indice} />
          <h3 className="max-w-[18ch] font-display text-3xl leading-tight font-bold tracking-tight text-paper md:text-4xl">{tela.titulo}</h3>
          <p className="max-w-[42ch] text-body-lg text-ink-soft">{tela.texto}</p>
          <div className="pt-3">
            <Moldura endereco={tela.endereco}>
              <Print imagem={tela.imagem} descricao={tela.descricao} tamanhos="(min-width: 1024px) 1px, 100vw" />
            </Moldura>
          </div>
        </motion.li>
      ))}
    </ol>
  )
}

// Um cartão da pilha. A rolagem da seção vai de 0 a 1 e cada tela tem um trecho (1/n) dela:
// no começo do trecho o cartão termina de subir e, quando o próximo chega, recua para trás dele.
function CartaoDaPilha({ tela, indice, progresso }: { tela: Tela; indice: number; progresso: MotionValue<number> }) {
  const trecho = 1 / telas.length
  // Só os marcos dentro de 0..1: o motion leva isso ao navegador, que recusa pontos fora de ordem ou do trecho.
  const todos = [indice - 0.45, indice, indice + 0.55, indice + 1, indice + 1.55, indice + 2].map((m) => m * trecho)
  const validos = todos.map((m, posicao) => ({ m, posicao })).filter(({ m, posicao }) => m >= 0 && m <= 1 && (indice < telas.length - 1 || posicao <= 2)) // o último não recua
  const marcos = validos.map(({ m }) => m)
  const escolher = <T,>(valores: T[]) => validos.map(({ posicao }) => valores[posicao])
  const y = useTransform(progresso, marcos, escolher(["150%", "0%", "0%", "-5%", "-5%", "-9%"]))
  const escala = useTransform(progresso, marcos, escolher([1, 1, 1, 0.93, 0.93, 0.87]))
  const giro = useTransform(progresso, marcos, escolher([14, 0, 0, 0, 0, 0]))
  const sombra = useTransform(progresso, marcos, escolher([0, 0, 0, 0.5, 0.5, 0.9]))
  const presenca = useTransform(progresso, marcos, escolher([0, 1, 1, 1, 1, 1]))

  return (
    <motion.div style={{ y, scale: escala, rotateX: giro, opacity: presenca, zIndex: indice }} className="absolute inset-x-0 top-0 origin-top will-change-transform">
      <Moldura endereco={tela.endereco}>
        <Print imagem={tela.imagem} descricao={tela.descricao} tamanhos="(min-width: 1024px) 70vw, 1px" />
        <motion.div aria-hidden style={{ opacity: sombra }} className="pointer-events-none absolute inset-0 bg-night" />
      </Moldura>
    </motion.div>
  )
}

function BarraDoTrecho({ indice, progresso }: { indice: number; progresso: MotionValue<number> }) {
  const trecho = 1 / telas.length
  const preenchimento = useTransform(progresso, [indice * trecho, (indice + 1) * trecho], [0, 1])
  return (
    <span className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-line-strong">
      <motion.span style={{ scaleX: preenchimento }} className="absolute inset-0 origin-left rounded-full bg-paper" />
    </span>
  )
}

// 3b. Desktop: seção alta com um palco preso no meio da tela; a rolagem empilha os cartões.
function PilhaDeTelas({ rolagem, className }: { rolagem: React.RefObject<HTMLElement | null>; className?: string }) {
  const trilho = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container: rolagem, target: trilho, offset: ["start start", "end end"] })
  const [ativa, setAtiva] = useState(0)
  useMotionValueEvent(scrollYProgress, "change", (valor) => {
    const proxima = Math.min(telas.length - 1, Math.max(0, Math.floor(valor * telas.length + 0.2)))
    setAtiva((atual) => (atual === proxima ? atual : proxima))
  })
  const tela = telas[ativa]

  return (
    <div ref={trilho} className={cn("relative", className)} style={{ height: `${telas.length * 85 + 100}dvh` }}>
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-[minmax(0,4fr)_minmax(0,9fr)] items-center gap-14 px-10">
          <div className="space-y-8">
            <div className="min-h-[15rem]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tela.chave}
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.35, ease: ease.out }}
                  className="space-y-5"
                >
                  <Numeracao indice={ativa} />
                  <h3 className="max-w-[16ch] font-display text-4xl leading-tight font-bold tracking-tight text-paper xl:text-5xl">{tela.titulo}</h3>
                  <p className="max-w-[38ch] text-body-lg text-ink-soft">{tela.texto}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div aria-hidden className="flex max-w-[22rem] gap-2">
              {telas.map((item, indice) => (
                <BarraDoTrecho key={item.chave} indice={indice} progresso={scrollYProgress} />
              ))}
            </div>
          </div>

          {/* Os cartões ficam empilhados; o espaço de cima é para os que recuam aparecerem atrás. */}
          <div className="relative pt-10 [perspective:1600px]">
            <div className="relative aspect-[1910/980]">
              {telas.map((item, indice) => (
                <CartaoDaPilha key={item.chave} tela={item} indice={indice} progresso={scrollYProgress} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sobe pelos pais até achar quem rola (overflow auto/scroll); null = a própria janela.
function acharRolagem(elemento: HTMLElement | null): HTMLElement | null {
  for (let atual = elemento?.parentElement ?? null; atual; atual = atual.parentElement) {
    const { overflowY } = getComputedStyle(atual)
    if (overflowY === "auto" || overflowY === "scroll") return atual
  }
  return null
}

export function TelasApresentacao() {
  const secao = useRef<HTMLElement>(null)
  const rolagem = useRef<HTMLElement | null>(null)
  const [achouRolagem, setAchouRolagem] = useState(false)
  const menosMovimento = useReducedMotion()
  useLayoutEffect(() => {
    rolagem.current = acharRolagem(secao.current)
    setAchouRolagem(true)
  }, [])

  return (
    <section ref={secao} aria-labelledby="titulo-telas" className="overflow-x-clip border-t border-line">
      <div className="mx-auto max-w-content px-4 pt-24 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: ease.out }}
          className="mb-14 space-y-4 text-center"
        >
          <h2 id="titulo-telas" className="mx-auto max-w-[18ch] font-display text-4xl leading-none font-bold tracking-tight text-paper md:text-display-lg">
            Veja por dentro.
          </h2>
          <p className="mx-auto max-w-[48ch] text-lg text-ink-soft">Telas de verdade, do jeito que aparecem no app. O seu dia começa aqui.</p>
        </motion.div>
        {achouRolagem ? <PalcoInclinado rolagem={rolagem} /> : <div className="mx-auto aspect-[1910/980] max-w-[1120px]" />}
      </div>

      <div className="mt-24">
        <FaixaAreas />
      </div>

      {menosMovimento ? (
        <div className="mx-auto max-w-content px-4 py-24 md:px-10">
          <ListaDeTelas />
        </div>
      ) : (
        <>
          <div className="mx-auto max-w-content px-4 py-24 md:px-10 lg:hidden">
            <ListaDeTelas />
          </div>
          {achouRolagem && <PilhaDeTelas rolagem={rolagem} className="hidden lg:block" />}
        </>
      )}
    </section>
  )
}
