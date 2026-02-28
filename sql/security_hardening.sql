-- ============================================================
-- SECURITY HARDENING - GLOBO AGUA
-- Execute este script no Supabase SQL Editor (produção).
-- ============================================================
--
-- IMPORTANTE (manual, obrigatório):
-- 1) Rotacione IMEDIATAMENTE as chaves anon/service_role no Supabase.
-- 2) Garanta que service_role nunca volte para frontend/config.js.
--
-- ============================================================
-- 1) RLS: políticas mais restritivas e com trilha de admin
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas (se existirem)
DROP POLICY IF EXISTS "profiles_self" ON public.profiles;
DROP POLICY IF EXISTS "products_read" ON public.products;
DROP POLICY IF EXISTS "products_admin" ON public.products;
DROP POLICY IF EXISTS "produtos_publico" ON public.products;
DROP POLICY IF EXISTS "companies_read" ON public.companies;
DROP POLICY IF EXISTS "prices_read" ON public.company_prices;
DROP POLICY IF EXISTS "orders_self" ON public.orders;
DROP POLICY IF EXISTS "order_items_self" ON public.order_items;
DROP POLICY IF EXISTS "settings_read" ON public.settings;

DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "products_read_public" ON public.products;
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
DROP POLICY IF EXISTS "companies_admin_all" ON public.companies;
DROP POLICY IF EXISTS "company_prices_admin_all" ON public.company_prices;
DROP POLICY IF EXISTS "company_prices_self_read" ON public.company_prices;
DROP POLICY IF EXISTS "orders_select_self" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_self" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
DROP POLICY IF EXISTS "order_items_select_self" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_self" ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_all" ON public.order_items;
DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
DROP POLICY IF EXISTS "settings_admin_all" ON public.settings;

-- Profiles: usuário só no próprio perfil; admin gerencia todos.
CREATE POLICY "profiles_select_self" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Products: leitura pública de ativos + admin total.
CREATE POLICY "products_read_public" ON public.products
  FOR SELECT TO anon, authenticated
  USING (ativo = true);

CREATE POLICY "products_admin_all" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Companies: somente admin acessa.
CREATE POLICY "companies_admin_all" ON public.companies
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Company prices: admin total; cliente PJ só lê o CNPJ do próprio perfil.
CREATE POLICY "company_prices_admin_all" ON public.company_prices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "company_prices_self_read" ON public.company_prices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo_pessoa = 'PJ'
        AND regexp_replace(coalesce(p.documento, ''), '\D', '', 'g') =
            regexp_replace(coalesce(company_prices.cnpj, ''), '\D', '', 'g')
    )
  );

-- Orders: cliente só cria e lê os próprios pedidos; admin total.
CREATE POLICY "orders_select_self" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_self" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Order items: cliente só cria/lê itens dos próprios pedidos; admin total.
CREATE POLICY "order_items_select_self" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_insert_self" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Settings: frontend lê apenas chaves públicas; admin gerencia tudo.
CREATE POLICY "settings_public_read" ON public.settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('geral', 'entrega', 'gateway_pagamento', 'webhook_speedit'));

CREATE POLICY "settings_admin_all" ON public.settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 2) Proteções extras em dados sensíveis
-- ============================================================

-- Bloqueia auto-elevação de privilégio via is_admin no próprio profile.
CREATE OR REPLACE FUNCTION public.protect_profile_admin_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.is_admin := OLD.is_admin;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS t_profiles_protect_admin ON public.profiles;
CREATE TRIGGER t_profiles_protect_admin
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_admin_flag();

-- ============================================================
-- 3) Integridade de preço e total do pedido (anti-fraude client-side)
-- ============================================================

CREATE OR REPLACE FUNCTION public.resolve_order_item_price(p_order_id uuid, p_product_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cnpj text;
  v_price numeric;
BEGIN
  SELECT regexp_replace(coalesce(o.cliente_documento, ''), '\D', '', 'g')
    INTO v_cnpj
    FROM public.orders o
   WHERE o.id = p_order_id;

  IF coalesce(v_cnpj, '') <> '' THEN
    SELECT cp.preco_especial
      INTO v_price
      FROM public.company_prices cp
     WHERE cp.product_id = p_product_id
       AND regexp_replace(coalesce(cp.cnpj, ''), '\D', '', 'g') = v_cnpj
     ORDER BY cp.updated_at DESC NULLS LAST, cp.created_at DESC
     LIMIT 1;
  END IF;

  IF v_price IS NULL THEN
    SELECT p.preco_padrao
      INTO v_price
      FROM public.products p
     WHERE p.id = p_product_id;
  END IF;

  RETURN coalesce(v_price, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_order_item_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.quantidade := greatest(1, coalesce(NEW.quantidade, 1));
  NEW.preco_unitario := public.resolve_order_item_price(NEW.order_id, NEW.product_id);
  NEW.subtotal := coalesce(NEW.preco_unitario, 0) * NEW.quantidade;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS t_order_items_price ON public.order_items;
CREATE TRIGGER t_order_items_price
BEFORE INSERT OR UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.apply_order_item_price();

CREATE OR REPLACE FUNCTION public.recalc_order_totals(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub numeric;
BEGIN
  SELECT coalesce(sum(oi.subtotal), 0)
    INTO v_sub
    FROM public.order_items oi
   WHERE oi.order_id = p_order_id;

  UPDATE public.orders o
     SET subtotal = v_sub,
         total = v_sub + coalesce(o.taxa_entrega, 0),
         updated_at = now()
   WHERE o.id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.order_items_recalc_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_order_totals(OLD.order_id);
  ELSE
    PERFORM public.recalc_order_totals(NEW.order_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS t_order_items_recalc ON public.order_items;
CREATE TRIGGER t_order_items_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.order_items_recalc_trigger();

-- ============================================================
-- 4) Storage: upload/delete só admin (bucket produtos)
-- ============================================================

DROP POLICY IF EXISTS "produtos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "produtos_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "produtos_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "produtos_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "produtos_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "produtos_admin_update" ON storage.objects;

CREATE POLICY "produtos_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'produtos');

CREATE POLICY "produtos_admin_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'produtos' AND public.is_admin());

CREATE POLICY "produtos_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'produtos' AND public.is_admin());

CREATE POLICY "produtos_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'produtos' AND public.is_admin())
  WITH CHECK (bucket_id = 'produtos' AND public.is_admin());
