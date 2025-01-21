/*
  # Atualização da Estrutura da Tabela Pets

  1. Alterações
    - Modificar colunas existentes
    - Adicionar novas colunas necessárias
    - Preservar relacionamentos existentes

  2. Segurança
    - Manter RLS ativado
    - Atualizar políticas de acesso
*/

-- Atualizar estrutura da tabela pets preservando relacionamentos
DO $$ 
BEGIN
  -- Adicionar/Atualizar colunas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'user_id') THEN
    ALTER TABLE pets ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'nome') THEN
    ALTER TABLE pets ADD COLUMN nome text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'especie') THEN
    ALTER TABLE pets ADD COLUMN especie text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'raca') THEN
    ALTER TABLE pets ADD COLUMN raca text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'idade') THEN
    ALTER TABLE pets ADD COLUMN idade integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'sexo') THEN
    ALTER TABLE pets ADD COLUMN sexo text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'cor') THEN
    ALTER TABLE pets ADD COLUMN cor text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'foto_url') THEN
    ALTER TABLE pets ADD COLUMN foto_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'informacoes') THEN
    ALTER TABLE pets ADD COLUMN informacoes text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'localizacao') THEN
    ALTER TABLE pets ADD COLUMN localizacao text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'qr_code_url') THEN
    ALTER TABLE pets ADD COLUMN qr_code_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'created_at') THEN
    ALTER TABLE pets ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pets' AND column_name = 'updated_at') THEN
    ALTER TABLE pets ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Adicionar constraints NOT NULL após garantir que as colunas existem
ALTER TABLE pets 
  ALTER COLUMN nome SET NOT NULL,
  ALTER COLUMN especie SET NOT NULL,
  ALTER COLUMN idade SET NOT NULL,
  ALTER COLUMN sexo SET NOT NULL,
  ALTER COLUMN cor SET NOT NULL,
  ALTER COLUMN localizacao SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL;

-- Garantir que RLS está ativado
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios pets" ON pets;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios pets" ON pets;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios pets" ON pets;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios pets" ON pets;

-- Criar novas políticas de acesso
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

-- Criar ou atualizar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pets_updated_at ON pets;
CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();