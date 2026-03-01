-- ============================================================
-- RBAC + RLS para operador de pedidos (Globo Agua)
-- Execute no Supabase SQL Editor
-- ============================================================

BEGIN;

-- 1) Profiles.role (admin | operador_pedidos | cliente)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text;

UPDATE public.profiles
SET role = CASE
  WHEN coalesce(is_admin, false) THEN 'admin'
  WHEN role = 'operador_pedidos' THEN 'operador_pedidos'
  ELSE 'cliente'
END
WHERE role IS NULL OR role NOT IN ('admin', 'operador_pedidos', 'cliente');

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'cliente';

ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('admin', 'operador_pedidos', 'cliente'));
  END IF;
END $$;

-- Mantem compatibilidade da funcao de admin com o novo role
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
  v_is_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT p.role, p.is_admin
    INTO v_role, v_is_admin
    FROM public.profiles p
   WHERE p.id = auth.uid();

  v_role := lower(coalesce(v_role, ''));

  IF v_role IN ('admin', 'operador_pedidos') THEN
    RETURN v_role;
  END IF;

  IF coalesce(v_is_admin, false) THEN
    RETURN 'admin';
  END IF;

  RETURN 'cliente';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.current_profile_role() = 'admin';
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- 2) RLS nas tabelas de pedidos
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Limpa policies antigas de orders
DROP POLICY IF EXISTS "orders_self" ON public.orders;
DROP POLICY IF EXISTS "orders_select_self" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_self" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
DROP POLICY IF EXISTS "orders_select_admin_operador" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_owner" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;

-- Select somente admin/operador
CREATE POLICY "orders_select_admin_operador" ON public.orders
  FOR SELECT TO authenticated
  USING (public.current_profile_role() IN ('admin', 'operador_pedidos'));

-- Mantem criacao de pedido para usuario dono (app)
CREATE POLICY "orders_insert_owner" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Delete direto: apenas admin
CREATE POLICY "orders_delete_admin" ON public.orders
  FOR DELETE TO authenticated
  USING (public.current_profile_role() = 'admin');

-- Sem policy de UPDATE em orders: bloqueia update direto para usuarios comuns.
-- Reforco no nivel de privilegio SQL:
REVOKE UPDATE ON public.orders FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.orders TO authenticated;

-- Limpa policies antigas de order_items
DROP POLICY IF EXISTS "order_items_self" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_self" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_self" ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_all" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_admin_operador" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_owner" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;

-- Select somente admin/operador
CREATE POLICY "order_items_select_admin_operador" ON public.order_items
  FOR SELECT TO authenticated
  USING (public.current_profile_role() IN ('admin', 'operador_pedidos'));

-- Mantem insert de itens para o dono do pedido
CREATE POLICY "order_items_insert_owner" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

-- Admin pode manter operacoes de manutencao em itens
CREATE POLICY "order_items_update_admin" ON public.order_items
  FOR UPDATE TO authenticated
  USING (public.current_profile_role() = 'admin')
  WITH CHECK (public.current_profile_role() = 'admin');

CREATE POLICY "order_items_delete_admin" ON public.order_items
  FOR DELETE TO authenticated
  USING (public.current_profile_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;

-- 3) Historico de status (opcional recomendado)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_status_history' AND column_name = 'status_anterior'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_status_history' AND column_name = 'old_status'
  ) THEN
    ALTER TABLE public.order_status_history RENAME COLUMN status_anterior TO old_status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_status_history' AND column_name = 'status_novo'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_status_history' AND column_name = 'new_status'
  ) THEN
    ALTER TABLE public.order_status_history RENAME COLUMN status_novo TO new_status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_status_history' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_status_history' AND column_name = 'changed_at'
  ) THEN
    ALTER TABLE public.order_status_history RENAME COLUMN created_at TO changed_at;
  END IF;
END $$;

ALTER TABLE public.order_status_history
  ALTER COLUMN changed_at SET DEFAULT now();

UPDATE public.order_status_history
SET new_status = coalesce(new_status, old_status, 'NOVO')
WHERE new_status IS NULL;

ALTER TABLE public.order_status_history
  ALTER COLUMN new_status SET NOT NULL;

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_status_history_select_admin_operador" ON public.order_status_history;

CREATE POLICY "order_status_history_select_admin_operador" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (public.current_profile_role() IN ('admin', 'operador_pedidos'));

GRANT SELECT ON public.order_status_history TO authenticated;

-- 4) RPC para atualizar status com validacao de role e status
DROP FUNCTION IF EXISTS public.set_order_status(uuid, text);

CREATE OR REPLACE FUNCTION public.set_order_status(p_order_id uuid, p_status text)
RETURNS TABLE(order_id uuid, old_status text, new_status text, changed_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
  v_old_status text;
  v_new_status text;
  v_changed_at timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado' USING ERRCODE = '42501';
  END IF;

  v_role := public.current_profile_role();
  IF v_role NOT IN ('admin', 'operador_pedidos') THEN
    RAISE EXCEPTION 'Sem permissao para alterar status de pedido' USING ERRCODE = '42501';
  END IF;

  v_new_status := upper(trim(coalesce(p_status, '')));
  IF v_new_status NOT IN ('NOVO', 'CONFIRMADO', 'PRODUCAO', 'ENTREGUE', 'CANCELADO') THEN
    RAISE EXCEPTION 'Status invalido: %', p_status USING ERRCODE = '22023';
  END IF;

  SELECT o.status
    INTO v_old_status
    FROM public.orders o
   WHERE o.id = p_order_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido nao encontrado: %', p_order_id USING ERRCODE = 'P0002';
  END IF;

  IF v_old_status <> v_new_status THEN
    UPDATE public.orders
       SET status = v_new_status
     WHERE id = p_order_id;

    INSERT INTO public.order_status_history(order_id, old_status, new_status, changed_by, changed_at)
    VALUES (p_order_id, v_old_status, v_new_status, auth.uid(), v_changed_at);
  END IF;

  RETURN QUERY
  SELECT p_order_id, v_old_status, v_new_status, v_changed_at;
END;
$$;

REVOKE ALL ON FUNCTION public.set_order_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid, text) TO authenticated;

COMMIT;

-- Exemplo para promover um usuario para operador de pedidos:
-- UPDATE public.profiles p
--    SET role = 'operador_pedidos', is_admin = false
--   FROM auth.users u
--  WHERE u.id = p.id
--    AND u.email = 'operador@seudominio.com';
