"use client"

import { KanbanSquareIcon, LayoutListIcon, CalendarDaysIcon, PlusIcon, MoreHorizontalIcon } from "lucide-react"
import { useState } from "react"

import { NowLine } from "@/components/motion/now-line"
import { AvatarStack } from "@/components/ui/avatar-stack"
import { Button, IconButton } from "@/components/ui/button"
import { CheckButton } from "@/components/ui/check"
import { Chip, ToggleChip } from "@/components/ui/chip"
import { DayPicker } from "@/components/ui/day-picker"
import { DateField, ListPicker, PriorityPicker, TimeField } from "@/components/ui/fields"
import { EmptyState } from "@/components/ui/empty-state"
import { FieldError, Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { ProgressSegments } from "@/components/ui/progress-segments"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Segmented } from "@/components/ui/segmented"
import { Skeleton } from "@/components/ui/skeleton"
import { StatList } from "@/components/ui/stat-list"
import { PriorityIcon, StatusIcon } from "@/components/ui/status-icon"
import { Tabs, TabsCount, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { definirTema } from "@/lib/theme"
import type { Prioridade } from "@/lib/tipos"

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-line pt-8">
      <h2 className="font-display text-title">{titulo}</h2>
      {children}
    </section>
  )
}

export function Vitrine() {
  const [visao, setVisao] = useState<"quadro" | "lista" | "calendario">("quadro")
  const [feito, setFeito] = useState(false)
  const [habito, setHabito] = useState(true)
  const [dias, setDias] = useState([1, 3, 5])
  const [data, setData] = useState<string | null>(null)
  const [hora, setHora] = useState("08:00")
  const [prioridade, setPrioridade] = useState<Prioridade>("media")
  const [lista, setLista] = useState("Estudos")
  const [filtro, setFiltro] = useState(true)
  const [dialogo, setDialogo] = useState(false)
  const [concluidos, setConcluidos] = useState(3)

  return (
    <main className="mx-auto max-w-content space-y-10 px-6 py-12 md:px-10">
      <PageHeader
        title="Componentes"
        description="Cada peça do sistema em todos os estados. Troque o tema para conferir os dois."
        actions={
          <Segmented
            label="Tema"
            value="escuro"
            onChange={(valor) => definirTema(valor as "escuro" | "claro")}
            options={[
              { value: "escuro", label: "Escuro" },
              { value: "claro", label: "Claro" },
            ]}
          />
        }
      />

      <Secao titulo="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Criar hábito</Button>
          <Button variant="secondary">Trocar quadro</Button>
          <Button variant="ghost">Ver todos</Button>
          <Button variant="danger">Excluir nota…</Button>
          <Button variant="irreversible">Excluir conta e dados</Button>
          <Button loading>Salvando</Button>
          <Button disabled>Desativado</Button>
          <Button size="sm">Pequeno</Button>
          <Button size="lg">Grande</Button>
          <IconButton aria-label="Mais opções">
            <MoreHorizontalIcon />
          </IconButton>
          <Button variant="secondary" data-icon="inline-start">
            <PlusIcon /> Adicionar cartão
          </Button>
        </div>
      </Secao>

      <Secao titulo="Campos">
        <div className="grid max-w-xl gap-4">
          <div>
            <Label htmlFor="v-nome">Nome</Label>
            <Input id="v-nome" className="mt-1.5" placeholder="Como quer ser chamado" />
          </div>
          <div>
            <Label htmlFor="v-erro">Nome do hábito</Label>
            <Input id="v-erro" className="mt-1.5" aria-invalid aria-describedby="v-erro-msg" />
            <FieldError id="v-erro-msg">Dê um nome para o hábito.</FieldError>
          </div>
          <Input variant="bare" aria-label="Anotar tarefa" placeholder="Anotar uma tarefa para hoje" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateField value={data} onChange={setData} />
          <TimeField label="Início" value={hora} onChange={setHora} />
          <PriorityPicker value={prioridade} onChange={setPrioridade} />
          <ListPicker value={lista} onChange={setLista} lists={["Estudos", "Projetos"]} />
        </div>
        <DayPicker value={dias} onChange={setDias} today={0} shortcuts />
      </Secao>

      <Secao titulo="Segmented e abas">
        <Segmented
          label="Visão do quadro"
          value={visao}
          onChange={setVisao}
          options={[
            { value: "quadro", label: "Quadro", icon: <KanbanSquareIcon /> },
            { value: "lista", label: "Lista", icon: <LayoutListIcon /> },
            { value: "calendario", label: "Calendário", icon: <CalendarDaysIcon /> },
          ]}
        />
        <Tabs defaultValue="hoje">
          <TabsList>
            <TabsTrigger value="hoje">
              Hoje <TabsCount>3</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="proximas">Próximas</TabsTrigger>
            <TabsTrigger value="todas">Todas</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs defaultValue="a">
          <TabsList variant="line">
            <TabsTrigger value="a">Perfil</TabsTrigger>
            <TabsTrigger value="b">Senha</TabsTrigger>
          </TabsList>
        </Tabs>
      </Secao>

      <Secao titulo="Chips, status e prioridade">
        <div className="flex flex-wrap items-center gap-2">
          <Chip>SisPep</Chip>
          <Chip>#chamados</Chip>
          <Chip variant="dashed">Adicionar tag</Chip>
          <ToggleChip pressed={filtro} onPressedChange={setFiltro}>
            Atrasados
          </ToggleChip>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-ui">
          {(["backlog", "paused", "todo", "doing", "done"] as const).map((status) => (
            <span key={status} className="inline-flex items-center gap-2">
              <StatusIcon status={status} /> {status}
            </span>
          ))}
          {(["baixa", "media", "alta"] as const).map((nivel) => (
            <span key={nivel} className="inline-flex items-center gap-2">
              <PriorityIcon priority={nivel} /> {nivel}
            </span>
          ))}
        </div>
      </Secao>

      <Secao titulo="Checks (M5)">
        <div className="flex items-center gap-6">
          <CheckButton checked={feito} onCheckedChange={setFeito} label="Concluir Revisar textos" />
          <CheckButton checked={habito} onCheckedChange={setHabito} variant="habit" label="Leitura, domingo" />
        </div>
      </Secao>

      <Secao titulo="Painéis, estatísticas e progresso">
        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="space-y-5 p-6">
            <PanelHeader title="Quadros" action={<Button variant="ghost" size="sm">Ver todos</Button>} />
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-ui font-semibold">Equipe Delta</span>
                <span className="font-display text-number tabular-nums">{Math.round((concluidos / 4) * 100)}%</span>
              </div>
              <ProgressSegments progress={{ total: 4, concluidos, percentual: 75, porForma: { backlog: 4 - concluidos, paused: 0, todo: 0, doing: 0, done: concluidos } }} />
            </div>
            <Button variant="secondary" size="sm" onClick={() => setConcluidos((valor) => (valor % 4) + 1)}>
              Mudar progresso
            </Button>
          </Panel>
          <Panel className="space-y-5 p-6">
            <StatList variant="highlight" stats={[{ label: "feitos hoje", text: "0/0" }, { label: "dias seguidos", value: concluidos }, { label: "nos últimos 30 dias", value: 25, suffix: "%" }]} />
            <StatList stats={[{ label: "cartões", value: 4 }, { label: "concluídos", value: concluidos }]} />
            <AvatarStack pessoas={[{ id: "1", nome: "Kaíke Duarte" }, { id: "2", nome: "Wagner Gomes" }, { id: "3", nome: "Rafael Marques" }]} />
          </Panel>
        </div>
      </Secao>

      <Secao titulo="Linha do agora">
        <Panel className="relative h-72 overflow-hidden p-6">
          {Array.from({ length: 6 }, (_, indice) => (
            <div key={indice} className="flex h-12 items-start border-t border-line text-micro text-ink-muted">
              {String(18 + indice).padStart(2, "0")}h
            </div>
          ))}
          <div className="absolute inset-x-6 top-6">
            <NowLine startHour={new Date().getHours() - 1} pxPerHour={48} />
          </div>
        </Panel>
      </Secao>

      <Secao titulo="Vazios, carregando, sobreposições">
        <EmptyState variant="inline" title="Domingo está livre na sua rotina." action={<Button variant="ghost" size="sm">Adicionar à rotina</Button>} />
        <EmptyState title="Seu dia começa aqui." description="Crie uma tarefa, um hábito ou um quadro." action={<Button>Criar tarefa</Button>} />
        <div className="space-y-2">
          <Skeleton variant="line" className="w-1/3" />
          <Skeleton variant="line" className="w-2/3" />
          <Skeleton variant="card" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setDialogo(true)}>
            Abrir dialog
          </Button>
          <Button variant="secondary" onClick={() => toast.comDesfazer("Tarefa concluída.", () => toast("Desfeito."))}>
            Mostrar toast
          </Button>
          <Kbd>Mod K</Kbd>
          <Kbd>Enter</Kbd>
        </div>
        <ResponsiveDialog open={dialogo} onOpenChange={setDialogo} title="Excluir “Lançamento do site”?" description="Isto não pode ser desfeito.">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialogo(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => setDialogo(false)}>
              Excluir nota
            </Button>
          </div>
        </ResponsiveDialog>
      </Secao>
    </main>
  )
}
