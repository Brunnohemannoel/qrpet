/*
  # Configuração do Storage e Ajustes na Tabela de Pets

  1. Storage
    - Criar bucket 'pets' para armazenar fotos dos pets
    - Configurar políticas de acesso ao storage

  2. Ajustes
    - Adicionar políticas de storage para permitir upload de imagens
    - Garantir que usuários autenticados possam fazer upload
*/

-- Criar bucket para fotos dos pets se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('pets', 'pets', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de imagens por usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pets' AND
  (storage.foldername(name))[1] = 'pet-photos'
);

-- Política para permitir leitura pública das imagens
CREATE POLICY "Acesso público para visualização de imagens"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pets');