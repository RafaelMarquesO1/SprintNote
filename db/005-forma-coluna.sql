-- Redesign v2 (seção 8.8): cada coluna do quadro de equipe escolhe uma das 5 formas de status
-- (backlog, paused, todo, doing, done). Só acrescenta a coluna; sem valor, o app deduz pelo nome.
-- Precisa rodar no banco de produção ANTES do deploy do redesign (o servidor passa a ler "forma").

ALTER TABLE colunas_equipe
  ADD COLUMN IF NOT EXISTS forma text CHECK (forma IS NULL OR forma IN ('backlog', 'paused', 'todo', 'doing', 'done'));
