-- Adicionar políticas para acesso público aos pets e profiles
CREATE POLICY "Acesso público para visualização de pets"
  ON pets FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Acesso público limitado aos profiles"
  ON profiles FOR SELECT
  TO anon
  USING (true);

-- Atualizar política existente de profiles para permitir acesso público
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Visualização de perfis"
  ON profiles FOR SELECT
  USING (true);