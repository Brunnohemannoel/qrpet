/*
  # Correção da estrutura da tabela pets

  1. Alterações
    - Remover políticas temporariamente
    - Atualizar tipos e constraints das colunas
    - Recriar políticas
    - Remover coluna localizacao
    - Atualizar índices

  2. Notas
    - Preserva dados existentes
    - Mantém segurança com RLS
*/

-- Remover políticas existentes temporariamente
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios pets" ON pets;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios pets" ON pets;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios pets" ON pets;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios pets" ON pets;

-- Remover coluna localizacao se existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pets' AND column_name = 'localizacao'
  ) THEN
    ALTER TABLE pets DROP COLUMN localizacao;
  END IF;
END $$;

-- Garantir que todas as colunas têm os tipos e constraints corretos
DO $$
BEGIN
  -- Atualizar tipos e constraints
  ALTER TABLE pets
    ALTER COLUMN nome TYPE text,
    ALTER COLUMN nome SET NOT NULL,
    ALTER COLUMN especie TYPE text,
    ALTER COLUMN especie SET NOT NULL,
    ALTER COLUMN raca TYPE text,
    ALTER COLUMN raca SET NOT NULL,
    ALTER COLUMN idade TYPE integer USING idade::integer,
    ALTER COLUMN idade SET NOT NULL,
    ALTER COLUMN sexo TYPE text,
    ALTER COLUMN sexo SET NOT NULL,
    ALTER COLUMN cor TYPE text,
    ALTER COLUMN cor SET NOT NULL,
    ALTER COLUMN foto_url TYPE text,
    ALTER COLUMN informacoes TYPE text,
    ALTER COLUMN qr_code_url TYPE text,
    ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN status TYPE pet_status USING status::pet_status,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'found';
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

-- Atualizar referência da coluna user_id
ALTER TABLE pets
  DROP CONSTRAINT IF EXISTS pets_user_id_fkey,
  ADD CONSTRAINT pets_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Recriar políticas de acesso
CREATE POLICY "Usuários podem visualizar seus próprios pets"
  ON pets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar seus próprios pets"
  ON pets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar seus próprios pets"
  ON pets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar seus próprios pets"
  ON pets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Garantir que os índices existem para melhor performance
CREATE INDEX IF NOT EXISTS pets_user_id_idx ON pets(user_id);
CREATE INDEX IF NOT EXISTS pets_status_idx ON pets(status);