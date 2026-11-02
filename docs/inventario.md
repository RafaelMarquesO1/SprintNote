# Inventário do SprintNote (antes do redesign v2)

Gerado na fase 0 do `SPRINTNOTE_REDESIGN.md` (regra 0.4). É o checklist da reescrita: nada desta lista pode sumir.
Base: commit `54fb834` (v1.3b), branch `redesign/v2`.

## Rotas de página (`app/`)

| URL | Arquivo | Conteúdo |
|---|---|---|
| `/` | `app/page.tsx` | Início (Hoje): `PainelInicio`. Deslogado: `PortaoConta` mostra abertura → apresentação → entrada |
| `/tarefas` | `app/tarefas/page.tsx` | `ListaTarefas` |
| `/habitos` | `app/habitos/page.tsx` | `PainelHabitos` |
| `/rotina` | `app/rotina/page.tsx` | `PainelRotina` |
| `/kanban` | `app/kanban/page.tsx` | `QuadroKanban` (pessoal + equipe; visões quadro/lista/calendário) |
| `/notas` | `app/notas/page.tsx` | Biblioteca (`Explorador`; `?livro=ID` abre um caderno) |
| `/notas/[id]` | `app/notas/[id]/page.tsx` | `EditorNota` |
| `/grafo` | `app/grafo/page.tsx` | `PainelGrafo` (React Flow) |
| `/tags` | `app/tags/page.tsx` | `PaginaTags` |
| `/conta` | `app/conta/page.tsx` | `PaginaConta` |
| `/creditos` | `app/creditos/page.tsx` | Créditos |
| `/convite/[token]` | `app/convite/[token]/page.tsx` | Aceitar convite de equipe |
| `/livros/:id` | redirect em `next.config.ts` | → `/notas?livro=:id` |

Layout raiz: `app/layout.tsx` (fontes Geist/Literata/Caveat, script de tema, `PortaoConta`, `SidebarProvider` + `AppSidebar`, topo com `BotaoBusca`, `DialogoBusca`, `CartaoNovidades`).

## Rotas de API (`app/api/`) — contrato não muda

| Rota | Métodos | Uso |
|---|---|---|
| `/api/conta` | GET | Usuário logado |
| `/api/conta/exportar` | GET | Exportar todos os dados |
| `/api/conta/foto` | GET PUT DELETE | Foto de perfil |
| `/api/dados` | GET PUT | Áreas de dados (JSON por chave, com versão e 409 em conflito) |
| `/api/equipes` | GET POST | Equipes do usuário |
| `/api/equipes/[equipeId]` | PATCH DELETE | Renomear / excluir equipe |
| `/api/equipes/[equipeId]/convites` | GET POST | Convites |
| `/api/equipes/[equipeId]/convites/[conviteId]` | DELETE | Cancelar convite |
| `/api/equipes/[equipeId]/membros/[usuarioId]` | PATCH DELETE | Papel / remover membro |
| `/api/equipes/[equipeId]/quadros` | POST | Criar quadro de equipe |
| `/api/convites/[token]` | GET POST | Ver / aceitar convite |
| `/api/quadros-equipe/[quadroId]` | GET DELETE | Quadro de equipe |
| `/api/quadros-equipe/[quadroId]/operacoes` | POST | Operações no quadro de equipe |
| `/api/quadros-equipe/[quadroId]/fundo` | GET | Imagem de fundo |

## Server Actions (`lib/servidor/acoes-conta.ts`)

`cadastrar`, `entrar`, `sair`, `atualizarNome`, `alterarSenha`, `sairDeTodosOsAparelhos`, `excluirConta`.

## Chamadas ao banco (Neon, `banco()`)

- `lib/servidor/banco.ts` (cliente), `lib/servidor/sessao.ts` (sessões/cookie), `lib/servidor/acoes-conta.ts` (usuários),
  `lib/servidor/equipes.ts` (equipes, convites, membros, quadros de equipe), `app/api/dados/route.ts` (`dados_usuario`),
  `app/api/conta/exportar/route.ts`.
- Migrações: `db/002-equipes.sql`, `db/003-kanban-extras.sql`, `db/004-numero-cartao.sql`.

## Stores Zustand (`lib/estado/`)

| Store | Persistida (chave localStorage = chave em `dados_usuario`) | Sincronizada com a conta |
|---|---|---|
| `useNotas` | `sprintnote-notas` | sim |
| `useTarefas` | `sprintnote-tarefas` | sim |
| `useHabitos` | `sprintnote-habitos` | sim |
| `useRotina` | `sprintnote-rotina` | sim |
| `useKanban` | `sprintnote-kanban` (só quadros pessoais) | sim |
| `useInicio` | `sprintnote-inicio` | sim |
| `usePreferencias` | `sprintnote-preferencias` | sim |
| `useVisaoKanban` | `sprintnote-kanban-visao` | não (só navegador) |
| `useEquipes`, `useFiltroAtribuidos`, `usePaineisKanban`, `useDesfazerKanban`, `useSincronizacao` | não | — |

Sincronização: `lib/estado/sincronizacao.ts` (pessoal, com versão + junção em `mesclar.ts`) e `lib/estado/sincronizacao-equipes.ts` (quadros de equipe por operações).

## Regras de negócio que precisam sobreviver

- Tarefas dentro de notas (`[] tarefa @data`): `lib/tarefas-notas.ts`, `hooks/use-tarefas-unificadas.ts`
- Tags `#tag` e `#pai/filho`: `lib/tags.ts`, `components/notas/editor/extensoes/etiquetas.ts`
- `[[links]]` entre notas: `lib/links-wiki.ts`, `components/notas/editor/extensoes/link-nota.tsx`
- Citação de cartão `#12` em nota: `components/notas/editor/extensoes/citacao-cartao.ts`
- Sequência de hábitos: `lib/estado/habitos.ts` + `components/habitos/painel-habitos.tsx`
- Kanban: recorrência, modelos, fundo, numeração, complexidade, transferir (`lib/kanban/`), quadro livre (`lib/quadro/`)
- Markdown ↔ documento do editor: `lib/editor/markdown-documento.ts`
- Importar Obsidian (`lib/importar-obsidian.ts`, `lib/zip-leitura.ts`), exportar (`lib/exportar.ts`, `lib/zip.ts`)
- Grafo: `lib/grafo.ts`
- Tema: `lib/theme.ts`, `components/theme-toggle.tsx`
- Avisos de prazo: `components/avisos-prazo.tsx`; novidades: `lib/novidades.ts`

## Testes existentes

`npm run teste:notas`, `teste:kanban`, `teste:quadro`, `teste:sincronizacao` (scripts Node com `node:assert`).

## Componentes (components/) — arquivo · linhas

- `components/app-sidebar.tsx` · 196
- `components/avisos-prazo.tsx` · 135
- `components/biblioteca/arvore.tsx` · 426
- `components/biblioteca/explorador.tsx` · 27
- `components/biblioteca/selecao.ts` · 18
- `components/busca.tsx` · 337
- `components/conta/documentos-legais.tsx` · 181
- `components/conta/enquadrar-foto.tsx` · 149
- `components/conta/marca-app.tsx` · 18
- `components/conta/menu-conta.tsx` · 105
- `components/conta/pagina-conta.tsx` · 542
- `components/conta/portao-conta.tsx` · 155
- `components/conta/secoes-apresentacao.tsx` · 697
- `components/conta/tela-abertura.tsx` · 41
- `components/conta/tela-apresentacao.tsx` · 137
- `components/conta/tela-entrada.tsx` · 194
- `components/conta/vitrine-apresentacao.tsx` · 144
- `components/equipes/avatar-pessoa.tsx` · 35
- `components/equipes/cartao-equipe.tsx` · 398
- `components/equipes/conteudo-equipes.tsx` · 106
- `components/equipes/pagina-convite.tsx` · 86
- `components/grafo/grafo-conexoes.tsx` · 489
- `components/grafo/painel-grafo.tsx` · 393
- `components/habitos/painel-habitos.tsx` · 288
- `components/icone.tsx` · 332
- `components/inicio/catalogo-widgets.ts` · 209
- `components/inicio/dialogos-inicio.tsx` · 332
- `components/inicio/painel-inicio.tsx` · 438
- `components/inicio/topo-inicio.tsx` · 122
- `components/inicio/widgets.tsx` · 810
- `components/inline-script.tsx` · 9
- `components/kanban/ajuste-foto-ao-vivo.tsx` · 150
- `components/kanban/aviso-desfazer.tsx` · 49
- `components/kanban/blocos-cartao.tsx` · 25
- `components/kanban/camada-fundo.tsx` · 50
- `components/kanban/cartao-kanban.tsx` · 336
- `components/kanban/coluna-kanban.tsx` · 315
- `components/kanban/dialogo-arquivados.tsx` · 53
- `components/kanban/dialogo-cartao.tsx` · 738
- `components/kanban/dialogo-compartilhar.tsx` · 75
- `components/kanban/dialogo-modelos.tsx` · 84
- `components/kanban/dialogo-resumo.tsx` · 248
- `components/kanban/dialogos-quadro.tsx` · 225
- `components/kanban/editor-cartao.tsx` · 181
- `components/kanban/extras-cartao.tsx` · 252
- `components/kanban/leitura-foto.ts` · 100
- `components/kanban/paineis-kanban.tsx` · 34
- `components/kanban/quadro-kanban.tsx` · 935
- `components/kanban/raias-kanban.tsx` · 119
- `components/kanban/seletor-fundo.tsx` · 93
- `components/kanban/visao-calendario.tsx` · 270
- `components/kanban/visao-lista.tsx` · 167
- `components/livros/dialogo-excluir-livro.tsx` · 61
- `components/livros/pagina-livro.tsx` · 341
- `components/notas/arvore-notas.tsx` · 89
- `components/notas/biblioteca-vazia.tsx` · 105
- `components/notas/capa-nota.tsx` · 243
- `components/notas/diagrama-mermaid.tsx` · 191
- `components/notas/dialogo-excluir-nota.tsx` · 67
- `components/notas/editor-nota.tsx` · 537
- `components/notas/editor/alca-bloco.tsx` · 143
- `components/notas/editor/barra-flutuante.tsx` · 275
- `components/notas/editor/barra-mobile.tsx` · 130
- `components/notas/editor/comandos-barra.tsx` · 131
- `components/notas/editor/controles-tabela.tsx` · 64
- `components/notas/editor/dialogo-imagem.tsx` · 109
- `components/notas/editor/dialogo-prazo.tsx` · 135
- `components/notas/editor/editor-notas.tsx` · 175
- `components/notas/editor/extensoes/atalhos.ts` · 74
- `components/notas/editor/extensoes/citacao-cartao.ts` · 98
- `components/notas/editor/extensoes/codigo.tsx` · 167
- `components/notas/editor/extensoes/colar.ts` · 77
- `components/notas/editor/extensoes/destaque.tsx` · 99
- `components/notas/editor/extensoes/etiquetas.ts` · 62
- `components/notas/editor/extensoes/link-nota.tsx` · 66
- `components/notas/editor/extensoes/sugestoes-notas.tsx` · 156
- `components/notas/editor/ganchos.ts` · 27
- `components/notas/editor/lista-sugestoes.tsx` · 111
- `components/notas/editor/sugestao.ts` · 71
- `components/notas/linha-tags.tsx` · 154
- `components/notas/lista-notas.tsx` · 710
- `components/notas/painel-conexoes.tsx` · 228
- `components/notas/visualizacao-markdown.tsx` · 218
- `components/novidades/cartao-novidades.tsx` · 150
- `components/pagina.tsx` · 103
- `components/painel-personalizar.tsx` · 219
- `components/quadro/contexto.tsx` · 31
- `components/quadro/cores.ts` · 21
- `components/quadro/escolher-nota.tsx` · 58
- `components/quadro/nos.tsx` · 290
- `components/quadro/quadro-editor.tsx` · 672
- `components/quadro/seta.tsx` · 129
- `components/rotina/dialogo-rotina.tsx` · 139
- `components/rotina/painel-rotina.tsx` · 500
- `components/seletor-dias.tsx` · 42
- `components/tags/pagina-tags.tsx` · 115
- `components/tarefas/dialogo-tarefa.tsx` · 114
- `components/tarefas/lista-tarefas.tsx` · 321
- `components/theme-toggle.tsx` · 20
- `components/ui/alert-dialog.tsx` · 187
- `components/ui/alert.tsx` · 75
- `components/ui/avatar.tsx` · 108
- `components/ui/badge.tsx` · 51
- `components/ui/button.tsx` · 57
- `components/ui/card.tsx` · 102
- `components/ui/checkbox.tsx` · 28
- `components/ui/collapsible.tsx` · 21
- `components/ui/command.tsx` · 196
- `components/ui/dialog.tsx` · 160
- `components/ui/dropdown-menu.tsx` · 267
- `components/ui/field.tsx` · 238
- `components/ui/hover-card.tsx` · 50
- `components/ui/input-group.tsx` · 158
- `components/ui/input.tsx` · 19
- `components/ui/kbd.tsx` · 26
- `components/ui/label.tsx` · 19
- `components/ui/popover.tsx` · 89
- `components/ui/progress.tsx` · 82
- `components/ui/separator.tsx` · 24
- `components/ui/sheet.tsx` · 138
- `components/ui/sidebar.tsx` · 822
- `components/ui/skeleton.tsx` · 13
- `components/ui/spinner.tsx` · 10
- `components/ui/switch.tsx` · 31
- `components/ui/tabs.tsx` · 81
- `components/ui/textarea.tsx` · 17
- `components/ui/toggle-group.tsx` · 89
- `components/ui/toggle.tsx` · 44
- `components/ui/tooltip.tsx` · 65

## Hooks (hooks/)

- `hooks/use-hidratado.ts`
- `hooks/use-hoje.ts`
- `hooks/use-mobile.ts`
- `hooks/use-tarefas-unificadas.ts`

## Lógica de domínio (lib/) — arquivo · linhas

- `lib/arrastar.ts` · 12
- `lib/conta/documentos.ts` · 19
- `lib/cores.ts` · 107
- `lib/datas.ts` · 45
- `lib/editor/markdown-documento.teste.ts` · 390
- `lib/editor/markdown-documento.ts` · 821
- `lib/equipes/api.ts` · 32
- `lib/equipes/diferenca.ts` · 135
- `lib/estado/desfazer-kanban.ts` · 20
- `lib/estado/equipes.ts` · 33
- `lib/estado/filtro-atribuidos.ts` · 41
- `lib/estado/habitos.ts` · 82
- `lib/estado/inicio.ts` · 150
- `lib/estado/kanban.ts` · 649
- `lib/estado/mesclar.teste.ts` · 90
- `lib/estado/mesclar.ts` · 120
- `lib/estado/notas.ts` · 232
- `lib/estado/paineis-kanban.ts` · 11
- `lib/estado/preferencias.ts` · 59
- `lib/estado/rotina.ts` · 102
- `lib/estado/sincronizacao-equipes.ts` · 284
- `lib/estado/sincronizacao.ts` · 353
- `lib/estado/tarefas.ts` · 91
- `lib/estado/visao-kanban.ts` · 31
- `lib/exportar.ts` · 177
- `lib/gerar-id.ts` · 7
- `lib/grafo.ts` · 150
- `lib/imagem.ts` · 38
- `lib/importar-obsidian.ts` · 288
- `lib/kanban/complexidade.ts` · 24
- `lib/kanban/fundo.teste.ts` · 72
- `lib/kanban/fundo.ts` · 132
- `lib/kanban/modelos.teste.ts` · 97
- `lib/kanban/modelos.ts` · 143
- `lib/kanban/numeracao.ts` · 22
- `lib/kanban/preparar-foto.ts` · 20
- `lib/kanban/recorrencia.teste.ts` · 57
- `lib/kanban/recorrencia.ts` · 47
- `lib/kanban/transferir.ts` · 170
- `lib/links-wiki.ts` · 267
- `lib/novidades.ts` · 215
- `lib/quadro/modelo.teste.ts` · 74
- `lib/quadro/modelo.ts` · 190
- `lib/quadro/modelos.ts` · 74
- `lib/realce-codigo.ts` · 80
- `lib/servidor/acoes-conta.ts` · 162
- `lib/servidor/banco.ts` · 17
- `lib/servidor/equipes.ts` · 803
- `lib/servidor/rotas-equipe.ts` · 53
- `lib/servidor/senha.ts` · 30
- `lib/servidor/sessao.ts` · 60
- `lib/tags.ts` · 105
- `lib/tarefas-notas.ts` · 125
- `lib/theme.ts` · 21
- `lib/tipos-conta.ts` · 18
- `lib/tipos-equipe.ts` · 87
- `lib/tipos.ts` · 259
- `lib/utils.ts` · 1
- `lib/versao.ts` · 8
- `lib/zip-leitura.ts` · 57
- `lib/zip.ts` · 80
