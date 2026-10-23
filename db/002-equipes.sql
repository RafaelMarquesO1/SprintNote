-- Rafael Marques - 23/10/2026
-- Equipes, convites e quadros compartilhados do Kanban (veja docs/plano-equipes.md).
-- Só acrescenta: não altera nem apaga nada do que já existe, exceto a coluna
-- nova "foto" em usuarios.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto text;

CREATE TABLE IF NOT EXISTS equipes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL CHECK (char_length(nome) BETWEEN 1 AND 80),
  criada_por uuid REFERENCES usuarios (id) ON DELETE SET NULL,
  criada_em  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membros_equipe (
  equipe_id  uuid NOT NULL REFERENCES equipes (id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  papel      text NOT NULL CHECK (papel IN ('dono', 'editor', 'leitor')),
  entrou_em  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (equipe_id, usuario_id)
);
CREATE INDEX IF NOT EXISTS membros_equipe_usuario ON membros_equipe (usuario_id);

-- Convite por link: o token só existe no link; no banco fica o hash. Uso único.
CREATE TABLE IF NOT EXISTS convites_equipe (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id  uuid NOT NULL REFERENCES equipes (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  papel      text NOT NULL CHECK (papel IN ('editor', 'leitor')),
  email      text,
  criado_por uuid REFERENCES usuarios (id) ON DELETE SET NULL,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  expira_em  timestamptz NOT NULL,
  aceito_em  timestamptz,
  aceito_por uuid REFERENCES usuarios (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS convites_equipe_equipe ON convites_equipe (equipe_id);

CREATE TABLE IF NOT EXISTS quadros_equipe (
  id            text PRIMARY KEY,
  equipe_id     uuid NOT NULL REFERENCES equipes (id) ON DELETE CASCADE,
  titulo        text NOT NULL DEFAULT 'Novo quadro' CHECK (char_length(titulo) <= 120),
  icone         text NOT NULL DEFAULT 'lista',
  fundo         text,
  exibicao      jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Sobe a cada gravação: o navegador só baixa o quadro quando esse número muda.
  versao        bigint NOT NULL DEFAULT 1,
  criado_por    uuid REFERENCES usuarios (id) ON DELETE SET NULL,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quadros_equipe_equipe ON quadros_equipe (equipe_id);

-- Os ids das colunas/cartões são curtos e criados no navegador: só valem dentro do quadro.
CREATE TABLE IF NOT EXISTS colunas_equipe (
  quadro_id text NOT NULL REFERENCES quadros_equipe (id) ON DELETE CASCADE,
  id        text NOT NULL,
  titulo    text NOT NULL DEFAULT '' CHECK (char_length(titulo) <= 120),
  cor       text,
  limite    integer,
  concluida boolean NOT NULL DEFAULT false,
  recolhida boolean NOT NULL DEFAULT false,
  ordem     double precision NOT NULL DEFAULT 0,
  PRIMARY KEY (quadro_id, id)
);

CREATE TABLE IF NOT EXISTS etiquetas_equipe (
  quadro_id text NOT NULL REFERENCES quadros_equipe (id) ON DELETE CASCADE,
  id        text NOT NULL,
  nome      text NOT NULL DEFAULT '' CHECK (char_length(nome) <= 60),
  cor       text NOT NULL DEFAULT '',
  ordem     double precision NOT NULL DEFAULT 0,
  PRIMARY KEY (quadro_id, id)
);

CREATE TABLE IF NOT EXISTS cartoes_equipe (
  quadro_id      text NOT NULL,
  id             text NOT NULL,
  coluna_id      text NOT NULL,
  titulo         text NOT NULL DEFAULT '' CHECK (char_length(titulo) <= 300),
  descricao      text NOT NULL DEFAULT '' CHECK (char_length(descricao) <= 20000),
  ordem          double precision NOT NULL DEFAULT 0,
  etiquetas      jsonb NOT NULL DEFAULT '[]'::jsonb,
  prazo          text,
  cor            text,
  prioridade     text CHECK (prioridade IN ('baixa', 'media', 'alta')),
  arquivado      boolean NOT NULL DEFAULT false,
  checklist      jsonb NOT NULL DEFAULT '[]'::jsonb,
  responsavel_id uuid REFERENCES usuarios (id) ON DELETE SET NULL,
  criado_por     uuid REFERENCES usuarios (id) ON DELETE SET NULL,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quadro_id, id),
  FOREIGN KEY (quadro_id, coluna_id) REFERENCES colunas_equipe (quadro_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS cartoes_equipe_responsavel ON cartoes_equipe (responsavel_id);

-- Comentários e histórico só crescem (não entram na briga de edição do cartão).
-- O autor é sempre quem estava logado no servidor; o nome fica gravado para
-- continuar aparecendo, e vira "Ex-membro" se a pessoa excluir a conta.
CREATE TABLE IF NOT EXISTS comentarios_cartao (
  quadro_id  text NOT NULL,
  id         text NOT NULL,
  cartao_id  text NOT NULL,
  autor_id   uuid REFERENCES usuarios (id) ON DELETE SET NULL,
  autor_nome text NOT NULL DEFAULT '',
  texto      text NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 4000),
  criado_em  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quadro_id, id),
  FOREIGN KEY (quadro_id, cartao_id) REFERENCES cartoes_equipe (quadro_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS atividade_cartao (
  quadro_id  text NOT NULL,
  id         text NOT NULL,
  cartao_id  text NOT NULL,
  autor_id   uuid REFERENCES usuarios (id) ON DELETE SET NULL,
  autor_nome text NOT NULL DEFAULT '',
  texto      text NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 300),
  criado_em  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quadro_id, id),
  FOREIGN KEY (quadro_id, cartao_id) REFERENCES cartoes_equipe (quadro_id, id) ON DELETE CASCADE
);
