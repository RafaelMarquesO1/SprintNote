# Decisões do redesign v2

Escolhas que o `SPRINTNOTE_REDESIGN.md` não cobria ou que precisaram de ajuste ao código real.

## Fase 0

- **Gerenciador de pacotes:** o projeto usa npm (`package-lock.json`), não pnpm. Os comandos da seção 14 viram `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`.
- **`@types/node` 20 → 24:** o Vitest 5 exige `@types/node` ≥ 22, e o Node instalado é o 24.
- **Testes antigos mantidos:** os scripts `teste:*` (Node + `node:assert`) continuam e rodam dentro de `npm test`, depois do Vitest.
- **`lib/domain/`:** as regras puras novas ou reaproveitadas pelas telas novas ficam aqui (`habitos.ts`, `quadros.ts`). `calcularSequencia` e `valeNoDia` foram movidas para `lib/domain/habitos.ts` e continuam reexportadas por `lib/estado/habitos.ts`. Parsers de tarefa, tag e `[[link]]` já estavam em `lib/` (`tarefas-notas.ts`, `tags.ts`, `links-wiki.ts`) e não foram movidos, para não mexer em dezenas de imports; ganharam testes em `tests/unit/`.
- **Forma do status das colunas:** o quadro não tinha "status"; cada coluna tem nome livre. `formaDaColuna` usa o campo opcional `forma` (novo, aditivo, dentro do JSON do quadro) e, sem ele, deduz pelo nome e pelo `concluida`.
- **Rotas:** decidido com o Rafael manter `/` como Hoje para quem está logado (landing nova para quem não está). Não há `/inicio` nem `/entrar`; `/termos` e `/privacidade` entram como páginas novas.
- **Camada de dados:** decidido com o Rafael migrar leitura e escrita para Server Components/Server Actions. A tabela `dados_usuario` e o contrato de `/api/dados` não mudam (a rota continua existindo para o envio com `keepalive` ao fechar a aba, que Server Actions não suportam).
- **E2E com conta:** os testes de `tests/e2e/app.spec.ts` só rodam com `E2E_EMAIL`/`E2E_SENHA` de uma conta de teste. O `.env.local` aponta para o banco real; não criar contas de teste nele.

## Fases 1–3

- **Tema sem cookie:** o tema continua salvo no `localStorage` e aplicado por um script antes da página aparecer (sem flash). Um cookie obrigaria o layout raiz a ler `cookies()`, deixando todas as páginas dinâmicas com Cache Components.
- **`.dark` mantida:** além de `data-theme`, o `<html>` mantém a classe `dark`, porque os componentes antigos usam `dark:` e `classList.contains("dark")`.
- **Variáveis do shadcn remapeadas:** `--background`, `--muted`, `--primary` etc. apontam para os tokens novos, para as telas ainda não refeitas já ficarem no preto e branco.
- **`destructive` → `irreversivel`:** o vermelho saiu do sistema; o token `irreversivel` (#F87171) fica só para a última confirmação de "Excluir conta" (exceção da 3.1).
- **Regra de lint:** bloqueia `#hex` e valores arbitrários de cor, espaço, raio, sombra e duração em `components/motion`, `components/shell`, `components/features` e `app/(publico)`. Seletores (`data-[...]`), grades e `env()` ficam liberados.
- **Fonte do spec corrigida:** `--font-display: var(--font-display)` seria circular; o `next/font` usa `--fonte-*` e o tema aponta `--font-*` para elas.
- **Rotas no grupo `(app)`:** todas as páginas do app foram para `app/(app)/` (URLs iguais). O layout raiz só tem fontes, tema, motion e toasts; `/dev/componentes` e as páginas públicas ficam fora do portão de conta.
- **Leitura no servidor:** `app/(app)/layout.tsx` lê sessão e `dados_usuario` no servidor (dentro de `Suspense`, depois de `connection()`), e o `PortaoConta` recebe tudo pronto. A leitura não usa `"use cache"`: a junção entre aparelhos depende da versão exata do banco, e um cache desatualizado poderia fazer um aparelho gravar por cima do outro.
- **Gravação por Server Action:** `lib/actions/dados.ts` (`salvarArea`, `lerMeusDados`, `lerMinhasVersoes`), com a mesma lógica de versão da rota (agora em `lib/servidor/dados.ts`). O envio ao fechar a aba continua pela rota `/api/dados` com `keepalive`. Limite de corpo das actions: 20 MB (`serverActions.bodySizeLimit`).
- **Busca → paleta:** `components/busca.tsx` virou um reexport da paleta (`abrirBusca`). "Livros" passam a se chamar "Cadernos" na interface.
- **Banco de teste:** branch `dev-redesign` no Neon, usado só pelo `next dev` via `.env.development.local` (fora do git), com uma conta de teste (`E2E_EMAIL`/`E2E_SENHA` no mesmo arquivo).

## Fases 4–5

- **Hoje:** o painel de widgets antigo (`components/inicio/*`, `useInicio.widgets`) continua guardado, mas a tela usa os blocos novos (`useInicio.blocos`, campo aditivo). "Seu dia" é fixo.
- **Tarefas sem ordem manual:** as tarefas não têm campo de ordem; arrastar para reordenar e o swipe no celular (8.5) ficaram para depois. A ordem é: pendentes, data, prioridade.
- **Hábitos:** não existe "arquivar" no modelo; o detalhe oferece "Excluir…" com confirmação. O ícone por hábito continua salvo, mas não aparece (sistema monocromático).
- **Rotina:** nova visão `calendario` no tipo (aditivo). A antiga `cartoes` aparece como Lista. A cor por atividade deixou de aparecer.
- **Quadros — forma do status:** campo `forma` na coluna (JSON nos quadros pessoais). Quadros de equipe precisam de `db/005-forma-coluna.sql` **rodado em produção antes do deploy** (já aplicado no branch `dev-redesign`). O menu "Cor" da coluna virou "Forma do status".
- **Quadros — o que foi refeito:** cabeçalho, filtros (com `?tag=` e `?atrasados=1` na URL), colunas e cartões. Detalhe do cartão, visões Lista e Calendário, raias e dialogs mantêm a lógica e herdam os tokens; ainda usam dialog (não drawer) no celular.
- **Cores de etiqueta e faixa de cor do cartão:** continuam salvas, mas não aparecem (tags monocromáticas).

## Fases 6–7

- **Nota:** opções "Pautado" e "Cor de destaque" saíram da Aparência da nota (o valor salvo continua e é ignorado). "Compartilhar" copia o link da nota (não existe compartilhamento público de nota no backend).
- **Biblioteca, Caderno, Grafo, Conta:** mantêm a lógica e os componentes atuais; o cabeçalho comum (`CabecalhoPagina`/`ResumoLinha`) foi refeito no padrão novo e "Livro" virou "Caderno" nos textos. A URL `/cadernos/[id]` do spec não foi criada: o caderno continua em `/notas?livro=ID` (regra 0.2).
- **Entrada:** sem "Esqueci minha senha" — o backend não tem fluxo de recuperação (pendência). A exclusão de conta continua pedindo a **senha** (mais forte que digitar o e-mail).
- **Landing:** as sete seções ilustradas da v1.3b deram lugar às três colunas do artboard; a demonstração "Seu dia" usa `animation-timeline: view()` só onde o navegador suporta.
- **Termos e Privacidade:** páginas próprias em `/termos` e `/privacidade` (grupo `(publico)`), com o mesmo texto dos dialogs.
- **Versão:** o redesign é a versão 1.4 (era "2.0"; renumerado em 02/11/2026 para bater com os commits). As mudanças seguintes são a 1.4a (`package.json` 1.4.1, exibida "1.4a").

## Fase 8 — tinta de etiqueta (pedido do Rafael)

- **Etiquetas com cor, sem quebrar "laranja = agora":** a cor da etiqueta aparece só como um ponto de 8px dentro de um chip monocromático (`components/ui/etiqueta.tsx`). A tinta é suavizada (`oklch(from cor 0.74 min(c, 0.11) h)`). Laranja, coral e marrom saíram das opções de etiqueta; etiquetas antigas nesses tons (e cores personalizadas alaranjadas) aparecem em "areia" acinzentada.
- **Capa colorida do cartão saiu:** no modal, cartão com cor antiga mostra um aviso com "Virar etiqueta" (cria uma etiqueta com a cor e aplica no cartão) ou "Remover cor". A cor só some quando a pessoa escolhe.
- **Limpeza:** componentes da v1.3 sem uso foram removidos (menu lateral, widgets do Início, telas antigas de Tarefas/Hábitos/Rotina, avisos de prazo, seções da landing antiga). Vermelho e caixa-alta saíram das telas que vieram da v1.3 (exceto no quadro livre, onde a cor é do desenho).
- **Logotipo "S de fio" (pedido do Rafael):** em vez de três linhas de texto, a marca desenha o fio do produto: uma linha da nota desce em curva até a linha da tarefa e termina no ponto Brasa ("agora"). O mesmo caminho (`CAMINHO_FIO` em `components/brand/logo.tsx`) está em `app/icon.svg`, `apple-icon` e `opengraph-image`. Na tela de carregamento o fio se desenha uma vez (900ms, o "momento" permitido).
- **E2E:** "O que há de novo" abre depois de entrar e deixa o resto da página inerte; os testes fecham o aviso antes de verificar cada tela.

## Versão 1.4a (depois do redesign)

- **Fundo da página da nota repaginado (pedido do Rafael, 02/11/2026; desfaz o "remover a pauta" do 8.10):** opções Nenhum, Caderno, Foco, Papel, Pontilhado e Quadriculado. Caderno desenha a pauta em cada bloco de texto com a unidade `lh` (a pauta segue a altura da linha de cada bloco em qualquer fonte, tamanho e espaçamento), tem linha de margem e continua pautado depois do texto. Foco mostra a pauta só no bloco com o cursor (classe `bloco-atual`, extensão `components/notas/editor/extensoes/bloco-atual.ts`), esmaecendo em 240ms via `@property --cor-pauta`. Pontilhado e Quadriculado usam a altura da linha como passo e começam no canto do texto (medido em `useOrigemGrade`). Papel ganhou grão leve (`--grao-papel`). Notas salvas com "pautado" passam a abrir como Caderno. Tudo monocromático; imagens, tabelas e código ficam sem pauta.
- **Fundo do quadro repaginado (02/11/2026):** só texturas neutras, feitas com a cor do texto em transparência (combinam com o tema claro e escuro): Grão (o ruído do Papel das notas, sem o bege), Pontos, Grade, Linhas e Hachura, além de Nenhum e Sua foto. Névoa saiu. Uma versão com "Progresso" (página enchendo conforme os cartões são concluídos) e "Agora" (coluna em andamento em Brasa) foi testada e descartada pelo Rafael. Fundos salvos que não existem mais (`nevoa`, `cinza`, `grafite`, degradês e os breves `papel`/`progresso`/`agora`) viram Grão (`resolverFundoQuadro`, com teste). Colunas em vidro só com foto (`pedeVidro`); com textura, ficam com o contorno. Modelos de quadro: Estudos → Linhas, Atendimento → Grão, Produção de conteúdo → Hachura. Sem mudança no banco (o fundo já é texto).
- **Colunas do quadro com contorno (02/11/2026):** sem fundo no quadro, cada coluna tem borda `line` arredondada que termina no último cartão. A versão "bandeja" (fundo `raised` até o pé da tela) foi testada e descartada pelo Rafael.
- **Cartão do quadro:** prioridade e complexidade escritas por extenso ("Prioridade média", "Complexidade alta"), porque os ícones de barras se confundiam.
