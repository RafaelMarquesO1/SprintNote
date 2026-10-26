-- Rafael Marques - 26/10/2026
-- Kanban das equipes ganha o mesmo que os quadros pessoais: anexos, repetição, bloqueios e
-- estimativa nos cartões, e foto de fundo no quadro.
-- Só acrescenta colunas (com valor padrão): nada do que já existe é alterado ou apagado.

ALTER TABLE cartoes_equipe
  ADD COLUMN IF NOT EXISTS anexos        jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recorrencia   jsonb,
  ADD COLUMN IF NOT EXISTS bloqueado_por jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS estimativa    double precision CHECK (estimativa IS NULL OR (estimativa >= 0 AND estimativa < 1000));

-- A foto de fundo fica fora do download do quadro: ela é baixada à parte (e fica no cache do
-- navegador) só quando "imagem_fundo_versao" muda.
ALTER TABLE quadros_equipe
  ADD COLUMN IF NOT EXISTS imagem_fundo        text CHECK (imagem_fundo IS NULL OR char_length(imagem_fundo) <= 700000),
  ADD COLUMN IF NOT EXISTS imagem_fundo_versao integer NOT NULL DEFAULT 0;
