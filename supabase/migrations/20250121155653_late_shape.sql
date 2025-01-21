/*
  # Criar bucket para fotos de perfil

  1. Novo Bucket
    - Cria o bucket 'avatars' para armazenar fotos de perfil
    - Define o bucket como público para permitir acesso às imagens

  2. Políticas de Segurança
    - Permite upload apenas para usuários autenticados
    - Permite visualização pública das imagens
*/

-- Criar bucket para fotos de perfil se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de imagens por usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de fotos de perfil"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-photos'
);

-- Política para permitir leitura pública das imagens
CREATE POLICY "Acesso público para visualização de fotos de perfil"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Adicionar coluna foto_url na tabela profiles se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'foto_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN foto_url text;
  END IF;
END $$;