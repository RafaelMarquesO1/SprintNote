# Plano: equipes, quadros compartilhados e atribuição de cartões

Status (Rafael Marques - 23/10/2026): **implementado; migração `db/002-equipes.sql` aplicada no banco do Neon em 23/10/2026**.

## Como ficou (decisões tomadas)

- Equipes pequenas (até 25 pessoas, 5 equipes por dono, 20 quadros por equipe).
- Convite **por link de uso único** (7 dias), com e-mail opcional para travar o convite a uma conta.
- **Um responsável** por cartão. Novos quadros de equipe e também "Compartilhar com equipe…" a partir de um quadro pessoal
  (o quadro sai da lista pessoal e os vínculos com notas pessoais são desfeitos).
- Gravação **por diferença**: o navegador compara com a última versão do servidor e manda só o que mudou
  (`lib/equipes/diferenca.ts`); atualização a cada ~6 s por número de versão (`lib/estado/sincronizacao-equipes.ts`).
- Permissões conferidas no servidor (`lib/servidor/equipes.ts`). Leitores não gravam: a tela volta ao que está no servidor.
- Tudo fica **dentro do Kanban**, sem páginas novas (Rafael Marques - 23/10/2026): o botão **Equipes** (no cabeçalho do quadro) abre uma janela
  para criar equipes, convidar e ver quadros; o botão **Atribuídos a mim** liga um filtro no quadro de equipe aberto (também na busca, Ctrl+K).
  O filtro é montado no navegador a partir dos cartões já carregados (não há rota própria no servidor).
- Foto de perfil também fica em `usuarios.foto`, para os colegas verem.

## Plano original


## Por que é um projeto à parte

Hoje cada área do app (notas, tarefas, Kanban…) é **um JSON por usuário**:
`dados_usuario(usuario_id, chave, valor)`. O navegador edita o estado inteiro
(Zustand + localStorage) e o `PUT /api/dados?chave=…` **substitui** o JSON todo
("último a salvar vence").

Num quadro compartilhado isso não funciona: duas pessoas editando ao mesmo
tempo apagariam o trabalho uma da outra. Compartilhar exige que o quadro saia
do JSON do usuário e passe a ser **dado da equipe, em tabelas próprias, com
gravação por operação** (mover cartão, editar cartão…), não por cópia do estado.

## Modelo de dados proposto (Neon / Postgres)

```
equipes            (id, nome, criada_por, criada_em)
membros_equipe     (equipe_id, usuario_id, papel, entrou_em)      -- papel: dono | editor | leitor
convites_equipe    (id, equipe_id, email, papel, token_hash, expira_em, aceito_em)

quadros_equipe     (id, equipe_id, titulo, icone, fundo, criado_em)
colunas_equipe     (id, quadro_id, titulo, cor, limite, concluida, ordem)
etiquetas_equipe   (id, quadro_id, nome, cor)
cartoes_equipe     (id, coluna_id, titulo, descricao, ordem, prazo, prioridade,
                    cor, arquivado, responsavel_id, criado_por, criado_em,
                    atualizado_em, versao)
itens_checklist    (id, cartao_id, texto, feito, ordem)
comentarios_cartao (id, cartao_id, autor_id, texto, criado_em)
atividade_cartao   (id, cartao_id, autor_id, texto, criado_em)
```

- `ordem` como número fracionário (ou texto "fractional index") para mover um
  cartão sem reescrever a coluna toda.
- `versao` no cartão para detectar edição simultânea (otimista: se a versão
  mudou, o servidor responde 409 e o app mostra a versão nova).
- Quadros **pessoais** continuam como hoje (JSON do usuário). Só os quadros
  "de equipe" usam as tabelas acima. Dá para migrar um quadro pessoal para uma
  equipe com um botão "Compartilhar com equipe".

## Permissões (checadas **no servidor**, nunca só na tela)

| Ação                                   | Leitor | Editor | Dono |
|----------------------------------------|:------:|:------:|:----:|
| Ver quadro, cartões, comentários       |   ✔    |   ✔    |  ✔   |
| Criar/editar/mover cartões, comentar   |        |   ✔    |  ✔   |
| Criar/editar colunas e etiquetas       |        |   ✔    |  ✔   |
| Convidar, mudar papéis, remover membros|        |        |  ✔   |
| Excluir quadro ou equipe               |        |        |  ✔   |

Toda rota de equipe começa por: usuário logado → é membro? → papel permite a ação?

## Rotas (App Router, handlers em `app/api/equipes/…`)

- `POST /api/equipes`, `GET /api/equipes` (minhas equipes)
- `POST /api/equipes/:id/convites`, `POST /api/convites/:token/aceitar`
- `GET /api/quadros/:id` (quadro completo) e `GET …/mudancas?desde=<instante>` (só o que mudou)
- `POST/PATCH/DELETE` por recurso: cartão, coluna, etiqueta, comentário
- `GET /api/equipes/:id/meus-cartoes` (cartões atribuídos a mim, em todos os quadros da equipe)

Antes de escrever o código, ler `node_modules/next/dist/docs/` (AGENTS.md avisa
que esta versão do Next muda convenções).

## Tempo quase real

Fase 1 (simples e suficiente): **atualização periódica** — o quadro aberto pergunta
`mudancas?desde=…` a cada ~5 s (e ao voltar para a aba). Sem WebSocket.
Fase 2 (se precisar): Server-Sent Events ou serviço de tempo real.

No navegador, o estado do quadro de equipe vem do servidor (não do localStorage):
a ação é aplicada na tela na hora (otimista) e enviada; se falhar, volta atrás.

## Atribuição e "meus cartões"

- `responsavel_id` no cartão (um responsável na primeira versão; vários depois).
- No cartão: seletor de responsável com foto/iniciais dos membros.
- Atalho **"Meus cartões"**: página/aba que lista cartões em que `responsavel_id = eu`,
  de todos os quadros da equipe, com filtro por prazo e prioridade. Também um
  chip "Meus" no filtro do quadro e um item na busca global (Ctrl + K).
- Avisos de prazo e o widget da Início passam a considerar "meus cartões".

## Fotos e nomes de outras pessoas

Hoje a foto fica nas preferências do próprio usuário (JSON). Em equipe, os
colegas precisam vê-la: mover a foto para `usuarios.foto` (data URL pequena,
256×256, ~15 KB) e devolver só nome + foto dos **membros da mesma equipe**.

## LGPD (conferir com a skill `lgpd` antes de publicar)

- **Base legal**: execução de contrato (o uso da equipe é pedido por quem convida/aceita).
- **Transparência**: ao convidar, avisar que o convidado terá nome, e-mail e foto
  visíveis aos membros; ao aceitar, mostrar quem verá o quê.
- **Minimização**: membros veem só nome, foto e e-mail dos colegas de equipe, nada mais.
- **Saída/exclusão**: ao sair de uma equipe, o conteúdo fica com a equipe, mas o
  autor dos comentários e cartões é mostrado como "Ex-membro" se a pessoa
  pedir (ou ao excluir a conta). Exclusão de conta: transferir a propriedade
  da equipe ou excluí-la, e anonimizar os comentários.
- **Direitos do titular**: `/api/conta/exportar` passa a incluir comentários e
  cartões atribuídos à pessoa; "Excluir conta" cobre as tabelas novas.
- Atualizar Termos e Política (`lib/conta/documentos.ts` → trocar `VERSAO_DOCUMENTOS`).
- Convites: token aleatório guardado só como hash, expira em 7 dias, uso único,
  e-mail nunca exposto a quem não é membro.

## Ordem de entrega sugerida

1. Banco: tabelas de equipes e membros + criar equipe + convite por link.
2. Quadro de equipe somente leitura (ver, trocar de quadro).
3. Edição por operação (cartões, colunas) com checagem de papel no servidor.
4. Atribuição de responsável + "Meus cartões".
5. Comentários e atividade no servidor (reaproveitam o formato já usado hoje).
6. Atualização periódica + tratamento de conflito (409).
7. Revisão de LGPD, textos legais, exportação e exclusão de conta.

## Perguntas em aberto para o Rafael

- Equipe pequena (até ~10 pessoas) ou aberta? Muda limites e custo no Neon.
- Convite só por e-mail/link, ou pessoas já cadastradas podem ser buscadas por e-mail?
- Um responsável por cartão ou vários?
- Quadros pessoais atuais podem ser "movidos" para a equipe, ou só criar novos?
