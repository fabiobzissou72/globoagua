-- ============================================================
-- Corrige RLS da tabela settings
-- Execute no Supabase SQL Editor
-- ============================================================

-- Remove políticas anteriores permissivas
DROP POLICY IF EXISTS "settings_read" ON public.settings;
DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
DROP POLICY IF EXISTS "settings_admin_all" ON public.settings;

-- Configurações gerais (nome da loja, entrega) - visíveis sem login
CREATE POLICY "settings_public_read" ON public.settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('geral', 'entrega'));

-- Configurações sensíveis - somente usuários autenticados
CREATE POLICY "settings_auth_read" ON public.settings
  FOR SELECT TO authenticated
  USING (key NOT IN ('geral', 'entrega') AND auth.uid() IS NOT NULL);

-- Admin gerencia tudo
CREATE POLICY "settings_admin_all" ON public.settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
