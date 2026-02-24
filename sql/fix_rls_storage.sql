-- FIX: Permite leitura de produtos sem login (anon)
DROP POLICY IF EXISTS "products_read" ON public.products;
CREATE POLICY "products_read" ON public.products
  FOR SELECT TO anon, authenticated USING (ativo = true);

-- FIX: Admin pode gerenciar produtos
CREATE POLICY "products_admin" ON public.products
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- STORAGE: Bucket para fotos de produtos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('produtos', 'produtos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "produtos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "produtos_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "produtos_auth_delete" ON storage.objects;

CREATE POLICY "produtos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'produtos');

CREATE POLICY "produtos_auth_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'produtos');

CREATE POLICY "produtos_auth_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'produtos');
