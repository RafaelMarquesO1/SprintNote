import {
  AppleIcon,
  BikeIcon,
  BookOpenIcon,
  BookmarkIcon,
  BrainIcon,
  BriefcaseIcon,
  BugIcon,
  CalendarDaysIcon,
  CircleCheckIcon,
  CodeIcon,
  CoffeeIcon,
  DropletIcon,
  DumbbellIcon,
  FileTextIcon,
  Flower2Icon,
  FolderIcon,
  FootprintsIcon,
  GraduationCapIcon,
  HandIcon,
  HeartIcon,
  LightbulbIcon,
  ListChecksIcon,
  MoonIcon,
  MusicIcon,
  NotebookPenIcon,
  PaletteIcon,
  PenLineIcon,
  PhoneOffIcon,
  PillIcon,
  PinIcon,
  RocketIcon,
  SparklesIcon,
  SproutIcon,
  StarIcon,
  TargetIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Rafael Marques - 20/10/2026
// Ícones de linha usados em notas e hábitos (no lugar de emojis).
// Os dados guardam só o nome (ex.: "ideia"); aqui ele vira o ícone.
export const icones: Record<string, LucideIcon> = {
  arquivo: FileTextIcon,
  caderno: NotebookPenIcon,
  ideia: LightbulbIcon,
  alvo: TargetIcon,
  livro: BookOpenIcon,
  foguete: RocketIcon,
  calendario: CalendarDaysIcon,
  estrela: StarIcon,
  pasta: FolderIcon,
  marcador: BookmarkIcon,
  alfinete: PinIcon,
  lista: ListChecksIcon,
  codigo: CodeIcon,
  pincel: PaletteIcon,
  trabalho: BriefcaseIcon,
  estudo: GraduationCapIcon,
  cerebro: BrainIcon,
  inseto: BugIcon,
  coracao: HeartIcon,
  mao: HandIcon,
  feito: CircleCheckIcon,
  agua: DropletIcon,
  corrida: FootprintsIcon,
  academia: DumbbellIcon,
  bicicleta: BikeIcon,
  meditacao: Flower2Icon,
  alimentacao: AppleIcon,
  cafe: CoffeeIcon,
  sono: MoonIcon,
  escrita: PenLineIcon,
  musica: MusicIcon,
  remedio: PillIcon,
  limpeza: SparklesIcon,
  dinheiro: WalletIcon,
  planta: SproutIcon,
  "sem-celular": PhoneOffIcon,
}

export const iconesNota = [
  "arquivo", "caderno", "ideia", "alvo", "livro", "foguete", "calendario", "estrela",
  "pasta", "marcador", "alfinete", "lista", "codigo", "pincel", "trabalho", "estudo",
]

export const iconesHabito = [
  "feito", "agua", "livro", "corrida", "academia", "bicicleta", "meditacao", "alimentacao",
  "sono", "escrita", "musica", "remedio", "limpeza", "dinheiro", "planta", "sem-celular",
]

// Rafael Marques - 21/10/2026: ícones para as atividades da rotina.
export const iconesRotina = [
  "feito", "cafe", "alimentacao", "trabalho", "estudo", "livro", "academia", "corrida",
  "bicicleta", "meditacao", "agua", "sono", "escrita", "musica", "remedio", "limpeza",
  "dinheiro", "planta", "codigo", "calendario", "alvo", "ideia", "coracao", "sem-celular",
]

export function Icone({ nome, className }: { nome: string; className?: string }) {
  const Componente = icones[nome] ?? FileTextIcon
  return <Componente aria-hidden className={cn("size-4 shrink-0", className)} />
}
