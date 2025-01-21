/*
  # Corrigir estrutura da tabela pets

  1. Alterações
    - Remover coluna name se existir
    - Garantir que a coluna nome está correta
    - Atualizar constraints

  2. Notas
    - Preserva dados existentes
    - Mantém consistência com o modelo de dados atual
*/

-- Remover coluna name se existir e garantir que nome está correto
DO $$ 
BEGIN
  -- Remover coluna name se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'name'
  ) THEN
    ALTER TABLE pets DROP COLUMN name;
  END IF;

  -- Garantir que a coluna nome existe e está correta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'nome'
  ) THEN
    ALTER TABLE pets ADD COLUMN nome text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Atualizar constraints
ALTER TABLE pets 
  ALTER COLUMN nome SET NOT NULL,
  ALTER COLUMN nome DROP DEFAULT;