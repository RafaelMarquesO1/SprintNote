"use client"

import { ArrowRightIcon } from "lucide-react"

import { LinkDocumento } from "@/components/conta/documentos-legais"
import { IconeApp } from "@/components/conta/marca-app"
import { IlustracaoEquipe, IlustracaoGrafo, IlustracaoHabitos, IlustracaoInicio, IlustracaoKanban, IlustracaoNotas, IlustracaoTarefas, SecaoRecurso } from "@/components/conta/secoes-apresentacao"
import { VitrineApresentacao } from "@/components/conta/vitrine-apresentacao"
import { Button } from "@/components/ui/button"
import { VERSAO_APP } from "@/lib/versao"

// Rafael Marques - 22/10/2026 (redesenho em 30/10/2026)
// Apresentação do projeto para quem ainda não entrou: o que o app faz, mostrado com o próprio app,
// e os botões para criar conta ou entrar.
export function TelaApresentacao({ aoEscolher }: { aoEscolher: (modo: "entrar" | "cadastro") => void }) {
  return (
    <div className="min-h-svh bg-background animate-in fade-in duration-500">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-2 font-semibold">
          <IconeApp />
          SprintNote
        </div>
        <Button variant="ghost" onClick={() => aoEscolher("entrar")}>
          Entrar
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-8">
        {/* Topo: a proposta à esquerda e o próprio app à direita */}
        <section className="grid items-center gap-12 py-12 md:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="space-y-6">
            <h1 className="max-w-xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Notas, tarefas e projetos que conversam entre si.
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-pretty text-muted-foreground">
              Escreva uma nota e cite o cartão do projeto. Abra o cartão e veja em que notas ele aparece. No SprintNote o que você planeja e o
              que você faz ficam no mesmo lugar.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => aoEscolher("cadastro")}>
                Criar conta grátis <ArrowRightIcon />
              </Button>
              <Button size="lg" variant="outline" onClick={() => aoEscolher("entrar")}>
                Já tenho conta
              </Button>
            </div>
          </div>
          <VitrineApresentacao />
        </section>

        {/* Rafael Marques - 30/10/2026: uma seção completa por funcionalidade, com ilustração que responde ao clique. */}
        <SecaoRecurso
          id="notas"
          titulo="Notas que se organizam sozinhas"
          frase="Escreva em blocos e veja o texto já formatado. Agrupe em livros e seções e cite outras notas ou cartões no meio do texto."
          pontos={["Listas, tarefas e blocos de código coloridos, que você pode minimizar", "Seções para reunir as notas de um mesmo assunto", "Citação de cartões do Kanban, com o número e o título"]}
        >
          <IlustracaoNotas />
        </SecaoRecurso>
        <SecaoRecurso
          id="grafo"
          invertida
          titulo="Veja como as ideias se ligam"
          frase="Cada link entre notas vira uma ligação no grafo. Dá para achar de onde veio uma ideia e o que ela puxou depois."
          pontos={["Seções aparecem como quadrados, notas como pontos", "Passe o mouse para destacar as ligações de uma nota", "Filtre por livro para ver só um assunto"]}
        >
          <IlustracaoGrafo />
        </SecaoRecurso>
        <SecaoRecurso
          id="kanban"
          titulo="Projetos em quadros, no estilo Trello"
          frase="Colunas para cada etapa e cartões com tudo o que o trabalho precisa. Clique na seta de um cartão para movê-lo."
          pontos={["Cartões numerados, com checklist, prazo, prioridade e anexos", "Histórico que mostra quem mudou o quê", "Modelos de cartão e calendário para agendar pelo dia"]}
        >
          <IlustracaoKanban />
        </SecaoRecurso>
        <SecaoRecurso
          id="tarefas"
          invertida
          titulo="O que é para hoje, primeiro"
          frase="As tarefas com prazo hoje aparecem juntas, e o que atrasou fica em destaque. Marque e veja o dia andar."
          pontos={["Prioridade alta, média ou baixa", "Listas por área: trabalho, pessoal, estudos", "Tarefas criadas dentro das notas também entram aqui"]}
        >
          <IlustracaoTarefas />
        </SecaoRecurso>
        <SecaoRecurso
          id="habitos"
          titulo="Hábitos e rotina para o seu dia"
          frase="Marque os hábitos e acompanhe a sequência de dias. A rotina mostra o seu dia por horário e o que vem a seguir."
          pontos={["Hábitos com dias da semana escolhidos", "Sequência que cresce a cada dia cumprido", "Rotina com horário de início e fim"]}
        >
          <IlustracaoHabitos />
        </SecaoRecurso>
        <SecaoRecurso
          id="inicio"
          invertida
          titulo="Um início do seu jeito"
          frase="A primeira tela mostra o seu dia: tarefas, hábitos, rotina, cartões e notas. Você escolhe o que aparece e o tamanho de cada parte."
          pontos={["Mais de quinze widgets para escolher", "Arraste para mudar de lugar e escolha a largura", "Resumo do dia com o que está atrasado"]}
        >
          <IlustracaoInicio />
        </SecaoRecurso>
        <SecaoRecurso
          id="equipe"
          titulo="Trabalhe em equipe, sem perder o que é seu"
          frase="Compartilhe quadros com quem trabalha com você. Cada pessoa tem um papel, e as suas notas continuam só suas."
          pontos={["Papéis de dono, editor e leitor", "Convite por link que vale por 7 dias", "Responsável, comentários e histórico em cada cartão"]}
        >
          <IlustracaoEquipe />
        </SecaoRecurso>

        {/* Fechamento */}
        <section className="flex flex-col items-start justify-between gap-6 border-t py-14 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="text-xl font-semibold tracking-tight">Comece pelo que está na sua cabeça agora.</p>
            <p className="text-sm text-muted-foreground">Criar a conta leva um minuto, e seus dados ficam salvos para usar em qualquer aparelho.</p>
          </div>
          <Button size="lg" onClick={() => aoEscolher("cadastro")}>
            Criar conta grátis <ArrowRightIcon />
          </Button>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-6 text-xs text-muted-foreground md:px-8">
          <span>SprintNote {VERSAO_APP}</span>
          <LinkDocumento tipo="privacidade" className="font-normal text-muted-foreground">
            Política de Privacidade
          </LinkDocumento>
          <LinkDocumento tipo="termos" className="font-normal text-muted-foreground">
            Termos de Uso
          </LinkDocumento>
        </div>
      </footer>
    </div>
  )
}
