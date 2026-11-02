# Componentes do SprintNote v2

Vitrine viva: `/dev/componentes` (só em `next dev`). Todos aceitam `className`. Cores, raios e durações só por token (seção 3 do redesign).

| Componente | Arquivo | Props principais | Estados / teclado |
|---|---|---|---|
| `Button` | `ui/button.tsx` | `variant`: primary, secondary, ghost, danger, irreversible (+ antigos default, outline, destructive, link); `size`: sm 32, md 40, lg 48; `loading` | hover `raised`; active scale .98 (90ms); foco anel Brasa; disabled opacidade .4; loading mantém largura com spinner de 14px |
| `IconButton` | `ui/button.tsx` | `aria-label` **obrigatório** na tipagem; `size` sm/md/lg | alvo 40px (44px em toque) |
| `Input`, `FieldError` | `ui/input.tsx` | `variant` default/bare; `inputSize` sm/md/lg | foco borda `paper`; erro: `aria-invalid` + `aria-describedby` → `FieldError` (texto + ícone, sem vermelho) |
| `Textarea` | `ui/textarea.tsx` | — | igual ao Input |
| `Label` | `ui/label.tsx` | `srOnly` | todo campo tem label |
| `Segmented` | `ui/segmented.tsx` | `value`, `onChange`, `options` (`icon`, `iconOnly`), `label`, `size` | `role="radiogroup"`; setas mudam; pílula desliza (M3, `spring.snappy`) |
| `Tabs` | `ui/tabs.tsx` | `TabsList variant` default (pílula) / line; `TabsCount` | indicador desliza com `--active-tab-*` (M3) |
| `Chip`, `ToggleChip` | `ui/chip.tsx` | `variant`: tag, filter, day, dashed | ligado = `aria-pressed`, fundo `paper` |
| `StatusIcon` | `ui/status-icon.tsx` | `status`: backlog, paused, todo, doing, done; `label` | forma, nunca cor |
| `PriorityIcon` | `ui/status-icon.tsx` | `priority`: baixa, media, alta | 1–3 barras |
| `Panel`, `PanelHeader` | `ui/panel.tsx` | `variant` default/dashed; `as` | raio `xl`, sem sombra |
| `PageHeader` | `ui/page-header.tsx` | `title`, `description`, `eyebrow`, `actions`, `stats`, `size` | título com `view-transition-name: page-title` (M1) |
| `StatList` | `ui/stat-list.tsx` | `stats`, `variant` inline/highlight | `<dl>`; números com `AnimatedNumber` |
| `EmptyState` | `ui/empty-state.tsx` | `title`, `description`, `action`, `variant` inline/block | o que é + por que + uma ação |
| `ProgressSegments` | `ui/progress-segments.tsx` | `progress` (de `lib/domain/quadros`) | segmentos crescem (M15); legenda textual sempre |
| `CheckButton` | `ui/check.tsx` | `variant` task/habit, `label` | `role="checkbox"`; Espaço/Enter; M5 |
| `DayPicker` | `ui/day-picker.tsx` | `value`, `today`, `shortcuts` | hoje com contorno Brasa + `aria-current="date"` |
| `DateField`, `TimeField`, `PriorityPicker`, `ListPicker` | `ui/fields.tsx` | valor + `onChange` | data "Hoje" em Brasa |
| `PersonAvatar`, `AvatarStack` | `ui/avatar-stack.tsx` | `pessoa(s)`, `max`, `size` | borda `night` de 2px |
| `Kbd` | `ui/kbd.tsx` | texto com `Mod` vira ⌘/Ctrl | — |
| `Dialog`, `Popover`, `DropdownMenu`, `Tooltip`, `Sheet` | `ui/*.tsx` (Base UI) | API do shadcn | fundo `panel` + `shadow-float`; entrada `lift` (160ms); foco preso, Esc fecha |
| `Drawer` | `ui/drawer.tsx` (vaul) | — | sobe de baixo; alça; safe-area |
| `ResponsiveDialog` | `ui/responsive-dialog.tsx` | `open`, `title`, `width` | dialog ≥ 768px, drawer abaixo |
| `Toaster`, `toast` | `ui/toast.tsx` (sonner) | `toast.comDesfazer`, `toast.erro` | embaixo no centro, 5s, `aria-live` |
| `Skeleton` | `ui/skeleton.tsx` | `variant` line/block/card | shimmer sutil `line` → `raised` (M14) |
| `NowLine`, `NowMarker` | `motion/now-line.tsx` | `startHour`, `pxPerHour`, `orientation` | Brasa; pulso para em movimento reduzido; `sr-only` "Agora, 20:07" |
| `AnimatedNumber` | `motion/number.tsx` | `value`, `suffix` | NumberFlow, respeita movimento reduzido |
| `LogoMark`, `Logo` | `brand/logo.tsx` | `size` | — |
