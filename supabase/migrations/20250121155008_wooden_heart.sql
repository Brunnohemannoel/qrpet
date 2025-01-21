/*
  # Atualização do Schema da Tabela Pets

  1. Alterações
    - Adicionar coluna 'cor' para armazenar a cor do pet
    - Adicionar coluna 'sexo' para armazenar o sexo do pet
    - Garantir que todas as colunas necessárias existam

  2. Segurança
    - Manter as políticas de RLS existentes
*/

-- Adicionar novas colunas à tabela pets se não existirem
DO $$ 
BEGIN
  -- Adicionar coluna cor
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'cor'
  ) THEN
    ALTER TABLE pets ADD COLUMN cor text NOT NULL DEFAULT '';
  END IF;

  -- Adicionar coluna sexo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'sexo'
  ) THEN
    ALTER TABLE pets ADD COLUMN sexo text NOT NULL DEFAULT '';
  END IF;

  -- Garantir que a coluna user_id existe e está correta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE pets ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;

  -- Remover a coluna profile_id se existir (substituída por user_id)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE pets DROP COLUMN profile_id;
  END IF;
END $$;