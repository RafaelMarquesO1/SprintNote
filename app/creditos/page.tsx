import type { Metadata } from "next"
import Link from "next/link"

import { comandosEditor } from "@/components/notas/comandos-editor"
import { BookOpenIcon } from "lucide-react"

import { CabecalhoPagina, Pagina } from "@/components/pagina"
import { Kbd } from "@/components/ui/kbd"

export const metadata: Metadata = { title: "Guia · SprintNote" }

const secoes = [
  { id: "sidebar", titulo: "Navegação" },
  { id: "tarefas", titulo: "Tarefas" },
  { id: "habitos", titulo: "Hábitos" },
  { id: "rotina", titulo: "Rotina" },
  { id: "livros", titulo: "Livros e notas" },
  { id: "tela", titulo: "Tela da nota e capa" },
  { id: "editor", titulo: "Editor estilo Notion" },
  { id: "links", titulo: "Conectando notas" },
  { id: "grafo", titulo: "Grafo" },
  { id: "tags", titulo: "Tags" },
  { id: "prazos", titulo: "Prazos nas tarefas" },
  { id: "busca", titulo: "Busca rápida" },
  { id: "kanban", titulo: "Kanban" },
  { id: "dados", titulo: "Conta e dados" },
  { id: "creditos", titulo: "Créditos" },
]

const tecnologias = [
  { nome: "Next.js 16", uso: "framework (App Router e Cache Components)" },
  { nome: "React 19", uso: "interface" },
  { nome: "Tailwind CSS 4", uso: "estilos" },
  { nome: "shadcn/ui + Base UI", uso: "componentes (sidebar, diálogos, menus)" },
  { nome: "Zustand", uso: "estado e persistência no navegador" },
  { nome: "dnd-kit", uso: "arrastar e soltar do Kanban" },
  { nome: "react-markdown + remark-gfm", uso: "visualização do Markdown" },
  { nome: "cmdk", uso: "busca Ctrl + K" },
  { nome: "Lucide", uso: "ícones" },
]

function Secao({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 space-y-3">
      <h2 className="border-b pb-1 text-xl font-semibold tracking-tight">{titulo}</h2>
      <div className="space-y-3 text-sm leading-7 text-muted-foreground [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  )
}

function Codigo({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">{children}</code>
}

// Rafael Marques - 20/10/2026
// Guia explicativo de todas as funções do SprintNote + créditos.
export default function PaginaGuia() {
  return (
    <Pagina largura="leitura" className="space-y-10">
      <div className="space-y-3">
        <CabecalhoPagina
          secao="Ajuda"
          icone={BookOpenIcon}
          titulo="Guia do SprintNote"
          descricao="Sua central de organização: livros de notas conectadas no estilo Notion + Obsidian, tarefas, hábitos, rotina diária e um quadro Kanban para a sprint."
        />
        <nav aria-label="Seções do guia" className="flex flex-wrap gap-2 pt-2">
          {secoes.map((secao) => (
            <a
              key={secao.id}
              href={`#${secao.id}`}
              className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
            >
              {secao.titulo}
            </a>
          ))}
        </nav>
      </div>

      <Secao id="sidebar" titulo="Navegação">
        <p>
          A <strong>página inicial</strong> é o painel do seu dia: tarefas de hoje, hábitos para marcar,
          o próximo item da rotina, o andamento da sprint e as notas recentes.
        </p>
        <p>
          A <strong>sidebar</strong> é dividida em seções: <strong>Organização</strong> (Tarefas, Hábitos,
          Rotina e Kanban, com contadores do dia) e <strong>Biblioteca</strong> (livros, notas e o grafo). Clique no nome
          de uma seção para recolhê-la. No rodapé ficam este guia e o botão de tema claro/escuro. O botão
          no topo da página (ou <Kbd>Ctrl</Kbd> + <Kbd>B</Kbd>) esconde a sidebar.
        </p>
      </Secao>

      <Secao id="tarefas" titulo="Tarefas">
        <p>
          Adicione tarefas com <strong>prazo</strong>, <strong>prioridade</strong> (alta, média, baixa) e uma
          <strong> lista</strong> livre, como “Trabalho” ou “Estudos”. As abas separam <strong>Hoje</strong>
          (inclui as atrasadas), <strong>Próximas</strong>, <strong>Todas</strong> e <strong>Concluídas</strong>;
          os botões de lista filtram por projeto.
        </p>
        <p>
          Clique na bolinha para concluir e no texto para editar a descrição, o prazo e o resto. Na busca
          <Kbd> Ctrl</Kbd> + <Kbd>K</Kbd>, escolher uma tarefa conclui (ou reabre) na hora.
        </p>
        <p>
          As <strong>tarefas escritas nas notas</strong> (<Codigo>[] Estudar @amanhã</Codigo>) também aparecem aqui, com um
          atalho para a nota de origem. Marcar aqui marca na nota, e vice-versa. O botão “Das notas” mostra só elas.
        </p>
      </Secao>

      <Secao id="habitos" titulo="Hábitos">
        <p>
          Crie hábitos com um ícone e os <strong>dias da semana</strong> em que valem (ex.: exercício só
          seg/qua/sex). A tabela mostra os últimos 7 dias: clique nos quadrados para marcar o que fez — dá
          para marcar dias anteriores que você esqueceu.
        </p>
        <p>
          A coluna <strong>Seq.</strong> (com o ícone de chama) é a sequência atual de dias programados cumpridos sem falhar. O dia
          de hoje só quebra a sequência depois que acaba. Abaixo do nome aparece o aproveitamento nos últimos
          30 dias.
        </p>
      </Secao>

      <Secao id="rotina" titulo="Rotina">
        <p>
          Monte sua rotina com <strong>horário</strong> e <strong>dias da semana</strong> para cada atividade.
          Escolha o dia nas abas para ver ou montar a rotina dele (o ponto marca hoje).
        </p>
        <p>
          No dia de hoje, marque as atividades feitas e veja qual é a atividade de <strong>agora</strong>. As
          marcações valem só para o dia — amanhã a rotina começa zerada.
        </p>
      </Secao>

      <Secao id="livros" titulo="Livros e notas">
        <p>
          A <strong>Biblioteca</strong> organiza suas notas em <strong>livros</strong>: um livro reúne várias notas
          sobre um assunto (como um caderno). Crie um livro pelo ícone de livro ao lado de “Biblioteca” na sidebar
          ou pela página <Link href="/notas" className="text-primary underline underline-offset-4">Todos os livros</Link>.
          Notas também podem ficar fora de livros, como <strong>notas soltas</strong>.
        </p>
        <p>
          Na sidebar, passe o mouse sobre um livro e clique em <strong>+</strong> para criar uma nota nele; sobre uma
          nota, o <strong>+</strong> cria uma <strong>subnota</strong>. Para mudar uma nota de livro, use o seletor de
          livro logo abaixo do título da nota. Ao excluir um livro, você escolhe manter as notas (viram soltas) ou
          excluir tudo.
        </p>
      </Secao>

      <Secao id="tela" titulo="Tela da nota e capa">
        <p>
          A nota mostra só o que importa: capa, ícone, título e texto. No topo fica uma barra fina com o caminho
          (livro e notas pai) e três botões:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Conexões</strong> — abre um painel ao lado com o mapa da nota, referências, links, sugestões, tags, subnotas e Kanban;</li>
          <li>
            <strong>Personalizar</strong> — fonte (padrão, serifada, mono ou manuscrita), tamanho do texto, espaçamento entre
            linhas, largura, <strong>cor de destaque</strong> (caixas de tarefa, marcadores, citações e links), <strong>fundo da
            página</strong> (papel, pontilhado, quadriculado ou pautado), capa e altura da capa, título centralizado e ocultar o ícone;
          </li>
          <li><strong>⋯</strong> — mover para outro livro, exportar como Markdown e excluir.</li>
        </ul>
        <p>
          A <strong>capa</strong> pode ser um gradiente, uma cor, uma imagem do seu computador (reduzida para caber no navegador)
          ou o link de uma imagem. Passe o mouse sobre ela para trocar, <strong>reposicionar</strong> (arrastando) ou remover.
          Clique no ícone para trocá-lo. No título, <Kbd>Enter</Kbd> desce para o texto.
        </p>
        <p>
          Tudo é salvo <strong>na hora</strong>: ao digitar o título, a sidebar, o caminho e os links das outras notas já mudam
          junto. Os cartões do Kanban e as tarefas também salvam enquanto você edita — não existe botão “Salvar”.
        </p>
      </Secao>

      <Secao id="editor" titulo="Editor estilo Notion">
        <p>
          A nota é editada em <strong>blocos</strong>: cada parágrafo, título ou item já aparece formatado e vira
          editável ao clicar — não existe tela separada de visualização. Tudo é salvo na hora, em Markdown (dá para
          exportar a nota em <strong>⋯ → Exportar como Markdown</strong>).
        </p>
        <p>
          <strong>Atalhos de Markdown</strong> no começo de um bloco: <Codigo># </Codigo> título,{" "}
          <Codigo>## </Codigo> subtítulo, <Codigo>- </Codigo> lista, <Codigo>1. </Codigo> lista numerada,{" "}
          <Codigo>[] </Codigo> tarefa, <Codigo>&gt; </Codigo> citação, <Codigo>```</Codigo> código e{" "}
          <Codigo>---</Codigo> divisor. <Kbd>Enter</Kbd> cria o próximo bloco (em listas, continua a lista;
          numa linha vazia, sai dela), <Kbd>Shift</Kbd> + <Kbd>Enter</Kbd> quebra a linha, <Kbd>Tab</Kbd> recua itens de
          lista e <Kbd>Backspace</Kbd> no início desfaz o tipo do bloco ou junta com o de cima.
        </p>
        <p>
          Selecione um trecho para ver a <strong>barra de formatação</strong> (negrito, itálico, riscado, código,
          link de nota e link de site) — ou use <Kbd>Ctrl</Kbd> + <Kbd>B</Kbd>/<Kbd>I</Kbd>/<Kbd>E</Kbd>. Ao passar o
          mouse num bloco aparecem o <strong>+</strong> (novo bloco) e o <strong>⋮⋮</strong> (transformar, mover,
          duplicar, excluir). <Kbd>Alt</Kbd> + <Kbd>Shift</Kbd> + <Kbd>↑</Kbd>/<Kbd>↓</Kbd> move o bloco.
        </p>
        <p>
          O bloco de <strong>destaque</strong> é uma caixa colorida com ícone; clique no ícone para alternar entre informação,
          dica, aviso, perigo e nota. Ele é salvo como <Codigo>&gt; [!dica] texto</Codigo>, o mesmo formato de “callout” do Obsidian.
          Para <strong>marca-texto</strong>, selecione o trecho e use o botão da barra (ou <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> +{" "}
          <Kbd>H</Kbd>); no Markdown fica <Codigo>==assim==</Codigo>.
        </p>
        <p>
          No <strong>bloco de código</strong> as cores aparecem enquanto você digita. Escreva a linguagem no canto do bloco
          (ex.: <Codigo>python</Codigo>, <Codigo>js</Codigo>, <Codigo>sql</Codigo>) ou deixe em branco: o SprintNote detecta
          sozinho e mostra “(detectada)”. O botão <strong>Copiar</strong> copia o código.
        </p>
        <p>
          Digite <Codigo>/</Codigo> para o menu de blocos — continue digitando para filtrar (ex.: <Codigo>/tab</Codigo>):
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Comando</th>
                <th className="px-3 py-2 font-medium">Atalho</th>
              </tr>
            </thead>
            <tbody>
              {comandosEditor.map((comando) => (
                <tr key={comando.id} className="border-t">
                  <td className="px-3 py-1.5 text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <comando.icone className="size-4" /> {comando.rotulo}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">{comando.atalho ? <Codigo>{comando.atalho}</Codigo> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      <Secao id="links" titulo="Conectando notas e livros">
        <p>
          Digite <Codigo>[[</Codigo> em qualquer nota para abrir a lista de notas e livros. Os formatos são:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><Codigo>[[Nota]]</Codigo> — liga a uma nota (se houver nomes repetidos, prefere a do mesmo livro);</li>
          <li><Codigo>[[Livro]]</Codigo> — liga a um livro inteiro;</li>
          <li><Codigo>[[Livro/Nota]]</Codigo> — liga a uma nota de um livro específico;</li>
          <li><Codigo>[[Nota|texto]]</Codigo> — mostra outro texto no lugar do nome.</li>
        </ul>
        <p>
          Links para notas que não existem aparecem tracejados: clique para criá-las. No botão <strong>Conexões</strong>,
          no topo da nota, ficam as
          <strong> Referências</strong> (quem aponta para ela), os <strong>links</strong> que ela faz, as{" "}
          <strong>sugestões de conexão</strong> (quando o texto cita o nome de outra nota sem link — o botão
          <strong> Linkar</strong> resolve) e um <strong>mapa</strong> com as conexões próximas. Renomear uma nota ou um
          livro atualiza os links em todas as notas.
        </p>
      </Secao>

      <Secao id="grafo" titulo="Grafo de conexões">
        <p>
          O <Link href="/grafo" className="text-primary underline underline-offset-4">grafo</Link> mostra a biblioteca
          como no Obsidian: <strong>quadrados</strong> são livros, <strong>círculos</strong> são notas (com a cor do
          livro) e <strong>círculos tracejados</strong> são notas citadas que ainda não existem. Linhas contínuas são
          links; tracejadas ligam a nota ao livro ou à nota pai.
        </p>
        <p>
          Arraste o fundo para mover, use a roda do mouse para zoom, arraste os nós para organizar e passe o mouse para
          destacar as conexões. Clique para abrir. Os botões no topo filtram livros e tipos de ligação.
        </p>
        <p>
          Para criar ligações pelo grafo, ative <strong>Conectar notas</strong>, clique na nota de origem e depois no
          destino (nota ou livro): o link entra na seção “Conexões” da nota de origem. O painel ao lado ajuda a
          completar a biblioteca com <strong>sugestões de conexão</strong>, <strong>notas ainda não criadas</strong> e
          <strong> notas sem conexão</strong>.
        </p>
      </Secao>

      <Secao id="tags" titulo="Tags">
        <p>
          Abaixo do título de cada nota fica a linha de tags: clique no <strong>+</strong>, digite e aperte <Kbd>Enter</Kbd>
          (ou <Kbd>Tab</Kbd> para usar a sugestão). O <strong>×</strong> remove. Também dá para escrever{" "}
          <Codigo>#assunto</Codigo> em qualquer lugar do texto — ao digitar <Codigo>#</Codigo> e uma letra, o editor sugere as tags
          que você já usa; essas aparecem na linha com borda. Tags com barra (<Codigo>#projeto/fase-1</Codigo>) também
          aparecem dentro de <Codigo>#projeto</Codigo>.
        </p>
        <p>
          Clique numa tag para ver todas as notas marcadas com ela, ou abra <Link href="/tags" className="text-primary underline underline-offset-4">Tags</Link>
          {" "}na sidebar. As tags também aparecem na busca e, ativando a opção “Tags”, como pontos no grafo.
        </p>
      </Secao>

      <Secao id="prazos" titulo="Prazos nas tarefas">
        <p>
          Em qualquer tarefa de nota, escreva um prazo com <Codigo>@</Codigo>: <Codigo>@hoje</Codigo>, <Codigo>@amanhã</Codigo>,{" "}
          <Codigo>@sex</Codigo> (próxima sexta), <Codigo>@25/10</Codigo> ou <Codigo>@25/10/2026</Codigo>. O prazo vira uma etiqueta
          com a data e a tarefa entra em <Link href="/tarefas" className="text-primary underline underline-offset-4">Tarefas</Link> no dia certo.
        </p>
      </Secao>

      <Secao id="busca" titulo="Busca rápida">
        <p>
          Pressione <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> (ou <Kbd>⌘</Kbd> + <Kbd>K</Kbd> no Mac), ou clique em
          <strong> Buscar</strong> na sidebar. A busca procura no título e no conteúdo das notas, nos cartões do
          Kanban e oferece ações rápidas como criar nota e alternar o tema.
        </p>
      </Secao>

      <Secao id="kanban" titulo="Kanban">
        <p>
          O <Link href="/kanban" className="text-primary underline underline-offset-4">Kanban</Link> pode ter{" "}
          <strong>vários quadros</strong> (um por projeto, matéria ou sprint). No topo você renomeia o quadro clicando no nome,
          troca o ícone, alterna entre quadros pelo botão <strong>Quadros</strong> e, no <strong>⋯</strong>, muda o fundo,
          gerencia as etiquetas, cria colunas ou exclui o quadro.
        </p>
        <p>
          <strong>Colunas:</strong> clique no nome para renomear e arraste pela alça <strong>⋮⋮</strong> para reordenar. No ⋯ da
          coluna dá para escolher a cor, um <strong>limite de cartões</strong> (o contador fica vermelho quando passa), marcar como
          <strong> coluna de concluídos</strong> (conta no progresso), mover, recolher e excluir — escolhendo para onde vão os cartões.
          “Adicionar coluna” fica no fim do quadro.
        </p>
        <p>
          <strong>Cartões:</strong> arraste entre colunas ou para reordenar (pelo teclado: foque o cartão, <Kbd>Espaço</Kbd>, setas e
          <Kbd> Espaço</Kbd>). Clique para abrir e editar — tudo salva na hora: título, <strong>etiquetas</strong> coloridas, descrição,
          <strong> prazo</strong>, <strong>cor</strong>, <strong>checklist</strong> com progresso, nota vinculada e “Mover para” outra coluna
          ou outro quadro. O ⋯ do cartão duplica ou exclui. A busca e as etiquetas no topo filtram o quadro.
        </p>
        <p>
          <strong>O que aparece no cartão:</strong> no ⋯ do quadro, em <strong>Mostrar nos cartões</strong>, escolha etiquetas, prazo,
          trecho da descrição, nota vinculada, faixa de cor e como mostrar a checklist (oculta, só o progresso ou os itens — que
          dá para marcar direto no cartão). Ligue a <strong>caixa para concluir</strong> para marcar o cartão como feito sem abrir:
          ele vai para a coluna de concluídos (desmarcar devolve para a primeira coluna).
        </p>
      </Secao>

      <Secao id="dados" titulo="Conta e dados">
        <p>
          Tudo fica salvo na <strong>sua conta</strong>, num banco no Brasil (São Paulo): entre em qualquer navegador e seus
          livros, notas, tarefas, hábitos, rotina e quadros aparecem. Cada mudança é salva sozinha — o rodapé da sidebar mostra
          “Tudo salvo na nuvem”. Ao sair da conta, a cópia deste navegador é apagada.
        </p>
        <p>
          Em <Link href="/conta" className="text-primary underline underline-offset-4">Minha conta</Link> você corrige o nome,
          troca a senha, baixa todos os seus dados (.json), exporta as notas em <strong>Markdown</strong> (.zip com uma pasta
          por livro, que abre no Obsidian), importa um backup antigo e, se quiser, exclui a conta.
        </p>
      </Secao>

      <Secao id="creditos" titulo="Créditos">
        <p>
          Desenvolvido por <strong>Rafael Marques</strong>, 2026. Inspirado no Notion e no Obsidian.
        </p>
        <ul className="grid gap-1 sm:grid-cols-2">
          {tecnologias.map((tecnologia) => (
            <li key={tecnologia.nome}>
              <strong>{tecnologia.nome}</strong> — {tecnologia.uso}
            </li>
          ))}
        </ul>
      </Secao>
    </Pagina>
  )
}
