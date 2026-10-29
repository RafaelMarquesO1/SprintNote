-- Rafael Marques - 29/10/2026
-- Número do cartão no quadro (#12), para aparecer no cartão e na URL.
-- Só acrescenta a coluna e preenche os cartões que já existem pela ordem de criação (a mesma
-- ordem que o app usava para calcular o número): nada do que já existe é alterado ou apagado.

ALTER TABLE cartoes_equipe
  ADD COLUMN IF NOT EXISTS numero integer CHECK (numero IS NULL OR (numero > 0 AND numero < 1000000));

UPDATE cartoes_equipe AS c
SET numero = n.posicao
FROM (
  SELECT quadro_id, id, row_number() OVER (PARTITION BY quadro_id ORDER BY criado_em, id) AS posicao
  FROM cartoes_equipe
) AS n
WHERE c.quadro_id = n.quadro_id AND c.id = n.id AND c.numero IS NULL;
