<div align="center">

<img src="app/icon.svg" alt="Logo do SprintNote" width="96" height="96" />

# SprintNote

**Notas, tarefas e quadros Kanban num só lugar — simples, rápido e organizado.**

[![Acessar o SprintNote](https://img.shields.io/badge/Acessar-sprintnote.vercel.app-171717?style=for-the-badge&logo=vercel&logoColor=white)](https://sprintnote.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-404040?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-404040?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-404040?style=flat-square&logo=tailwindcss&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-Postgres-404040?style=flat-square&logo=postgresql&logoColor=white)

</div>

---

## 📖 Introdução

O **SprintNote** nasceu de uma necessidade real. O Trello que eu usava no trabalho começou a dar problemas, e eu não queria perder o controle das minhas demandas. Para resolver isso e continuar com tudo organizado, resolvi criar o **SprintNote**!

Ele junta em um só app aquilo que eu usava espalhado em várias ferramentas: um **quadro Kanban** para acompanhar as demandas, **notas** para registrar o que importa, **tarefas** com prazo e um painel inicial que mostra o dia de relance.

### Como ele me atendeu

- **Substituiu o Trello no dia a dia** — o Kanban com arrastar e soltar cobre o fluxo de demandas que eu tinha antes.
- **Tudo num lugar só** — notas, tarefas, hábitos e rotina conversam entre si, sem trocar de aba.
- **Nada se perde** — os dados ficam salvos na conta e sincronizados entre dispositivos.
- **Avisos de prazo** — o app lembra do que está para vencer.
- **Funciona no celular** — layout responsivo para consultar as demandas de qualquer lugar.

### Funcionalidades

| Área | O que faz |
|---|---|
| **Início** | Painel com widgets personalizáveis do seu dia |
| **Kanban** | Quadros, colunas e cartões com arrastar e soltar; visões em lista e calendário, raias, modelos, importar/exportar, anexos, repetição, bloqueios, complexidade, resumo e foto de fundo (também nas equipes) |
| **Notas** | Editor ao estilo Notion (texto formatado ao digitar, menu `/`, imagens, tabelas, destaques), links entre notas (`[[nota]]`), capas e tags; por baixo continuam sendo Markdown |
| **Quadros** | Tela infinita ao estilo Canvas do Obsidian: formas, notas e grupos ligados por setas, tudo com o mouse ou o dedo |
| **Livros** | Árvore de livros e notas na barra lateral, com arrastar e soltar; a página do livro abre ao lado |
| **Tarefas** | Lista de tarefas com prazos, unificada com as tarefas das notas |
| **Hábitos e Rotina** | Acompanhamento de hábitos e rotina semanal |
| **Grafo** | Mapa visual das conexões entre as notas |
| **Busca** | Busca rápida por tudo (atalho de teclado) |
| **Conta** | Login, exportação dos dados e exclusão da conta, de acordo com a LGPD |
| **Tema** | Modo claro e escuro |

---

## Estrutura do projeto

```
sprintnote/
├── app/                    # Rotas (App Router do Next.js)
│   ├── api/
│   │   ├── conta/          # Conta do usuário e exportação dos dados (LGPD)
│   │   └── dados/          # Sincronização do conteúdo com o banco
│   ├── kanban/             # Quadros Kanban
│   ├── notas/              # Lista e editor de notas
│   ├── livros/             # Cadernos de notas
│   ├── tarefas/            # Tarefas
│   ├── habitos/            # Hábitos
│   ├── rotina/             # Rotina
│   ├── grafo/              # Grafo de conexões
│   ├── tags/               # Tags
│   ├── conta/              # Minha conta
│   ├── creditos/           # Créditos
│   ├── layout.tsx          # Layout raiz (barra lateral, busca, tema)
│   └── page.tsx            # Página inicial
│
├── components/             # Componentes React
│   ├── ui/                 # Componentes base (shadcn/ui)
│   ├── kanban/             # Quadro, colunas, cartões e diálogos
│   ├── notas/              # Editor (TipTap), tags, conexões
│   ├── quadro/             # Quadro interativo de formas e setas (xyflow)
│   ├── conta/              # Login, cadastro e documentos legais
│   └── ...                 # Início, tarefas, hábitos, rotina, grafo, livros
│
├── hooks/                  # Hooks reutilizáveis
├── lib/
│   ├── estado/             # Estado global com Zustand (uma store por área)
│   ├── servidor/           # Banco, sessão, senha e ações da conta
│   └── ...                 # Utilitários (datas, tags, grafo, exportação…)
│
├── docs/
│   └── lgpd.md             # Registro de conformidade com a LGPD
└── .env.example            # Modelo das variáveis de ambiente
```

---

## Tecnologias utilizadas

| Categoria | Tecnologia |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev) |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org) |
| **Estilo** | [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) ([Base UI](https://base-ui.com)) |
| **Estado** | [Zustand](https://zustand-demo.pmnd.rs) |
| **Banco de dados** | [Neon](https://neon.tech) (Postgres serverless, região São Paulo) |
| **Arrastar e soltar** | [dnd-kit](https://dndkit.com) |
| **Editor de notas** | [TipTap](https://tiptap.dev) (ProseMirror); a conversão Markdown ↔ documento fica em `lib/editor/` (testes: `npm run teste:notas`) |
| **Markdown** | [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) + [highlight.js](https://highlightjs.org) |
| **Busca** | [cmdk](https://cmdk.paco.me) |
| **Ícones** | [Lucide](https://lucide.dev) |
| **Hospedagem** | [Vercel](https://vercel.com) |

---

## Deploy

O SprintNote está no ar na Vercel:

### [sprintnote.vercel.app](https://sprintnote.vercel.app)


</div>
