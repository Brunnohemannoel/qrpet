/*
  # Corrigir coluna species para especie

  1. Alterações
    - Remover coluna species se existir
    - Garantir que a coluna especie está correta
    - Atualizar constraints

  2. Notas
    - Preserva dados existentes
    - Mantém consistência com o modelo de dados atual
*/

-- Remover coluna species se existir e garantir que especie está correta
DO $$ 
BEGIN
  -- Remover coluna species se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'species'
  ) THEN
    ALTER TABLE pets DROP COLUMN species;
  END IF;

  -- Garantir que a coluna especie existe e está correta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'especie'
  ) THEN
    ALTER TABLE pets ADD COLUMN especie text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Atualizar constraints
ALTER TABLE pets 
  ALTER COLUMN especie SET NOT NULL,
  ALTER COLUMN especie DROP DEFAULT;