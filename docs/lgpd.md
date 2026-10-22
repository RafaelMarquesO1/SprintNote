# SprintNote — Registro de conformidade com a LGPD

Rafael Marques - 22/10/2026 · versão dos documentos: `2026-10-22` (`lib/conta/documentos.ts`)

> Documento interno de prestação de contas (LGPD, Art. 6º, X e Art. 37). Não é parecer jurídico.

## 1. Registro das operações de tratamento (Art. 37)

| Operação | Dados | Titulares | Finalidade | Base legal | Onde fica | Retenção |
|---|---|---|---|---|---|---|
| Cadastro e login | nome, e-mail, hash da senha (scrypt) | usuários | criar e acessar a conta | Execução de contrato — Art. 7º, V | Neon Postgres, `aws-sa-east-1` (São Paulo) | enquanto a conta existir |
| Conteúdo do app | notas, livros, tarefas, hábitos, rotina, Kanban, preferências (JSON por área) | usuários | guardar e sincronizar o conteúdo | Execução de contrato — Art. 7º, V | idem (`dados_usuario`) | enquanto a conta existir |
| Sessões | hash SHA-256 do token, datas | usuários | manter o login | Execução de contrato — Art. 7º, V | idem (`sessoes`) + cookie `sprintnote_sessao` | 30 dias ou até sair |
| Aceite dos documentos | data e versão aceitas | usuários | provar o aceite | Art. 8º, §2º (ônus da prova) | idem (`usuarios`) | enquanto a conta existir |
| Limite de tentativas | e-mail digitado, horário da falha | quem tenta entrar | evitar adivinhação de senha | Legítimo interesse — Art. 7º, IX (segurança) | idem (`tentativas_login`) | 24 horas |

- **Dados sensíveis (Art. 11):** não coletados.
- **Crianças e adolescentes (Art. 14):** o serviço não é voltado a menores; o cadastro exige declarar 18+ ou autorização do responsável.
- **Operadora (Art. 39):** Neon (banco). Dados armazenados no Brasil, sem transferência internacional de armazenamento.
- **Decisões automatizadas (Art. 20):** nenhuma.

## 2. Direitos do titular (Art. 18) → onde estão no app

| Direito | Como o titular exerce | Implementação |
|---|---|---|
| Confirmação e acesso (I, II) | Minha conta → **Baixar meus dados** | `GET /api/conta/exportar` |
| Correção (III) | Minha conta → **Perfil** (nome) e **Senha** | `atualizarNome`, `alterarSenha` |
| Portabilidade (V) | o mesmo arquivo JSON (formato aberto) | `GET /api/conta/exportar` |
| Eliminação (IV, VI) | Minha conta → **Excluir minha conta** (pede a senha) | `excluirConta` + `ON DELETE CASCADE` |
| Informação sobre compartilhamento (VII) | Política de Privacidade, item 4 | `components/conta/documentos-legais.tsx` |
| Outros pedidos | canal do encarregado (Política, item 1) | **pendente: definir o e-mail** |

## 3. Medidas de segurança (Art. 46)

- Senha com scrypt + sal aleatório; comparação em tempo constante; hash falso quando o e-mail não existe (não revela quais e-mails têm conta).
- Sessão: token aleatório de 256 bits em cookie `httpOnly`, `SameSite=Lax`, `Secure` em produção; no banco só o hash SHA-256.
- Limite de 5 falhas de login por e-mail a cada 15 minutos.
- Todas as consultas usam parâmetros (sem SQL montado com texto) e são filtradas pelo usuário da sessão.
- API de dados aceita só chaves `sprintnote-*`, JSON válido e até 20 MB.
- Cabeçalhos: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` (`next.config.ts`).
- Ao sair da conta, a cópia local (localStorage) é apagada; ao entrar, só valem os dados da conta (o que sobrar no navegador é descartado).
- Logs de erro não registram senha nem conteúdo.

## 4. Plano de resposta a incidentes (Art. 48 · Res. CD/ANPD 15/2024)

1. **Conter:** trocar a senha do banco no Neon e a `DATABASE_URL`; apagar todas as sessões (`DELETE FROM sessoes`).
2. **Avaliar:** quais tabelas/dados, quantos titulares, risco relevante?
3. **Comunicar à ANPD em até 3 dias úteis** (comunicação preliminar) e avisar os titulares afetados, se houver risco ou dano relevante.
4. **Relatório completo em até 20 dias úteis.**
5. **Registrar** o incidente e as medidas, mesmo que não seja comunicado.

## 5. Testes de conformidade — 22/10/2026 (ambiente local + banco Neon)

| # | Teste | Resultado |
|---|---|---|
| 1 | Cadastro sem marcar o aceite é bloqueado | ✅ |
| 2 | Aceite gravado com data e versão (`2026-10-22`) | ✅ |
| 3 | Política e Termos abrem no cadastro, na apresentação e em Minha conta | ✅ |
| 4 | Senha guardada só como hash `scrypt$…` | ✅ |
| 5 | Token de sessão guardado só como hash (64 hex) | ✅ |
| 6 | Cookie de sessão invisível ao JavaScript (`httpOnly`) | ✅ |
| 7 | Cabeçalhos de segurança presentes | ✅ |
| 8 | API sem sessão responde 401 (`/api/dados`, `/api/conta/exportar`) | ✅ |
| 9 | API rejeita chave fora do padrão e JSON inválido (400) | ✅ |
| 10 | Exportação traz conta + todo o conteúdo e **não** traz hash de senha/token | ✅ |
| 11 | Correção do nome reflete no banco e no menu | ✅ |
| 12 | Troca de senha exige a atual e encerra as outras sessões | ✅ |
| 13 | "Sair de todos os aparelhos" apaga todas as sessões e a cópia local | ✅ |
| 14 | 6ª tentativa de login errada em 15 min é bloqueada | ✅ |
| 15 | Excluir conta exige senha; apaga usuário, sessões, dados e tentativas (0 linhas órfãs) | ✅ |
| 16 | Sair da conta apaga os dados do navegador | ✅ |
| 17 | Banco na região de São Paulo (`aws-sa-east-1`) | ✅ |
| 18 | Conta nova ignora dados que sobraram no navegador e começa em branco (isolamento entre contas) | ✅ |

## 6. Pendências antes de publicar

- [ ] **Definir o e-mail do encarregado** em `lib/conta/documentos.ts` (`CONTROLADOR.emailEncarregado`) e revisar o nome do controlador (Art. 41).
- [ ] Revisar a Política e os Termos com um profissional jurídico.
- [ ] Se hospedar fora do Brasil (ex.: Vercel com região nos EUA), citar a hospedagem como operadora e o mecanismo de transferência internacional (Arts. 33–36; cláusulas-padrão da Res. CD/ANPD 19/2024).
- [ ] Ao mudar os documentos, trocar `VERSAO_DOCUMENTOS` e avisar os usuários.
