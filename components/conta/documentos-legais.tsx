"use client"

import { useState } from "react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CONTROLADOR, RETENCAO, VERSAO_DOCUMENTOS } from "@/lib/conta/documentos"
import { cn } from "@/lib/utils"

export type TipoDocumento = "privacidade" | "termos"

const dataVersao = new Date(`${VERSAO_DOCUMENTOS}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">{titulo}</h3>
      {children}
    </section>
  )
}

const contato = CONTROLADOR.emailEncarregado || "e-mail a ser definido pelo controlador antes da publicação"

// Rafael Marques - 22/10/2026
// Política de Privacidade com os itens do Art. 9º da LGPD.
function PoliticaPrivacidade() {
  return (
    <>
      <Secao titulo="1. Quem cuida dos seus dados">
        <p>
          O controlador é <strong>{CONTROLADOR.nome}</strong>. Dúvidas ou pedidos sobre seus dados: <strong>{contato}</strong> (canal do encarregado,
          Art. 41 da LGPD). A maior parte dos pedidos você mesmo resolve em <strong>Minha conta</strong>.
        </p>
      </Secao>
      <Secao titulo="2. Quais dados coletamos">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Cadastro:</strong> nome e e-mail.</li>
          <li><strong>Senha:</strong> guardada só como hash (scrypt) — nem nós conseguimos ver a senha.</li>
          <li><strong>Conteúdo que você cria:</strong> notas, livros, tarefas, hábitos, rotina, quadros do Kanban e preferências da tela.</li>
          <li><strong>Segurança:</strong> data do aceite destes documentos, sessões ativas e tentativas de login que falharam (só o e-mail e o horário).</li>
        </ul>
        <p>Não coletamos dados sensíveis, localização, contatos nem fazemos rastreamento para publicidade.</p>
      </Secao>
      <Secao titulo="3. Para que usamos e com qual base legal">
        <ul className="list-disc space-y-1 pl-5">
          <li>Criar e manter sua conta e guardar seu conteúdo para você acessar de qualquer navegador — <em>execução de contrato</em> (Art. 7º, V).</li>
          <li>Proteger a conta contra acesso indevido (limite de tentativas, sessões) — <em>legítimo interesse</em> (Art. 7º, IX), limitado ao necessário.</li>
        </ul>
        <p>Não vendemos, não usamos para anúncios e não tomamos decisões automatizadas sobre você.</p>
      </Secao>
      <Secao titulo="4. Com quem os dados são compartilhados">
        <p>
          Os dados ficam num banco Postgres operado pela <strong>Neon</strong> (operadora, Art. 39), em servidores na região de{" "}
          <strong>São Paulo (Brasil)</strong>. Não há compartilhamento com outras empresas, salvo obrigação legal ou ordem judicial.
        </p>
      </Secao>
      <Secao titulo="5. Cookies">
        <p>
          Usamos só um cookie <strong>essencial</strong> (<code>sprintnote_sessao</code>) para manter você conectado, válido por {RETENCAO.sessaoDias} dias.
          Não há cookies de análise ou publicidade. O navegador também guarda uma cópia local dos seus dados para o app funcionar rápido; ela é apagada
          quando você sai da conta.
        </p>
      </Secao>
      <Secao titulo="6. Por quanto tempo guardamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Conta e conteúdo: enquanto a conta existir. Ao excluir a conta, tudo é apagado na hora.</li>
          <li>Sessões: até {RETENCAO.sessaoDias} dias ou até você sair.</li>
          <li>Tentativas de login com falha: até {RETENCAO.tentativasLoginHoras} horas.</li>
        </ul>
      </Secao>
      <Secao titulo="7. Seus direitos (Art. 18)">
        <p>Em <strong>Minha conta</strong> você pode, a qualquer momento e sem custo:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>ver e <strong>baixar todos os seus dados</strong> num arquivo JSON (acesso e portabilidade);</li>
          <li><strong>corrigir</strong> seu nome e trocar a senha;</li>
          <li><strong>encerrar as sessões</strong> em todos os aparelhos;</li>
          <li><strong>excluir a conta</strong> e todos os dados (eliminação).</li>
        </ul>
        <p>Para outros pedidos (confirmação de tratamento, informações sobre compartilhamento, revisão), use o contato acima — respondemos em até 15 dias.</p>
      </Secao>
      <Secao titulo="8. Segurança">
        <p>
          Conexões criptografadas (HTTPS/TLS), senha com hash e sal, cookie de sessão <code>httpOnly</code> com token guardado só como hash, isolamento dos
          dados por conta e limite de tentativas de login. Em caso de incidente com risco relevante, avisaremos você e a ANPD nos prazos da Resolução
          CD/ANPD nº 15/2024.
        </p>
      </Secao>
      <Secao titulo="9. Crianças e adolescentes">
        <p>O SprintNote não é voltado a crianças. Menores de 18 anos só devem usar com autorização do responsável legal.</p>
      </Secao>
      <Secao titulo="10. Mudanças nesta política">
        <p>Se esta política mudar, avisaremos no app. Você também pode reclamar à ANPD (gov.br/anpd).</p>
      </Secao>
    </>
  )
}

function TermosUso() {
  return (
    <>
      <Secao titulo="1. O serviço">
        <p>O SprintNote é um app de organização pessoal: notas, tarefas, hábitos, rotina e Kanban, com os dados salvos na sua conta.</p>
      </Secao>
      <Secao titulo="2. Sua conta">
        <ul className="list-disc space-y-1 pl-5">
          <li>Você precisa ter 18 anos ou mais, ou autorização do responsável legal.</li>
          <li>Mantenha sua senha em segredo; você responde pelo que for feito com ela.</li>
          <li>Use um e-mail que seja seu.</li>
        </ul>
      </Secao>
      <Secao titulo="3. Seu conteúdo">
        <p>
          O que você escreve é seu. Guardamos e exibimos o conteúdo só para prestar o serviço a você. Não publique conteúdo ilegal ou dados de outras
          pessoas sem base legal para isso.
        </p>
      </Secao>
      <Secao titulo="4. Disponibilidade">
        <p>
          O serviço é oferecido como está, na versão 1.0. Recomendamos baixar cópias dos seus dados de vez em quando (Minha conta → Baixar meus
          dados).
        </p>
      </Secao>
      <Secao titulo="5. Encerramento">
        <p>Você pode excluir a conta quando quiser em Minha conta. Os dados são apagados na hora, sem cópia guardada.</p>
      </Secao>
      <Secao titulo="6. Privacidade">
        <p>O tratamento de dados pessoais segue a Política de Privacidade e a LGPD (Lei nº 13.709/2018).</p>
      </Secao>
    </>
  )
}

export function DialogoDocumento({ tipo, aberto, aoMudar }: { tipo: TipoDocumento; aberto: boolean; aoMudar: (aberto: boolean) => void }) {
  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent className="flex max-h-[85svh] flex-col gap-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tipo === "privacidade" ? "Política de Privacidade" : "Termos de Uso"}</DialogTitle>
          <DialogDescription>Versão de {dataVersao}</DialogDescription>
        </DialogHeader>
        <div className="-mx-6 min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-2 text-sm leading-relaxed text-muted-foreground">
          {tipo === "privacidade" ? <PoliticaPrivacidade /> : <TermosUso />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Texto que abre um dos documentos (usado no cadastro, na apresentação e em Minha conta).
export function LinkDocumento({ tipo, className, children }: { tipo: TipoDocumento; className?: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button type="button" className={cn("font-medium text-foreground underline underline-offset-4 hover:text-primary", className)} onClick={() => setAberto(true)}>
        {children}
      </button>
      <DialogoDocumento tipo={tipo} aberto={aberto} aoMudar={setAberto} />
    </>
  )
}
