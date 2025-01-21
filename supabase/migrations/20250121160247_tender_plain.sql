/*
  # Corrigir tipo enum pet_status

  1. Alterações
    - Criar tipo enum pet_status se não existir
    - Alterar coluna status da tabela pets para usar o tipo enum
    - Definir valor padrão como 'found'

  2. Notas
    - Valores permitidos: 'lost', 'found'
    - Mantém compatibilidade com dados existentes
*/

-- Criar tipo enum se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pet_status') THEN
    CREATE TYPE pet_status AS ENUM ('lost', 'found');
  END IF;
END $$;

-- Alterar coluna status para usar o tipo enum
ALTER TABLE pets 
  ALTER COLUMN status TYPE pet_status USING status::pet_status,
  ALTER COLUMN status SET DEFAULT 'found';